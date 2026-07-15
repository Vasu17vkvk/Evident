from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.services.favorite_service import FavoriteService
from app.services.document_service import DocumentService
from app.api.deps import get_current_user
from app.schemas.document import DocumentListItem

router = APIRouter(
    prefix="/favorites",
    tags=["favorites"]
)

@router.get("", response_model=list[DocumentListItem])
async def get_favorites(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve all favorited documents for the current user."""
    try:
        fav_docs = await FavoriteService.get_favorites(current_user["_id"], page=page, limit=limit)
        return fav_docs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve favorites: {str(e)}"
        )

@router.post("/{documentId}", status_code=status.HTTP_200_OK)
async def add_favorite(documentId: str, current_user: dict = Depends(get_current_user)):
    """Add a document to the user's favorites list."""
    # Verify document ownership
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document"
        )
    try:
        await FavoriteService.add_favorite(documentId, current_user["_id"])
        return {"status": "success", "message": "Document added to favorites"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add favorite: {str(e)}"
        )

@router.delete("/{documentId}", status_code=status.HTTP_200_OK)
async def remove_favorite(documentId: str, current_user: dict = Depends(get_current_user)):
    """Remove a document from the user's favorites list."""
    # Verify document ownership
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document"
        )
    try:
        await FavoriteService.remove_favorite(documentId, current_user["_id"])
        return {"status": "success", "message": "Document removed from favorites"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove favorite: {str(e)}"
        )
