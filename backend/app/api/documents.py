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
    sortBy: str | None = Query(None, description="Field to sort by (name, size, date, lastOpened)"),
    order: str | None = Query("desc", description="Sort order (asc, desc)"),
    favorite: bool | None = Query(None, description="Filter by favorite status"),
    current_user: dict = Depends(get_current_user)
):
    try:
        documents, total_count = await DocumentService.get_documents(
            search=search,
            page=page,
            limit=limit,
            user_id=current_user["_id"],
            sort_by=sortBy,
            order=order,
            favorite=favorite
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
        
        # Log upload activity
        from app.services.activity_service import ActivityService
        await ActivityService.create_activity(
            user_id=current_user["_id"],
            activity_type="upload",
            action="Uploaded document",
            document_name=payload.filename,
            document_id=doc_id
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
        
        # Log open activity if lastOpenedAt was updated
        if payload.lastOpenedAt is not None:
            doc = await DocumentService.get_document(documentId)
            if doc:
                from app.services.activity_service import ActivityService
                await ActivityService.create_activity(
                    user_id=current_user["_id"],
                    activity_type="open",
                    action="Opened document",
                    document_name=doc["filename"],
                    document_id=documentId
                )
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

@router.get("/{documentId}", response_model=dict, status_code=status.HTTP_200_OK)
async def get_document(documentId: str, current_user: dict = Depends(get_current_user)):
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document"
        )
    try:
        doc = await DocumentService.get_document(documentId)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {documentId} not found."
            )
        
        # Generate fresh download/viewer URL
        object_key = doc.get("objectKey")
        viewer_url = ""
        if object_key:
            from app.services.s3_service import generate_download_url
            viewer_url = generate_download_url(object_key) or ""
            
        return {
            "document": doc,
            "viewerUrl": viewer_url
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve document: {str(e)}"
        )

@router.get("/{documentId}/download", response_model=dict, status_code=status.HTTP_200_OK)
async def get_document_download(documentId: str, current_user: dict = Depends(get_current_user)):
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document"
        )
    try:
        doc = await DocumentService.get_document(documentId)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {documentId} not found."
            )
        object_key = doc.get("objectKey")
        if not object_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document has no S3 key"
            )
        
        from app.services.s3_service import generate_download_url
        download_url = generate_download_url(object_key)
        if not download_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate presigned download URL"
            )
        return {"downloadUrl": download_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve document download URL: {str(e)}"
        )

@router.post("/{documentId}/citation", status_code=status.HTTP_200_OK)
async def track_citation_copy(documentId: str, current_user: dict = Depends(get_current_user)):
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this document"
        )
    try:
        from bson import ObjectId
        try:
            doc_oid = ObjectId(documentId)
        except Exception:
            doc_oid = documentId

        # Increment citationCount in DB
        from app.database.mongodb import db
        await db.db["documents"].update_one(
            {"_id": doc_oid},
            {"$inc": {"citationCount": 1}}
        )

        # Log citation copy activity
        doc = await DocumentService.get_document(documentId)
        if doc:
            from app.services.activity_service import ActivityService
            await ActivityService.create_activity(
                user_id=current_user["_id"],
                activity_type="citation_copy",
                action="Copied citation",
                document_name=doc["filename"],
                document_id=documentId
            )
        return {"status": "success", "message": "Citation copy tracked successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track citation copy: {str(e)}"
        )
