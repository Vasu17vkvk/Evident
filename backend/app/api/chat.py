import traceback
import re
import datetime
import time

from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.chat import (
    ChatRequest, ChatResponse, ChatMessageResponse,
    PersistedChatRequest, ChatSessionResponse,
)
from app.services.ai_service import ask_document, get_working_model_name
from app.api.deps import get_current_user
from app.services.document_service import DocumentService
from app.services.rag_service import RAGService
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])


# ---------------------------------------------------------------------------
# Stateless chat endpoint (no persistence, no document scope)
# ---------------------------------------------------------------------------

@router.post("", response_model=ChatResponse, status_code=200)
async def chat(body: ChatRequest, current_user: dict = Depends(get_current_user)) -> ChatResponse:
    """
    Answer a question about the provided document text (stateless, no persistence).
    """
    try:
        print(f"[CHAT] Received request: question='{body.question}', documentText length={len(body.documentText)}")
        answer = ask_document(body.question, body.documentText, model_name=body.model)
        print(f"[CHAT] Gemini answered: {answer[:60]}...")
        return ChatResponse(answer=answer, citations=[])
    except Exception as e:
        print(f"[CHAT] Error processing request: {e}")
        traceback.print_exc()
        return ChatResponse(answer="AI model temporarily unavailable.", citations=[])


# ---------------------------------------------------------------------------
# DELETE session — must be registered BEFORE /{documentId} routes so FastAPI
# doesn't match the literal string "session" as a documentId.
# ---------------------------------------------------------------------------

