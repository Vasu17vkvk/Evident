import logging
import os
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger("uvicorn.error")

class Database:
    client: AsyncIOMotorClient = None
    db = None

# Singleton database instance exported for application-wide use
db = Database()

async def connect_to_mongo():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DATABASE", "evident")
    if not uri:
        logger.error("[MongoDB] MONGODB_URI is not set in environment variables.")
        raise ValueError("MONGODB_URI environment variable is missing")
    
    try:
        logger.info("[MongoDB] Connecting to database...")
        # Connection pooling is enabled by default in Motor/PyMongo.
        # We explicitly configure pool size parameters here.
        db.client = AsyncIOMotorClient(
            uri,
            maxPoolSize=100,
            minPoolSize=10
        )
        db.db = db.client[db_name]
        
        # Ping the server to check connectivity
        await db.client.admin.command("ping")
        logger.info(f"[MongoDB] Connected successfully to database: {db_name}")
    except Exception as e:
        logger.error(f"[MongoDB] Connection failure: {str(e)}")
        raise e

async def close_mongo_connection():
    if db.client:
        db.client.close()
        logger.info("[MongoDB] Connection closed.")
