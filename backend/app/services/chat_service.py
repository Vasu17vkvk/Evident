"""
ChatService — manages chat_sessions and chat_messages collections.

Collections schema:

chat_sessions:
  _id          : ObjectId (auto)
  userId       : str       — owner
  documentId   : str       — linked document (MongoDB _id as string)
  title        : str       — first user message truncated to 60 chars
  createdAt    : datetime
  updatedAt    : datetime

chat_messages:
  _id          : ObjectId (auto)
  sessionId    : str       — reference to chat_sessions._id
  userId       : str       — denormalised for fast user-scoped queries
  documentId   : str       — denormalised for fast document-scoped queries
  role         : "user" | "assistant"
  content      : str
  citations    : list[dict] | None
  model        : str | None
  tokenUsage   : int | None
  createdAt    : datetime
"""

import datetime
from bson import ObjectId
from app.database.mongodb import db


def _str_id(oid) -> str:
    return str(oid)


class ChatService:

    # ------------------------------------------------------------------
    # Session management
    # ------------------------------------------------------------------

    @staticmethod
    async def get_or_create_session(document_id: str, user_id: str) -> dict:
        """
        Find an existing session for (user_id, document_id) or create one.
        Returns the full session dict with 'sessionId' as a string.
        """
        existing = await db.db["chat_sessions"].find_one({
            "documentId": document_id,
            "userId": user_id,
        })
        if existing:
            return {
                "sessionId": _str_id(existing["_id"]),
                "documentId": existing["documentId"],
                "userId": existing["userId"],
                "title": existing.get("title", "New Chat"),
                "createdAt": existing["createdAt"],
                "updatedAt": existing["updatedAt"],
            }

        now = datetime.datetime.utcnow()
        session_doc = {
            "documentId": document_id,
            "userId": user_id,
            "title": "New Chat",
            "createdAt": now,
            "updatedAt": now,
        }
        result = await db.db["chat_sessions"].insert_one(session_doc)
        return {
            "sessionId": _str_id(result.inserted_id),
            "documentId": document_id,
            "userId": user_id,
            "title": "New Chat",
            "createdAt": now,
            "updatedAt": now,
        }

    @staticmethod
    async def get_session_by_document(document_id: str, user_id: str) -> dict | None:
        """Fetch session metadata by (document_id, user_id). Returns None if not found."""
        doc = await db.db["chat_sessions"].find_one({
            "documentId": document_id,
            "userId": user_id,
        })
        if not doc:
            return None
        return {
            "sessionId": _str_id(doc["_id"]),
            "documentId": doc["documentId"],
            "userId": doc["userId"],
            "title": doc.get("title", "New Chat"),
            "createdAt": doc["createdAt"],
            "updatedAt": doc["updatedAt"],
        }

    @staticmethod
    async def verify_session_owner(session_id: str, user_id: str) -> bool:
        """Return True only if the session exists AND belongs to user_id."""
        try:
            sid = ObjectId(session_id)
        except Exception:
            sid = session_id
        session = await db.db["chat_sessions"].find_one({"_id": sid, "userId": user_id})
        return session is not None

    @staticmethod
    async def delete_session(session_id: str, user_id: str) -> bool:
        """
        Delete a session and ALL its messages (scoped to owner).
        Returns False if the session was not found / not owned by user_id.
        """
        try:
            sid = ObjectId(session_id)
        except Exception:
            sid = session_id

        session = await db.db["chat_sessions"].find_one({"_id": sid, "userId": user_id})
        if not session:
            return False

        # Delete all messages belonging to this session (scoped to user)
        await db.db["chat_messages"].delete_many({
            "sessionId": session_id,
            "userId": user_id,
        })
        # Delete the session itself
        await db.db["chat_sessions"].delete_one({"_id": sid, "userId": user_id})
        return True

    # ------------------------------------------------------------------
    # Message management
    # ------------------------------------------------------------------

    @staticmethod
    async def get_messages(session_id: str, user_id: str) -> list[dict]:
        """
        Return all messages for a session in ascending chronological order.
        Scoped to user_id for defence-in-depth.
        """
        cursor = db.db["chat_messages"].find(
            {"sessionId": session_id, "userId": user_id}
        ).sort("createdAt", 1)
        messages = await cursor.to_list(None)

        result = []
        for m in messages:
            result.append({
                "messageId": _str_id(m["_id"]),
                "sessionId": m["sessionId"],
                "userId": m["userId"],
                "documentId": m["documentId"],
                "role": m["role"],
                "content": m["content"],
                "citations": m.get("citations"),
                "model": m.get("model"),
                "tokenUsage": m.get("tokenUsage", 0),
                "createdAt": m["createdAt"],
            })
        return result

    @staticmethod
    async def add_message(
        session_id: str,
        user_id: str,
        document_id: str,
        role: str,
        content: str,
        citations: list | None = None,
        model: str | None = None,
        token_usage: int = 0,
    ) -> str:
        """Insert a single message and bump the session's updatedAt + title."""
        now = datetime.datetime.utcnow()
        message_doc = {
            "sessionId": session_id,
            "userId": user_id,
            "documentId": document_id,
            "role": role,
            "content": content,
            "citations": citations or [],
            "model": model,
            "tokenUsage": token_usage,
            "createdAt": now,
        }
        result = await db.db["chat_messages"].insert_one(message_doc)

        # Update session: bump updatedAt; set title from first user message
        update_fields: dict = {"updatedAt": now}
        if role == "user":
            # Check if this is the first user message (title still "New Chat")
            try:
                sid = ObjectId(session_id)
            except Exception:
                sid = session_id
            session = await db.db["chat_sessions"].find_one({"_id": sid})
            if session and session.get("title") == "New Chat":
                title = content[:60] + ("…" if len(content) > 60 else "")
                update_fields["title"] = title

        try:
            sid_oid = ObjectId(session_id)
        except Exception:
            sid_oid = session_id
        await db.db["chat_sessions"].update_one(
            {"_id": sid_oid, "userId": user_id},
            {"$set": update_fields},
        )

        return _str_id(result.inserted_id)
