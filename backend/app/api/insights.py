from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.insight import InsightsResponse
from app.services.insight_service import InsightService
from app.api.deps import get_current_user
from app.services.document_service import DocumentService

router = APIRouter(
    prefix="/insights",
    tags=["insights"]
)

@router.get("/{documentId}", response_model=InsightsResponse, status_code=status.HTTP_200_OK)
async def get_document_insights(documentId: str, model: str | None = None, current_user: dict = Depends(get_current_user)):
    # Verify ownership
    is_owner = await DocumentService.verify_owner(documentId, current_user["_id"])
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access insights for this document"
        )
    try:
        insights = await InsightService.get_or_generate_insights(documentId, model)
        if not insights:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Insights or document not found for ID: {documentId}"
            )
        return insights
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load or generate insights: {str(e)}"
        )
