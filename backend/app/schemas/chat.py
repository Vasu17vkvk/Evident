from typing import Literal
from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# Conversation history
# ---------------------------------------------------------------------------

class ConversationTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


# ---------------------------------------------------------------------------
# Citation
# ---------------------------------------------------------------------------

class Citation(BaseModel):
    text: str       # The exact excerpt from the document
    page: int | None = None   # Page number, if determinable
    confidence: float = 1.0   # 0.0 – 1.0


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

CONVERSATION_HISTORY_LIMIT = 10

class ChatRequest(BaseModel):
    question: str
    documentText: str
    conversationHistory: list[ConversationTurn] = []
    model: str | None = None

    @field_validator("question")
    @classmethod
    def question_must_be_non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("question must not be empty")
        if len(v) > 2000:
            raise ValueError("question must be 2000 characters or fewer")
        return v

    @field_validator("documentText")
    @classmethod
    def document_text_must_be_non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("documentText must not be empty")
        return v

    @field_validator("conversationHistory")
    @classmethod
    def limit_history(cls, v: list[ConversationTurn]) -> list[ConversationTurn]:
        # Silently truncate to the most recent N turns server-side as a safety net
        return v[-CONVERSATION_HISTORY_LIMIT:]


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]

