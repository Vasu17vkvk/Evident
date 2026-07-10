import uuid

from fastapi import APIRouter

from app.schemas.upload import UploadUrlRequest, UploadUrlResponse

router = APIRouter(prefix="/upload-url", tags=["upload"])

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Maximum supported file size exposed to clients (informational — actual
# enforcement will happen in the S3 presigned-URL policy once implemented).
MAX_FILE_SIZE_MB = 100
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024  # 104_857_600

# Placeholder bucket / CDN origin used until S3 is wired up.
_MOCK_BUCKET = "evident-documents"
_MOCK_REGION = "us-east-1"


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("", response_model=UploadUrlResponse, status_code=200)
async def generate_upload_url(body: UploadUrlRequest) -> UploadUrlResponse:
    """
    Return a presigned upload URL for the requested file.

    **Validation**
    - `filename`    — non-empty, ≤ 255 characters (enforced by schema).
    - `contentType` — must be one of the supported MIME types (enforced by schema).

    **File-size limit**
    - Maximum supported size: 100 MB.
      The presigned URL policy (once S3 is integrated) will enforce this
      server-side via `ContentLengthRange`.

    **Note:** mock values are returned until S3 is integrated.
    """
    object_key = f"uploads/{uuid.uuid4()}/{body.filename}"

    mock_upload_url = (
        f"https://{_MOCK_BUCKET}.s3.{_MOCK_REGION}.amazonaws.com"
        f"/{object_key}?X-Amz-Mock=true"
    )
    mock_file_url = (
        f"https://{_MOCK_BUCKET}.s3.{_MOCK_REGION}.amazonaws.com/{object_key}"
    )

    return UploadUrlResponse(
        uploadUrl=mock_upload_url,
        objectKey=object_key,
        fileUrl=mock_file_url,
    )
