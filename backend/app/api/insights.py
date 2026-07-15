from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.insight import InsightsResponse
from app.services.insight_service import InsightService
from app.api.deps import get_current_user
from app.services.document_service import DocumentService

router = APIRouter(
    prefix="/insights",
    tags=["insights"]
)


# ---------------------------------------------------------------------------
# GET /insights/{documentId} — return cached or generate
# ---------------------------------------------------------------------------

@router.get("/{documentId}", response_model=InsightsResponse, status_code=status.HTTP_200_OK)
async def get_document_insights(
    documentId: str,
    model: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Return cached insights for the document.
    If no cache exists, generate via Gemini, persist, and return.
    """
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access insights for this document",
        )
    try:
        cache_existed = await InsightService.insights_exist(documentId, current_user["_id"])
        insights = await InsightService.get_or_generate_insights(
            documentId, model, current_user["_id"]
        )
        if not insights:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document not found or has no content: {documentId}",
            )

        # Log activity — only when actually generating (not serving cache)
        if not cache_existed:
            doc = await DocumentService.get_document(documentId, user_id=current_user["_id"])
            if doc:
                from app.services.activity_service import ActivityService
                await ActivityService.create_activity(
                    user_id=current_user["_id"],
                    activity_type="generate_insight",
                    action="Generated document insights",
                    document_name=doc["filename"],
                    document_id=documentId,
                )
        return insights
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load or generate insights: {str(e)}",
        )


# ---------------------------------------------------------------------------
# POST /insights/{documentId} — force-regenerate
# ---------------------------------------------------------------------------

@router.post("/{documentId}", response_model=InsightsResponse, status_code=status.HTTP_200_OK)
async def regenerate_document_insights(
    documentId: str,
    model: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Force-regenerate insights by deleting the cache first, then generating fresh ones.
    """
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to regenerate insights for this document",
        )
    try:
        # Delete stale cache so get_or_generate_insights always re-runs Gemini
        await InsightService.delete_insights(documentId, current_user["_id"])

        insights = await InsightService.get_or_generate_insights(
            documentId, model, current_user["_id"]
        )
        if not insights:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document not found or has no content: {documentId}",
            )

        # Log activity
        doc = await DocumentService.get_document(documentId, user_id=current_user["_id"])
        if doc:
            from app.services.activity_service import ActivityService
            await ActivityService.create_activity(
                user_id=current_user["_id"],
                activity_type="generate_insight",
                action="Regenerated document insights",
                document_name=doc["filename"],
                document_id=documentId,
            )
        return insights
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate insights: {str(e)}",
        )


# ---------------------------------------------------------------------------
# DELETE /insights/{documentId} — wipe cached insights
# ---------------------------------------------------------------------------

@router.delete("/{documentId}", status_code=status.HTTP_200_OK)
async def delete_document_insights(
    documentId: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete cached insights for a document.
    Only the document owner can delete their insights.
    Returns 200 whether or not insights existed.
    """
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete insights for this document",
        )
    try:
        await InsightService.delete_insights(documentId, current_user["_id"])
        return {"status": "success", "message": "Insights cache cleared"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete insights: {str(e)}",
        )
