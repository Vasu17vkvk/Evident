from enum import Enum
from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# Allowed content types
# ---------------------------------------------------------------------------

class SupportedContentType(str, Enum):
    PDF  = "application/pdf"
    DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    TXT  = "text/plain"


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class UploadUrlRequest(BaseModel):
    filename:    str
    contentType: SupportedContentType

    @field_validator("filename")
    @classmethod
    def filename_must_be_non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("filename must not be empty")
        if len(v) > 255:
            raise ValueError("filename must be 255 characters or fewer")
        return v


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class UploadUrlResponse(BaseModel):
    uploadUrl: str
    objectKey: str
    fileUrl:   str