@router.delete("/session/{sessionId}", status_code=200)
async def delete_chat_session(sessionId: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a chat session and all its messages.
    Only the session owner can delete it.
    """
    is_owner = await ChatService.verify_session_owner(sessionId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this chat session",
        )
    success = await ChatService.delete_session(sessionId, current_user["_id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat session {sessionId} not found.",
        )
    return {"status": "success", "message": "Chat session deleted"}


# ---------------------------------------------------------------------------
# GET /chat/session/info/{documentId} — fetch session metadata (sessionId)
# Must be registered BEFORE /{documentId} wildcard route.
# ---------------------------------------------------------------------------

@router.get("/session/info/{documentId}", response_model=dict, status_code=200)
async def get_session_info(documentId: str, current_user: dict = Depends(get_current_user)):
    """
    Return the sessionId for the current user's session on this document.
    Creates a new session if none exists. Used by the frontend to track session
    for clear-chat without changing the GET /{documentId} response shape.
    """
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document",
        )
    session = await ChatService.get_or_create_session(documentId, current_user["_id"])
    return {
        "sessionId": session["sessionId"],
        "title": session["title"],
        "createdAt": session["createdAt"].isoformat(),
        "updatedAt": session["updatedAt"].isoformat(),
    }




# ---------------------------------------------------------------------------
# GET /chat/{documentId} — load history (creates session on first call)
# ---------------------------------------------------------------------------

@router.get("/{documentId}", response_model=list[ChatMessageResponse], status_code=200)
async def get_chat_history(documentId: str, current_user: dict = Depends(get_current_user)):
    """
    Return all messages for the current user's session on this document.
    Creates a new (empty) session transparently if none exists yet.
    """
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this chat history",
        )
    try:
        session = await ChatService.get_or_create_session(documentId, current_user["_id"])
        messages = await ChatService.get_messages(session["sessionId"], current_user["_id"])

        response_messages = []
        for msg in messages:
            citations = None
            if msg.get("citations"):
                from app.schemas.chat import Citation
                citations = [Citation(**c) for c in msg["citations"] if isinstance(c, dict)]
            response_messages.append(ChatMessageResponse(
                role=msg["role"],
                content=msg["content"],
                timestamp=msg["createdAt"],
                model=msg.get("model"),
                tokenUsage=msg.get("tokenUsage", 0),
                citations=citations,
            ))
        return response_messages
    except Exception as e:
        print(f"[CHAT] Error fetching chat history: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat history: {str(e)}")


# ---------------------------------------------------------------------------
# POST /chat/{documentId} — ask a question, store user + assistant messages
# ---------------------------------------------------------------------------

@router.post("/{documentId}", response_model=ChatResponse, status_code=200)
async def post_chat_message(
    documentId: str,
    body: PersistedChatRequest,
    current_user: dict = Depends(get_current_user),
) -> ChatResponse:
    """
    Send a question about a document. The user message and assistant answer are
    persisted to chat_messages, associated with a chat_sessions record.
    """
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to post to this chat",
        )
    try:
        from app.database.mongodb import db
        from bson import ObjectId

        print(f"[CHAT] Persistent RAG request for doc '{documentId}': question='{body.question}'")
        selected_model = get_working_model_name(body.model)

        # 1. Get or create session
        session = await ChatService.get_or_create_session(documentId, current_user["_id"])
        session_id = session["sessionId"]

        # 2. Retrieve semantic context — scoped to current user
        context_chunks = await RAGService.retrieve_context(
            documentId, body.question, limit=5, user_id=current_user["_id"]
        )
        using_fallback = not context_chunks
        if using_fallback:
            context_chunks = body.documentText

        # 3. Generate answer
        start_time = time.time()
        answer = ask_document(body.question, context_chunks, model_name=body.model)
        latency = time.time() - start_time
        print(f"[CHAT] Answered in {latency:.2f}s: {answer[:60]}...")

        # 4. Increment document queryCount
        try:
            doc_oid = ObjectId(documentId)
        except Exception:
            doc_oid = documentId
        await db.db["documents"].update_one(
            {"_id": doc_oid, "userId": current_user["_id"]},
            {"$inc": {"queryCount": 1}},
        )

        # 5. Parse citations from answer
        citations = []
        if not using_fallback and isinstance(context_chunks, list):
            page_matches = re.findall(r"\[Page (\d+)\]", answer)
            seen_pages: set[int] = set()
            for page_str in page_matches:
                page_num = int(page_str)
                if page_num in seen_pages:
                    continue
                seen_pages.add(page_num)
                for chunk in context_chunks:
                    if chunk.get("pageNumber") == page_num:
                        citations.append({
                            "text": chunk["text"],
                            "page": page_num,
                            "confidence": round(chunk.get("similarity", 0.9), 2),
                        })
                        break

        # 6. Token estimation (~4 chars per token)
        if isinstance(context_chunks, list):
            context_len = sum(len(c["text"]) for c in context_chunks)
        else:
            context_len = len(context_chunks)
        user_tokens = max(1, (context_len + len(body.question)) // 4)
        assistant_tokens = max(1, len(answer) // 4)

        # 7. Persist user message
        await ChatService.add_message(
            session_id=session_id,
            user_id=current_user["_id"],
            document_id=documentId,
            role="user",
            content=body.question,
            citations=None,
            model=selected_model,
            token_usage=user_tokens,
        )

        # 8. Persist assistant message (with citations)
        await ChatService.add_message(
            session_id=session_id,
            user_id=current_user["_id"],
            document_id=documentId,
            role="assistant",
            content=answer,
            citations=citations if citations else None,
            model=selected_model,
            token_usage=assistant_tokens,
        )

        # 9. Log activity
        doc = await DocumentService.get_document(documentId, user_id=current_user["_id"])
        if doc:
            from app.services.activity_service import ActivityService
            await ActivityService.create_activity(
                user_id=current_user["_id"],
                activity_type="chat",
                action="Asked a question",
                document_name=doc["filename"],
                document_id=documentId,
                response_time=latency,
            )

        from app.schemas.chat import Citation as CitationModel
        return ChatResponse(answer=answer, citations=[
            CitationModel(text=c["text"], page=c.get("page"), confidence=c.get("confidence", 0.9))
            for c in citations
        ])

    except Exception as e:
        print(f"[CHAT] Error in persistent chat: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process and store conversation turn: {str(e)}",
        )
