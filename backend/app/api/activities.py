from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.services.activity_service import ActivityService
from app.api.deps import get_current_user
from app.schemas.activity import ActivityResponse

router = APIRouter(
    prefix="/activities",
    tags=["activities"]
)

@router.get("", response_model=list[ActivityResponse])
async def get_activities(
    type: str | None = None,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve all activities for the current user, optionally filtered by type."""
    try:
        activities = await ActivityService.get_activities(
            user_id=current_user["_id"],
            activity_type=type,
            page=page,
            limit=limit
        )
        return activities
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve activities: {str(e)}"
        )
