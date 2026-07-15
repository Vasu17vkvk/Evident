"""
MongoDB index creation module.
Called once at application startup to ensure all data-isolation indexes exist.
"""
import logging
from pymongo import ASCENDING
from app.database.mongodb import db

logger = logging.getLogger("uvicorn.error")


async def create_indexes():
    """Create all required indexes for multi-user data isolation and query performance."""
    try:
        # documents: single-field userId index for user-scoped listing
        await db.db["documents"].create_index([("userId", ASCENDING)], name="documents_userId")
        # documents: compound index for filtered listing (userId + uploadTimestamp)
        await db.db["documents"].create_index(
            [("userId", ASCENDING), ("uploadTimestamp", ASCENDING)],
            name="documents_userId_uploadTimestamp"
        )
        # documents: compound index for favorite filtering
        await db.db["documents"].create_index(
            [("userId", ASCENDING), ("favorite", ASCENDING)],
            name="documents_userId_favorite"
        )

        # conversations: compound unique index so each user gets one conversation per document
        await db.db["conversations"].create_index(
            [("userId", ASCENDING), ("documentId", ASCENDING)],
            name="conversations_userId_documentId",
            unique=True
        )

        # insights: compound unique index per user+document
        await db.db["insights"].create_index(
            [("userId", ASCENDING), ("documentId", ASCENDING)],
            name="insights_userId_documentId",
            unique=True
        )

        # notes: userId and user_id index for fast user-scoped queries
        await db.db["notes"].create_index([("userId", ASCENDING)], name="notes_userId")
        await db.db["notes"].create_index([("user_id", ASCENDING)], name="notes_user_id")
        # notes: documentId and document_id index
        await db.db["notes"].create_index([("documentId", ASCENDING)], name="notes_documentId")
        await db.db["notes"].create_index([("document_id", ASCENDING)], name="notes_document_id")
        # notes: text index on title and content
        from pymongo import TEXT
        await db.db["notes"].create_index([("title", TEXT), ("content", TEXT)], name="notes_text_title_content")

        # activities: userId/user_id index for dashboard queries
        await db.db["activities"].create_index([("userId", ASCENDING)], name="activities_userId")
        await db.db["activities"].create_index([("user_id", ASCENDING)], name="activities_user_id")
        await db.db["activities"].create_index(
            [("userId", ASCENDING), ("createdAt", ASCENDING)],
            name="activities_userId_createdAt"
        )
        await db.db["activities"].create_index(
            [("user_id", ASCENDING), ("created_at", ASCENDING)],
            name="activities_user_id_created_at"
        )
        # activities: documentId/document_id indexes
        await db.db["activities"].create_index([("documentId", ASCENDING)], name="activities_documentId")
        await db.db["activities"].create_index([("document_id", ASCENDING)], name="activities_document_id")

        # insights: simple userId index (per data-isolation spec requirement)
        await db.db["insights"].create_index([("userId", ASCENDING)], name="insights_userId")
        # insights: simple documentId index
        await db.db["insights"].create_index([("documentId", ASCENDING)], name="insights_documentId")

        # document_chunks: userId index for RAG context retrieval
        await db.db["document_chunks"].create_index(
            [("userId", ASCENDING), ("documentId", ASCENDING)],
            name="chunks_userId_documentId"
        )
        # document_chunks: simple userId index for query planner
        await db.db["document_chunks"].create_index([("userId", ASCENDING)], name="chunks_userId")

        # chat_sessions: user and document indexes for fast session lookups
        await db.db["chat_sessions"].create_index([("userId", ASCENDING)], name="chat_sessions_userId")
        await db.db["chat_sessions"].create_index([("documentId", ASCENDING)], name="chat_sessions_documentId")
        # Unique compound: one session per (user, document)
        await db.db["chat_sessions"].create_index(
            [("userId", ASCENDING), ("documentId", ASCENDING)],
            name="chat_sessions_userId_documentId",
            unique=True,
        )

        # chat_messages: indexes for session retrieval and user-scoped queries
        await db.db["chat_messages"].create_index([("sessionId", ASCENDING)], name="chat_messages_sessionId")
        await db.db["chat_messages"].create_index([("userId", ASCENDING)], name="chat_messages_userId")
        # Compound: ordered message fetch per session
        await db.db["chat_messages"].create_index(
            [("sessionId", ASCENDING), ("createdAt", ASCENDING)],
            name="chat_messages_sessionId_createdAt",
        )

        # favorites: unique compound index: (user_id, document_id)
        await db.db["favorites"].create_index(
            [("userId", ASCENDING), ("documentId", ASCENDING)],
            name="favorites_userId_documentId",
            unique=True,
        )
        await db.db["favorites"].create_index(
            [("user_id", ASCENDING), ("document_id", ASCENDING)],
            name="favorites_user_id_document_id",
            unique=True,
        )

        logger.info("[Indexes] All MongoDB indexes created or already exist.")
    except Exception as e:
        logger.error(f"[Indexes] Failed to create indexes: {e}")
