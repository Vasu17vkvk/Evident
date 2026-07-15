from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.database.mongodb import db
from app.services.activity_service import ActivityService
from app.services.document_service import DocumentService
from app.services.favorite_service import FavoriteService

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)

@router.get("", response_model=dict, status_code=status.HTTP_200_OK)
async def get_unified_dashboard(current_user: dict = Depends(get_current_user)):
    """Retrieve all unified dashboard statistics, lists, and activities in a single call."""
    user_id = current_user["_id"]
    try:
        # 1. Stats
        docs_count = await db.db["documents"].count_documents({"userId": user_id})
        recent_count = await db.db["documents"].count_documents({"userId": user_id, "lastOpenedAt": {"$ne": None}})
        fav_count = await db.db["favorites"].count_documents({"user_id": user_id})
        notes_count = await db.db["notes"].count_documents({"user_id": user_id})

        # Storage aggregation
        pipeline = [
            {"$match": {"userId": user_id}},
            {"$group": {"_id": None, "totalSize": {"$sum": {"$ifNull": ["$fileSize", {"$ifNull": ["$size", 0]}]}}}}
        ]
        storage_cursor = db.db["documents"].aggregate(pipeline)
        storage_results = await storage_cursor.to_list(1)
        total_bytes = storage_results[0]["totalSize"] if storage_results else 0
        storage_used_mb = round(total_bytes / (1024 * 1024), 2)

        stats = {
            "documents": docs_count,
            "recent": recent_count,
            "favorites": fav_count,
            "notes": notes_count,
            "storage_used_mb": storage_used_mb
        }

        # 2. Recent Documents (Limit 5, sort newest first)
        recent_docs_cursor = db.db["documents"].find({"userId": user_id}).sort([("lastOpenedAt", -1), ("uploadTimestamp", -1)]).limit(5)
        recent_docs = await recent_docs_cursor.to_list(None)
        formatted_recent_docs = []
        for doc in recent_docs:
            formatted_recent_docs.append({
                "documentId": str(doc["_id"]),
                "filename": doc.get("filename"),
                "uploadDate": doc.get("uploadTimestamp") or doc.get("createdAt"),
                "fileSize": doc.get("fileSize") or doc.get("size") or 0,
                "pageCount": doc.get("pages") or doc.get("pageCount") or 0,
                "favorite": doc.get("favorite", False),
                "lastOpenedAt": doc.get("lastOpenedAt")
            })

        # 3. Favorite Documents
        fav_docs = await FavoriteService.get_favorites(user_id)
        formatted_fav_docs = []
        for doc in fav_docs:
            formatted_fav_docs.append({
                "documentId": doc.get("documentId"),
                "filename": doc.get("filename"),
                "uploadDate": doc.get("uploadDate"),
                "fileSize": doc.get("fileSize"),
                "pageCount": doc.get("pageCount"),
                "favorite": True,
                "lastOpenedAt": doc.get("lastOpenedAt")
            })

        # 4. Recent Notes (Limit 5, sort newest first)
        notes_cursor = db.db["notes"].find({"user_id": user_id}).sort("created_at", -1).limit(5)
        notes_list = await notes_cursor.to_list(None)
        formatted_notes = []
        for note in notes_list:
            doc_id = note.get("document_id") or note.get("documentId")
            doc_name = ""
            if doc_id:
                try:
                    from bson import ObjectId
                    doc_oid = ObjectId(doc_id)
                except Exception:
                    doc_oid = doc_id
                doc = await db.db["documents"].find_one({"_id": doc_oid})
                if doc:
                    doc_name = doc.get("filename", "")
            formatted_notes.append({
                "id": str(note["_id"]),
                "noteId": str(note["_id"]),
                "title": note.get("title", ""),
                "content": note.get("content", ""),
                "documentId": doc_id,
                "documentName": doc_name,
                "pageNumber": note.get("page_number") or note.get("pageNumber"),
                "createdAt": note.get("created_at") or note.get("createdAt")
            })

        # 5. Recent Activities (Limit 10, sort newest first)
        activities_list = await ActivityService.get_activities(user_id, limit=10)
        formatted_activities = []
        for act in activities_list:
            formatted_activities.append({
                "activityId": act.get("activityId"),
                "type": act.get("type"),
                "action": act.get("title") or act.get("action"),
                "title": act.get("title"),
                "documentName": act.get("documentName"),
                "documentId": act.get("documentId"),
                "createdAt": act.get("createdAt")
            })

        return {
            "stats": stats,
            "recent_documents": formatted_recent_docs,
            "favorite_documents": formatted_fav_docs,
            "recent_notes": formatted_notes,
            "activities": formatted_activities
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard: {str(e)}"
        )

@router.get("/stats", response_model=dict, status_code=status.HTTP_200_OK)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    try:
        docs_count = await db.db["documents"].count_documents({"userId": user_id})
        fav_count = await db.db["favorites"].count_documents({"user_id": user_id})
        recent_count = await db.db["documents"].count_documents({"userId": user_id, "lastOpenedAt": {"$ne": None}})
        return {
            "documentsUploaded": docs_count,
            "favoriteCount": fav_count,
            "recentCount": recent_count
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
