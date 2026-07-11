from fastapi import APIRouter

from app.schemas.upload import UploadUrlRequest
from app.services.s3_service import generate_upload_url

router = APIRouter(
    prefix="/upload-url",
    tags=["upload"]
)

@router.post("")
async def upload_url(request: UploadUrlRequest):
    return generate_upload_url(
        request.filename,
        request.contentType
    )