from .upload import router as upload_router
from .chat import router as chat_router
from .documents import router as documents_router
from .insights import router as insights_router
from .auth import router as auth_router
from .notes import router as notes_router
from .dashboard import router as dashboard_router
from .favorites import router as favorites_router
from .activities import router as activities_router

__all__ = ["upload_router", "chat_router", "documents_router", "insights_router", "auth_router", "notes_router", "dashboard_router", "favorites_router", "activities_router"]

