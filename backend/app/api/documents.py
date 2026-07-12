from fastapi import APIRouter, HTTPException, status, Query, Depends
from app.schemas.document import DocumentCreate, DocumentResponse, DocumentUpdate, DocumentListResponse
from app.services.document_service import DocumentService
from app.api.deps import get_current_user

router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)

@router.get("", response_model=DocumentListResponse, status_code=status.HTTP_200_OK)
async def get_documents(
    search: str | None = Query(None, description="Search by filename"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    try:
        documents, total_count = await DocumentService.get_documents(
            search=search, page=page, limit=limit, user_id=current_user["_id"]
        )
        return DocumentListResponse(
            documents=documents,
            totalCount=total_count,
            page=page,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve documents: {str(e)}"
        )

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(payload: DocumentCreate, current_user: dict = Depends(get_current_user)):
    try:
        doc_id = await DocumentService.create_document(
            filename=payload.filename,
            object_key=payload.objectKey,
            file_url=payload.fileUrl,
            mime_type=payload.mimeType,
            file_size=payload.fileSize,
            pages=payload.pages or 0,
            word_count=payload.wordCount or 0,
            status=payload.status or "Uploaded",
            user_id=current_user["_id"]
        )
        return DocumentResponse(documentId=doc_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist document: {str(e)}"
        )

@router.put("/{documentId}", status_code=status.HTTP_200_OK)
async def update_document(documentId: str, payload: DocumentUpdate, current_user: dict = Depends(get_current_user)):
    # Verify ownership
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this document"
        )
    try:
        success = await DocumentService.update_document(documentId, payload.model_dump())
        return {"status": "success", "message": "Document updated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update document: {str(e)}"
        )

@router.delete("/{documentId}", status_code=status.HTTP_200_OK)
async def delete_document(documentId: str, current_user: dict = Depends(get_current_user)):
    # Verify ownership
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this document"
        )
    try:
        success = await DocumentService.delete_document(documentId)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {documentId} not found."
            )
        return {"status": "success", "message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )
