import datetime
from bson import ObjectId
from app.database.mongodb import db

class NoteService:
    @staticmethod
    async def create_note(
        title: str,
        content: str,
        document_id: str | None,
        page_number: int | None,
        user_id: str,
        source_text: str | None = None
    ) -> str:
        now = datetime.datetime.utcnow()
        note_data = {
            "title": title,
            "content": content,
            "documentId": document_id,
            "document_id": document_id,
            "pageNumber": page_number,
            "page_number": page_number,
            "userId": user_id,
            "user_id": user_id,
            "sourceText": source_text,
            "source_text": source_text,
            "createdAt": now,
            "created_at": now,
            "updatedAt": now,
            "updated_at": now
        }
        result = await db.db["notes"].insert_one(note_data)
        return str(result.inserted_id)

    @staticmethod
    async def update_note(note_id: str, updates: dict, user_id: str = None) -> bool:
        """Update a note. Stores both camelCase and snake_case variations for compatibility."""
        try:
            note_oid = ObjectId(note_id)
        except Exception:
            note_oid = note_id

        # Strip None values
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        if not clean_updates:
            return True

        now = datetime.datetime.utcnow()
        clean_updates["updatedAt"] = now
        clean_updates["updated_at"] = now

        # Map mapped fields to double-write variations
        if "documentId" in clean_updates:
            clean_updates["document_id"] = clean_updates["documentId"]
        elif "document_id" in clean_updates:
            clean_updates["documentId"] = clean_updates["document_id"]

        if "pageNumber" in clean_updates:
            clean_updates["page_number"] = clean_updates["pageNumber"]
        elif "page_number" in clean_updates:
            clean_updates["pageNumber"] = clean_updates["page_number"]

        if "sourceText" in clean_updates:
            clean_updates["source_text"] = clean_updates["sourceText"]
        elif "source_text" in clean_updates:
            clean_updates["sourceText"] = clean_updates["source_text"]

        # Build filter — scope to user when provided using $or to match either field variant
        query_filter = {"_id": note_oid}
        if user_id:
            user_str = str(user_id)
            user_queries = [user_str]
            try:
                user_queries.append(ObjectId(user_str))
            except Exception:
                pass
            query_filter["$or"] = [
                {"userId": {"$in": user_queries}},
                {"user_id": {"$in": user_queries}}
            ]

        result = await db.db["notes"].update_one(
            query_filter,
            {"$set": clean_updates}
        )
        return result.modified_count > 0

    @staticmethod
    async def delete_note(note_id: str, user_id: str = None) -> bool:
        """Delete a note. Scopes delete filter using both userId and user_id fields."""
        try:
            note_oid = ObjectId(note_id)
        except Exception:
            note_oid = note_id

        # Build filter — scope to user when provided using $or to match either field variant
        query_filter = {"_id": note_oid}
        if user_id:
            user_str = str(user_id)
            user_queries = [user_str]
            try:
                user_queries.append(ObjectId(user_str))
            except Exception:
                pass
            query_filter["$or"] = [
                {"userId": {"$in": user_queries}},
                {"user_id": {"$in": user_queries}}
            ]

        result = await db.db["notes"].delete_one(query_filter)
        return result.deleted_count > 0

    @staticmethod
    async def get_notes(user_id: str, page: int = 1, limit: int = 50) -> list[dict]:
        """Fetch all notes for a user, sorting by updated_at descending with pagination."""
        skip = (page - 1) * limit
        user_str = str(user_id)
        user_queries = [user_str]
        try:
            user_queries.append(ObjectId(user_str))
        except Exception:
            pass
        # Use $or so notes are returned regardless of which field variant is stored
        cursor = db.db["notes"].find({
            "$or": [
                {"userId": {"$in": user_queries}},
                {"user_id": {"$in": user_queries}}
            ]
        }).sort("updatedAt", -1).skip(skip).limit(limit)
        notes = await cursor.to_list(None)

        result_notes = []
        for note in notes:
            # Fetch document name dynamically if linked
            doc_name = None
            doc_id = note.get("documentId") or note.get("document_id")
            if doc_id:
                try:
                    doc_oid = ObjectId(doc_id)
                except Exception:
                    doc_oid = doc_id
                doc = await db.db["documents"].find_one({
                    "_id": doc_oid,
                    "userId": user_id
                })
                if doc:
                    doc_name = doc.get("filename")

            result_notes.append({
                "noteId": str(note["_id"]),
                "title": note.get("title", ""),
                "content": note.get("content", ""),
                "documentId": doc_id,
                "documentName": doc_name,
                "pageNumber": note.get("pageNumber") or note.get("page_number"),
                "sourceText": note.get("sourceText") or note.get("source_text"),
                "createdAt": note.get("createdAt") or note.get("created_at") or datetime.datetime.utcnow(),
                "updatedAt": note.get("updatedAt") or note.get("updated_at") or datetime.datetime.utcnow(),
                "userId": str(note.get("userId"))
            })
        return result_notes

    @staticmethod
    async def get_notes_by_document(document_id: str, user_id: str, page: int = 1, limit: int = 50) -> list[dict]:
        """Fetch notes associated with a specific document, scoped to the user with pagination."""
        skip = (page - 1) * limit
        # Use explicit OR filters for both field naming conventions
        user_filter = {"$or": [{"userId": user_id}, {"user_id": user_id}]}
        doc_filter = {"$or": [{"documentId": document_id}, {"document_id": document_id}]}
        cursor = db.db["notes"].find({
            "$and": [user_filter, doc_filter]
        }).sort("updatedAt", -1).skip(skip).limit(limit)
        notes = await cursor.to_list(None)

        result_notes = []
        for note in notes:
            doc_name = None
            try:
                doc_oid = ObjectId(document_id)
            except Exception:
                doc_oid = document_id
            doc = await db.db["documents"].find_one({
                "_id": doc_oid,
                "userId": user_id
            })
            if doc:
                doc_name = doc.get("filename")

            result_notes.append({
                "noteId": str(note["_id"]),
                "title": note.get("title", ""),
                "content": note.get("content", ""),
                "documentId": document_id,
                "documentName": doc_name,
                "pageNumber": note.get("pageNumber") or note.get("page_number"),
                "sourceText": note.get("sourceText") or note.get("source_text"),
                "createdAt": note.get("createdAt") or note.get("created_at") or datetime.datetime.utcnow(),
                "updatedAt": note.get("updatedAt") or note.get("updated_at") or datetime.datetime.utcnow(),
                "userId": str(note.get("userId"))
            })
        return result_notes

    @staticmethod
    async def verify_owner(note_id: str, user_id: str) -> bool:
        """Check ownership using a single indexed query on {_id, userId} and user_id."""
        try:
            note_oid = ObjectId(note_id)
        except Exception:
            note_oid = note_id

        user_str = str(user_id)
        user_queries = [user_str]
        try:
            user_queries.append(ObjectId(user_str))
        except Exception:
            pass

        # Use $or so ownership check works regardless of which field variant is stored
        note = await db.db["notes"].find_one({
            "_id": note_oid,
            "$or": [
                {"userId": {"$in": user_queries}},
                {"user_id": {"$in": user_queries}}
            ]
        })
        return note is not None
