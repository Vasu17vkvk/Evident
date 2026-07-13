import traceback
import re
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessageResponse, PersistedChatRequest
from app.services.ai_service import AIService, ask_document
from app.api.deps import get_current_user
from app.services.document_service import DocumentService
from app.services.rag_service import RAGService

router = APIRouter(prefix="/chat", tags=["chat"])


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("", response_model=ChatResponse, status_code=200)
async def chat(body: ChatRequest, current_user: dict = Depends(get_current_user)) -> ChatResponse:
    """
    Answer a question about the provided document text.

    **Request**
    - `question`            — The user's question (max 2 000 characters).
    - `documentText`        — Full text of the document to reason over.
    - `conversationHistory` — Previous turns for follow-up context (max 10).

    **Response**
    - `answer`    — The generated answer.
    - `citations` — Relevant excerpts from the document that support the answer.

    > **Note:** Mock responses are returned until an LLM is integrated.
    """
    try:
        # Logging details
        print(f"[CHAT] Received request: question='{body.question}', documentText length={len(body.documentText)}, conversationHistory length={len(body.conversationHistory)}")
        
        from app.services.ai_service import ask_document

        # Call the gemini generation function using body
        answer = ask_document(
            body.question,
            body.documentText,
            model_name=body.model
        )

        print(f"[CHAT] Gemini successfully answered: {answer[:60]}...")

        return ChatResponse(
            answer=answer,
            citations=[]
        )
    except Exception as e:
        print(f"[CHAT] Error processing request: {e}")
        traceback.print_exc()
        return ChatResponse(
            answer="AI model temporarily unavailable.",
            citations=[]
        )


# ---------------------------------------------------------------------------
# Persistent Chat History Endpoints
# ---------------------------------------------------------------------------

@router.get("/{documentId}", response_model=list[ChatMessageResponse], status_code=200)
async def get_chat_history(documentId: str, current_user: dict = Depends(get_current_user)):
    # Verify ownership
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this chat history"
        )
    try:
        from app.database.mongodb import db
        
        # Retrieve conversation session scoped to this user AND document
        conv = await db.db["conversations"].find_one({
            "documentId": documentId,
            "userId": current_user["_id"]
        })
        if not conv:
            return []
        
        messages = conv.get("messages", [])
        
        # Sort messages by timestamp ascending to guarantee ordering
        try:
            messages.sort(key=lambda m: m.get("timestamp"))
        except Exception:
            pass
            
        response_messages = []
        for msg in messages:
            ts = msg["timestamp"]
            ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
            
            response_messages.append(ChatMessageResponse(
                role=msg["role"],
                content=msg["content"],
                timestamp=ts_str,
                model=msg.get("model"),
                tokenUsage=msg.get("tokenUsage", 0)
            ))
        return response_messages
    except Exception as e:
        print(f"[CHAT] Error fetching chat history: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch chat history: {str(e)}"
        )

@router.post("/{documentId}", response_model=ChatResponse, status_code=200)
async def post_chat_message(documentId: str, body: PersistedChatRequest, current_user: dict = Depends(get_current_user)) -> ChatResponse:
    # Verify ownership
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to post to this chat history"
        )
    try:
        from app.database.mongodb import db
        from app.services.ai_service import ask_document, get_working_model_name
        import datetime

        print(f"[CHAT] Persistent RAG request for doc '{documentId}': question='{body.question}'")
        selected_model = get_working_model_name(body.model)

        # 1. Retrieve relevant semantic context chunks
        context_chunks = await RAGService.retrieve_context(documentId, body.question, limit=5)
        # Fallback to full document text if vector search returned no results
        using_fallback = False
        if not context_chunks:
            context_chunks = body.documentText
            using_fallback = True

        # 2. Get answer from LLM with semantic context
        answer = ask_document(
            body.question,
            context_chunks,
            model_name=body.model
        )
        print(f"[CHAT] Gemini successfully answered persistent request: {answer[:60]}...")

        # Increment document queryCount in MongoDB
        from bson import ObjectId
        try:
            doc_oid = ObjectId(documentId)
        except Exception:
            doc_oid = documentId
        await db.db["documents"].update_one(
            {"_id": doc_oid},
            {"$inc": {"queryCount": 1}}
        )

        # Log chat activity
        doc = await DocumentService.get_document(documentId)
        if doc:
            from app.services.activity_service import ActivityService
            await ActivityService.create_activity(
                user_id=current_user["_id"],
                activity_type="chat",
                action="Asked a question",
                document_name=doc["filename"],
                document_id=documentId
            )

        # 3. Parse page reference citations from answer text
        citations = []
        if not using_fallback and isinstance(context_chunks, list):
            page_matches = re.findall(r"\[Page (\d+)\]", answer)
            seen_pages = set()
            for page_str in page_matches:
                page_num = int(page_str)
                if page_num in seen_pages:
                    continue
                seen_pages.add(page_num)
                # Find matching chunk text
                chunk_text = ""
                chunk_sim = 0.9
                for chunk in context_chunks:
                    if chunk.get("pageNumber") == page_num:
                        chunk_text = chunk["text"]
                        chunk_sim = chunk.get("similarity", 0.9)
                        break
                if chunk_text:
                    citations.append({
                        "text": chunk_text,
                        "page": page_num,
                        "confidence": round(chunk_sim, 2)
                    })

        # 4. Token estimation (approx 4 characters per token)
        if isinstance(context_chunks, list):
            context_len = sum(len(c["text"]) for c in context_chunks)
        else:
            context_len = len(context_chunks)
        prompt_length = context_len + len(body.question)
        user_tokens = max(1, prompt_length // 4)
        assistant_tokens = max(1, len(answer) // 4)

        # 5. Construct user & assistant messages
        user_msg = {
            "role": "user",
            "content": body.question,
            "timestamp": datetime.datetime.utcnow(),
            "model": selected_model,
            "tokenUsage": user_tokens
        }

        assistant_msg = {
            "role": "assistant",
            "content": answer,
            "timestamp": datetime.datetime.utcnow(),
            "model": selected_model,
            "tokenUsage": assistant_tokens
        }

        # 6. Save/push to conversations collection using upsert (scoped per user+document)
        await db.db["conversations"].update_one(
            {"documentId": documentId, "userId": current_user["_id"]},
            {
                "$set": {
                    "userId": current_user["_id"],
                    "updatedAt": datetime.datetime.utcnow()
                },
                "$push": {
                    "messages": {
                        "$each": [user_msg, assistant_msg]
                    }
                }
            },
            upsert=True
        )

        return ChatResponse(
            answer=answer,
            citations=citations
        )
    except Exception as e:
        print(f"[CHAT] Error in persistent chat: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process and store conversation turn: {str(e)}"
        )


