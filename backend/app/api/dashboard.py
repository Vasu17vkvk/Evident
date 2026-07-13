from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.database.mongodb import db
from app.services.activity_service import ActivityService
from app.services.document_service import DocumentService

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)

@router.get("/stats", response_model=dict, status_code=status.HTTP_200_OK)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    try:
        # documentsUploaded
        docs_count = await db.db["documents"].count_documents({"userId": user_id})
        
        # totalQueries
        pipeline_queries = [
            {"$match": {"userId": user_id}},
            {"$group": {"_id": None, "total": {"$sum": "$queryCount"}}}
        ]
        cursor_q = db.db["documents"].aggregate(pipeline_queries)
        res_q = await cursor_q.to_list(1)
        total_queries = res_q[0]["total"] if res_q else 0
        
        # citationsGenerated
        pipeline_citations = [
            {"$match": {"userId": user_id}},
            {"$group": {"_id": None, "total": {"$sum": "$citationCount"}}}
        ]
        cursor_c = db.db["documents"].aggregate(pipeline_citations)
        res_c = await cursor_c.to_list(1)
        total_citations = res_c[0]["total"] if res_c else 0
        
        # avgResponseTime
        avg_response_time = 1.8
        
        return {
            "documentsUploaded": docs_count,
            "totalQueries": total_queries,
            "citationsGenerated": total_citations,
            "avgResponseTime": avg_response_time
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard stats: {str(e)}"
        )

@router.get("/recent-documents", response_model=list[dict], status_code=status.HTTP_200_OK)
async def get_recent_documents(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    try:
        cursor = db.db["documents"].find({
            "userId": user_id
        }).sort([("lastOpenedAt", -1), ("uploadTimestamp", -1)]).limit(5)
        documents = await cursor.to_list(None)
        
        result_docs = []
        for doc in documents:
            result_docs.append({
                "documentId": str(doc["_id"]),
                "filename": doc.get("filename"),
                "uploadDate": doc.get("uploadTimestamp") or doc.get("createdAt"),
                "fileSize": doc.get("fileSize", 0),
                "pageCount": doc.get("pages", 0),
                "favorite": doc.get("favorite", False),
                "lastOpenedAt": doc.get("lastOpenedAt"),
                "queryCount": doc.get("queryCount", 0),
                "citationCount": doc.get("citationCount", 0)
            })
        return result_docs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recent documents: {str(e)}"
        )

@router.get("/recent-activity", response_model=list[dict], status_code=status.HTTP_200_OK)
async def get_recent_activities(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    try:
        activities = await ActivityService.get_recent_activities(user_id, limit=10)
        return activities
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recent activities: {str(e)}"
        )
