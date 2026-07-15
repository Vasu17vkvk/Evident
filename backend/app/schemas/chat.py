from typing import Literal, Optional
from pydantic import BaseModel, field_validator
from datetime import datetime


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


# ---------------------------------------------------------------------------
# Persistent Chat Schemas
# ---------------------------------------------------------------------------

class ChatMessageResponse(BaseModel):
    """Flat message returned from GET /chat/{documentId} — backward-compatible."""
    role: str
    content: str
    timestamp: datetime
    model: str | None = None
    tokenUsage: int | None = 0
    citations: Optional[list[Citation]] = None


class PersistedChatRequest(BaseModel):
    question: str
    documentText: str
    model: str | None = None
    conversationHistory: list[ConversationTurn] = []


# ---------------------------------------------------------------------------
# New Session-Based Schemas
# ---------------------------------------------------------------------------

class ChatSessionResponse(BaseModel):
    """Metadata for a chat session."""
    sessionId: str
    documentId: str
    userId: str
    title: str
    createdAt: datetime
    updatedAt: datetime
    messageCount: int = 0


class ChatMessageRecord(BaseModel):
    """Full message record from chat_messages collection."""
    messageId: str
    sessionId: str
    userId: str
    documentId: str
    role: str
    content: str
    citations: Optional[list[Citation]] = None
    createdAt: datetime
    model: str | None = None
    tokenUsage: int | None = 0
