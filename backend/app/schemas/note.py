from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class NoteCreate(BaseModel):
    title: str = Field(..., description="The title of the note")
    content: str = Field(..., description="The content of the note")
    documentId: Optional[str] = Field(None, description="The linked document ID")
    document_id: Optional[str] = Field(None, description="The linked document ID (snake_case)")
    pageNumber: Optional[int] = Field(None, description="The linked page number")
    page_number: Optional[int] = Field(None, description="The linked page number (snake_case)")
    sourceText: Optional[str] = Field(None, description="The source text context of the note")
    source_text: Optional[str] = Field(None, description="The source text context of the note (snake_case)")

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    documentId: Optional[str] = None
    document_id: Optional[str] = None
    pageNumber: Optional[int] = None
    page_number: Optional[int] = None
    sourceText: Optional[str] = None
    source_text: Optional[str] = None

class NoteResponse(BaseModel):
    noteId: str
    title: str
    content: str
    documentId: Optional[str] = None
    documentName: Optional[str] = None
    pageNumber: Optional[int] = None
    sourceText: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    userId: str
