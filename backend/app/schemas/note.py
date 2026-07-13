from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class NoteCreate(BaseModel):
    title: str = Field(..., description="The title of the note")
    content: str = Field(..., description="The content of the note")
    documentId: Optional[str] = Field(None, description="The linked document ID")
    pageNumber: Optional[int] = Field(None, description="The linked page number")

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    documentId: Optional[str] = None
    pageNumber: Optional[int] = None

class NoteResponse(BaseModel):
    noteId: str
    title: str
    content: str
    documentId: Optional[str] = None
    documentName: Optional[str] = None
    pageNumber: Optional[int] = None
    createdAt: datetime
    updatedAt: datetime
    userId: str
