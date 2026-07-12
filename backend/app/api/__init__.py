from .upload import router as upload_router
from .chat import router as chat_router
from .documents import router as documents_router
from .insights import router as insights_router
from .auth import router as auth_router

__all__ = ["upload_router", "chat_router", "documents_router", "insights_router", "auth_router"]
