import datetime
from app.database.mongodb import db

class DocumentService:
    @staticmethod
    async def create_document(
        filename: str,
        object_key: str,
        file_url: str,
        mime_type: str,
        file_size: int,
        pages: int = 0,
        word_count: int = 0,
        status: str = "Uploaded",
        user_id: str = None
    ) -> str:
        document_data = {
            "filename": filename,
            "objectKey": object_key,
            "fileUrl": file_url,
            "mimeType": mime_type,
            "fileSize": file_size,
            "uploadTimestamp": datetime.datetime.utcnow(),
            "pages": pages,
            "wordCount": word_count,
            "status": status,
            "userId": user_id,
            "queryCount": 0,
            "citationCount": 0,
            "favorite": False,
            "lastOpenedAt": None
        }
        
        # Save to documents collection in MongoDB
        result = await db.db["documents"].insert_one(document_data)
        return str(result.inserted_id)

    @staticmethod
    async def update_document(document_id: str, updates: dict) -> bool:
        from bson import ObjectId
        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            doc_oid = document_id

        # Strip None values from update dictionary
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        if not clean_updates:
            return True

        result = await db.db["documents"].update_one(
            {"_id": doc_oid},
            {"$set": clean_updates}
        )

        if "pagesContent" in clean_updates:
            doc = await db.db["documents"].find_one({"_id": doc_oid})
            user_id = doc.get("userId") if doc else None
            from app.services.rag_service import RAGService
            import asyncio
            asyncio.create_task(RAGService.chunk_document(document_id, clean_updates["pagesContent"], user_id))

        return result.modified_count > 0

    @staticmethod
    async def get_documents(
        search: str = None,
        page: int = 1,
        limit: int = 20,
        user_id: str = None,
        sort_by: str = None,
        order: str = "desc",
        favorite: bool = None
    ) -> tuple[list[dict], int]:
        query = {}
        if user_id:
            query["userId"] = user_id
        if search:
            query["filename"] = {"$regex": search, "$options": "i"}
        if favorite is not None:
            query["favorite"] = favorite

        # Map frontend sort fields to database fields
        sort_field_map = {
            "name": "filename",
            "size": "fileSize",
            "date": "uploadTimestamp",
            "lastOpened": "lastOpenedAt"
        }
        db_sort_field = sort_field_map.get(sort_by, "uploadTimestamp")
        db_order = -1 if order == "desc" else 1

        skip = (page - 1) * limit
        cursor = db.db["documents"].find(query).sort(db_sort_field, db_order).skip(skip).limit(limit)
        
        documents = await cursor.to_list(None)
        total_count = await db.db["documents"].count_documents(query)
        
        result_docs = []
        for doc in documents:
            result_docs.append({
                "documentId": str(doc["_id"]),
                "filename": doc.get("filename"),
                "uploadDate": doc.get("uploadTimestamp") or doc.get("createdAt") or datetime.datetime.utcnow(),
                "fileSize": doc.get("fileSize", 0),
                "pageCount": doc.get("pages", 0),
                "thumbnail": doc.get("thumbnail"),
                "userId": doc.get("userId"),
                "favorite": doc.get("favorite", False),
                "lastOpenedAt": doc.get("lastOpenedAt")
            })
            
        return result_docs, total_count

    @staticmethod
    async def delete_document(document_id: str) -> bool:
        from bson import ObjectId
        from app.services.s3_service import delete_file

        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            doc_oid = document_id

        # 1. Fetch document metadata to find the S3 object key
        doc = await db.db["documents"].find_one({"_id": doc_oid})
        if not doc:
            return False

        object_key = doc.get("objectKey")

        # 2. Delete file from AWS S3
        if object_key:
            try:
                delete_file(object_key)
            except Exception as s3_err:
                print(f"[DocumentService] Warning: S3 delete failed for key {object_key}: {s3_err}")

        # 3. Transactional MongoDB deletions
        try:
            async with await db.client.start_session() as session:
                async with session.start_transaction():
                    await db.db["documents"].delete_one({"_id": doc_oid}, session=session)
                    await db.db["conversations"].delete_one({"documentId": document_id}, session=session)
                    await db.db["insights"].delete_one({"documentId": document_id}, session=session)
                    await db.db["notes"].delete_many({"documentId": document_id}, session=session)
        except Exception as tx_err:
            # Fallback if MongoDB is running standalone without replica sets
            print(f"[DocumentService] Transactional session failed or not supported: {tx_err}. Falling back to sequential execution...")
            await db.db["documents"].delete_one({"_id": doc_oid})
            await db.db["conversations"].delete_one({"documentId": document_id})
            await db.db["insights"].delete_one({"documentId": document_id})
            await db.db["notes"].delete_many({"documentId": document_id})

        return True

    @staticmethod
    async def verify_owner(document_id: str, user_id: str) -> bool:
        from bson import ObjectId
        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            doc_oid = document_id

        doc = await db.db["documents"].find_one({"_id": doc_oid})
        if not doc:
            return False

        doc_user_id = doc.get("userId")
        # Documents without an owner are accessible to no one
        if not doc_user_id:
            return False

        return str(doc_user_id) == str(user_id)

    @staticmethod
    async def get_document(document_id: str) -> dict | None:
        from bson import ObjectId
        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            doc_oid = document_id

        doc = await db.db["documents"].find_one({"_id": doc_oid})
        if not doc:
            return None
        
        return {
            "documentId": str(doc["_id"]),
            "filename": doc.get("filename"),
            "uploadDate": doc.get("uploadTimestamp") or doc.get("createdAt") or datetime.datetime.utcnow(),
            "fileSize": doc.get("fileSize", 0),
            "pageCount": doc.get("pages", 0),
            "mimeType": doc.get("mimeType"),
            "fileUrl": doc.get("fileUrl"),
            "objectKey": doc.get("objectKey"),
            "status": doc.get("status", "Uploaded"),
            "userId": str(doc.get("userId")) if doc.get("userId") else None,
            "pagesContent": doc.get("pagesContent", []),
            "favorite": doc.get("favorite", False),
            "lastOpenedAt": doc.get("lastOpenedAt")
        }




