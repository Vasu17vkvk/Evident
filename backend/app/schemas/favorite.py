from pydantic import BaseModel
from datetime import datetime

class FavoriteRecord(BaseModel):
    id: str
    userId: str
    user_id: str
    documentId: str
    document_id: str
    createdAt: datetime
    created_at: datetime
