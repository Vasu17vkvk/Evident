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

        # notes: userId index for fast user-scoped queries
        await db.db["notes"].create_index([("userId", ASCENDING)], name="notes_userId")

        # activities: userId index for dashboard queries
        await db.db["activities"].create_index([("userId", ASCENDING)], name="activities_userId")
        await db.db["activities"].create_index(
            [("userId", ASCENDING), ("createdAt", ASCENDING)],
            name="activities_userId_createdAt"
        )

        # document_chunks: userId index for RAG context retrieval
        await db.db["document_chunks"].create_index(
            [("userId", ASCENDING), ("documentId", ASCENDING)],
            name="chunks_userId_documentId"
        )

        logger.info("[Indexes] All MongoDB indexes created or already exist.")
    except Exception as e:
        logger.error(f"[Indexes] Failed to create indexes: {e}")
