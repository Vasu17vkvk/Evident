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
        document_id: str | None = None
    ) -> str:
        activity_data = {
            "userId": user_id,
            "type": activity_type,
            "action": action,
            "documentName": document_name,
            "documentId": document_id,
            "createdAt": datetime.datetime.utcnow()
        }
        result = await db.db["activities"].insert_one(activity_data)
        return str(result.inserted_id)

    @staticmethod
    async def get_recent_activities(user_id: str, limit: int = 10) -> list[dict]:
        cursor = db.db["activities"].find({"userId": user_id}).sort("createdAt", -1).limit(limit)
        activities = await cursor.to_list(None)
        
        result = []
        for act in activities:
            result.append({
                "activityId": str(act["_id"]),
                "type": act.get("type", "unknown"),
                "action": act.get("action", ""),
                "documentName": act.get("documentName"),
                "documentId": act.get("documentId"),
                "createdAt": act.get("createdAt") or datetime.datetime.utcnow()
            })
        return result
