import datetime
from bson import ObjectId
from app.database.mongodb import db

class ActivityService:
    @staticmethod
    async def create_activity(
        user_id: str,
        activity_type: str,
        action: str,
        document_name: str | None = None,
        document_id: str | None = None,
        response_time: float | None = None
    ) -> str:
        now = datetime.datetime.utcnow()
        activity_data = {
            "userId": user_id,
            "user_id": user_id,
            "documentId": document_id,
            "document_id": document_id,
            "type": activity_type,
            "action": action,
            "title": action,
            "documentName": document_name,
            "document_name": document_name,
            "metadata": {
                "document_name": document_name,
                "documentName": document_name,
                "response_time": response_time
            },
            "createdAt": now,
            "created_at": now
        }
        result = await db.db["activities"].insert_one(activity_data)
        return str(result.inserted_id)

    @staticmethod
    async def get_recent_activities(user_id: str, limit: int = 10) -> list[dict]:
        """Fetch recent activities, supporting backwards compatibility."""
        cursor = db.db["activities"].find({
            "userId": user_id,
            "user_id": user_id
        }).sort("createdAt", -1).limit(limit)
        activities = await cursor.to_list(None)
        
        result = []
        for act in activities:
            result.append({
                "activityId": str(act["_id"]),
                "type": act.get("type", "unknown"),
                "action": act.get("action") or act.get("title") or "",
                "title": act.get("title") or act.get("action") or "",
                "documentName": act.get("documentName") or act.get("document_name"),
                "documentId": act.get("documentId") or act.get("document_id"),
                "createdAt": act.get("createdAt") or act.get("created_at") or datetime.datetime.utcnow()
            })
        return result

    @staticmethod
    async def get_activities(user_id: str, activity_type: str | None = None, page: int = 1, limit: int = 20) -> list[dict]:
        """Fetch activities with type filter and sorted by created_at descending (newest first) with pagination."""
        query = {
            "userId": user_id,
            "user_id": user_id
        }
        if activity_type:
            query["type"] = activity_type
            
        skip = (page - 1) * limit
        cursor = db.db["activities"].find(query).sort("createdAt", -1).skip(skip).limit(limit)
        activities = await cursor.to_list(None)
        
        result = []
        for act in activities:
            result.append({
                "activityId": str(act["_id"]),
                "userId": str(act.get("userId")),
                "user_id": str(act.get("user_id")),
                "documentId": act.get("documentId") or act.get("document_id"),
                "document_id": act.get("documentId") or act.get("document_id"),
                "type": act.get("type", "unknown"),
                "title": act.get("title") or act.get("action") or "",
                "action": act.get("action") or act.get("title") or "",
                "documentName": act.get("documentName") or act.get("document_name"),
                "metadata": act.get("metadata", {}),
                "createdAt": act.get("createdAt") or act.get("created_at") or datetime.datetime.utcnow(),
                "created_at": act.get("createdAt") or act.get("created_at") or datetime.datetime.utcnow()
            })
        return result
