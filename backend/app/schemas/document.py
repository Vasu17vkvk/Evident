from pydantic import BaseModel, Field
from typing import Optional

class DocumentCreate(BaseModel):
    filename: str = Field(..., description="The name of the uploaded file")
    objectKey: str = Field(..., description="The S3 object key")
    fileUrl: str = Field(..., description="The S3 file URL")
    mimeType: str = Field(..., description="The MIME type of the file")
    fileSize: int = Field(..., description="The file size in bytes")
    pages: Optional[int] = Field(0, description="The number of pages in the document")
    wordCount: Optional[int] = Field(0, description="The word count of the document")
    status: Optional[str] = Field("Uploaded", description="The current processing status of the document")
    userId: Optional[str] = Field(None, description="The owner user ID")

class DocumentResponse(BaseModel):
    documentId: str = Field(..., description="The generated document ID in MongoDB")

class DocumentUpdate(BaseModel):
    status: Optional[str] = None
    pages: Optional[int] = None
    wordCount: Optional[int] = None
    pagesContent: Optional[list[str]] = None
from datetime import datetime

class DocumentListItem(BaseModel):
    documentId: str
    filename: str
    uploadDate: datetime
    fileSize: int
    pageCount: int
    thumbnail: Optional[str] = None
    userId: Optional[str] = None

class DocumentListResponse(BaseModel):
    documents: list[DocumentListItem]
    totalCount: int
    page: int
    limit: int
