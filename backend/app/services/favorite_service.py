import datetime
from bson import ObjectId
from app.database.mongodb import db
from app.services.activity_service import ActivityService


class FavoriteService:

    @staticmethod
    async def add_favorite(document_id: str, user_id: str) -> bool:
        """
        Add a document to the favorites collection, sync the document's favorite field,
        and log the favorite_document activity.
        """
        now = datetime.datetime.utcnow()
        favorite_doc = {
            "userId": user_id,
            "user_id": user_id,
            "documentId": document_id,
            "document_id": document_id,
            "createdAt": now,
            "created_at": now,
        }

        # 1. Insert into favorites collection using upsert for idempotency
        # Guarded by unique compound index: (user_id, document_id)
        await db.db["favorites"].update_one(
            {
                "userId": user_id,
                "user_id": user_id,
                "documentId": document_id,
                "document_id": document_id,
            },
            {"$set": favorite_doc},
            upsert=True,
        )

        # 2. Update document favorite field to True
        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            doc_oid = document_id

        await db.db["documents"].update_one(
            {"_id": doc_oid, "userId": user_id},
            {"$set": {"favorite": True}},
        )

        # 3. Log activity
        doc = await db.db["documents"].find_one({"_id": doc_oid})
        doc_name = doc.get("filename") if doc else "document"
        await ActivityService.create_activity(
            user_id=user_id,
            activity_type="favorite_document",
            action="Starred document",
            document_name=doc_name,
            document_id=document_id,
        )

        return True

    @staticmethod
    async def remove_favorite(document_id: str, user_id: str) -> bool:
        """Remove a document from the favorites collection and update document."""
        # 1. Remove from favorites collection
        result = await db.db["favorites"].delete_many({
            "userId": user_id,
            "user_id": user_id,
            "documentId": document_id,
            "document_id": document_id,
        })

        # 2. Update document favorite field to False
        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            doc_oid = document_id

        await db.db["documents"].update_one(
            {"_id": doc_oid, "userId": user_id},
            {"$set": {"favorite": False}},
        )

        return result.deleted_count > 0

    @staticmethod
    async def get_favorites(user_id: str, page: int = 1, limit: int = 50) -> list[dict]:
        """
        Return the list of documents that are favorited by the user,
        sorted newer first with pagination.
        """
        skip = (page - 1) * limit
        # Fetch document IDs from favorites collection
        cursor = db.db["favorites"].find({
            "userId": user_id,
            "user_id": user_id,
        }).sort("createdAt", -1).skip(skip).limit(limit)
        favs = await cursor.to_list(None)

        result_docs = []
        for f in favs:
            doc_id = f.get("documentId") or f.get("document_id")
            if doc_id:
                try:
                    doc_oid = ObjectId(doc_id)
                except Exception:
                    doc_oid = doc_id
                doc = await db.db["documents"].find_one({
                    "_id": doc_oid,
                    "userId": user_id,
                })
                if doc:
                    result_docs.append({
                        "documentId": str(doc["_id"]),
                        "filename": doc.get("filename", ""),
                        "uploadDate": doc.get("uploadDate") or doc.get("createdAt") or datetime.datetime.utcnow(),
                        "fileSize": doc.get("fileSize") or doc.get("size") or 0,
                        "pageCount": doc.get("pageCount") or doc.get("pages") or 0,
                        "thumbnail": doc.get("thumbnail"),
                        "userId": str(doc.get("userId")),
                        "favorite": True,
                        "lastOpenedAt": doc.get("lastOpenedAt"),
                    })
        return result_docs
