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
        user_id: str
    ) -> str:
        note_data = {
            "title": title,
            "content": content,
            "documentId": document_id,
            "pageNumber": page_number,
            "userId": user_id,
            "createdAt": datetime.datetime.utcnow(),
            "updatedAt": datetime.datetime.utcnow()
        }
        result = await db.db["notes"].insert_one(note_data)
        return str(result.inserted_id)

    @staticmethod
    async def update_note(note_id: str, updates: dict) -> bool:
        try:
            note_oid = ObjectId(note_id)
        except Exception:
            note_oid = note_id

        # Strip None values
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        if not clean_updates:
            return True

        clean_updates["updatedAt"] = datetime.datetime.utcnow()

        result = await db.db["notes"].update_one(
            {"_id": note_oid},
            {"$set": clean_updates}
        )
        return result.modified_count > 0

    @staticmethod
    async def delete_note(note_id: str) -> bool:
        try:
            note_oid = ObjectId(note_id)
        except Exception:
            note_oid = note_id

        result = await db.db["notes"].delete_one({"_id": note_oid})
        return result.deleted_count > 0

    @staticmethod
    async def get_notes(user_id: str) -> list[dict]:
        cursor = db.db["notes"].find({"userId": user_id}).sort("updatedAt", -1)
        notes = await cursor.to_list(None)

        result_notes = []
        for note in notes:
            # Fetch document name dynamically if linked
            doc_name = None
            doc_id = note.get("documentId")
            if doc_id:
                try:
                    doc_oid = ObjectId(doc_id)
                except Exception:
                    doc_oid = doc_id
                doc = await db.db["documents"].find_one({"_id": doc_oid})
                if doc:
                    doc_name = doc.get("filename")

            result_notes.append({
                "noteId": str(note["_id"]),
                "title": note.get("title", ""),
                "content": note.get("content", ""),
                "documentId": doc_id,
                "documentName": doc_name,
                "pageNumber": note.get("pageNumber"),
                "createdAt": note.get("createdAt") or datetime.datetime.utcnow(),
                "updatedAt": note.get("updatedAt") or datetime.datetime.utcnow(),
                "userId": str(note.get("userId"))
            })
        return result_notes

    @staticmethod
    async def verify_owner(note_id: str, user_id: str) -> bool:
        try:
            note_oid = ObjectId(note_id)
        except Exception:
            note_oid = note_id

        note = await db.db["notes"].find_one({"_id": note_oid})
        if not note:
            return False
        return str(note.get("userId")) == str(user_id)
