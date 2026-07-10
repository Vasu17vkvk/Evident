import traceback
from fastapi import APIRouter, HTTPException

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/chat", tags=["chat"])


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("", response_model=ChatResponse, status_code=200)
async def chat(body: ChatRequest) -> ChatResponse:
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


