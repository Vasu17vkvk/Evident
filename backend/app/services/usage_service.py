import datetime
from app.database.mongodb import db

class UsageService:
    @staticmethod
    async def track_usage(user_id: str, metric: str, amount: int = 1) -> None:
        """
        Record API usage metrics for a user (e.g., gemini_calls, documents_uploaded, queries_made).
        """
        now = datetime.datetime.utcnow()
        today = now.strftime("%Y-%m-%d")
        
        # Upsert user daily usage stats
        await db.db["usage_stats"].update_one(
            {
                "userId": user_id,
                "user_id": user_id,
                "date": today
            },
            {
                "$inc": {f"metrics.{metric}": amount},
                "$set": {"updatedAt": now},
                "$setOnInsert": {"createdAt": now}
            },
            upsert=True
        )
