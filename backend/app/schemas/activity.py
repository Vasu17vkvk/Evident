from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime

class ActivityResponse(BaseModel):
    activityId: str
    userId: str
    user_id: str
    documentId: Optional[str] = None
    document_id: Optional[str] = None
    type: str
    title: str
    metadata: Optional[Any] = None
    createdAt: datetime
    created_at: datetime
