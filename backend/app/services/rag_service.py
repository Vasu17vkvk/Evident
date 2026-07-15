import os
import math
import logging
import datetime
import google.generativeai as genai
from app.database.mongodb import db

logger = logging.getLogger("uvicorn.error")

# Configure Gemini API Key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class RAGService:
    @staticmethod
    def split_text_into_chunks(text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
        """
        Split a string of text into smaller sliding chunks.
        """
        chunks = []
        if not text or not text.strip():
            return chunks
            
        start = 0
        text_len = len(text)
        while start < text_len:
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - overlap
            if end >= text_len:
                break
        return chunks

    @staticmethod
    def get_embedding(text: str, is_query: bool = False) -> list[float]:
        """
        Generate embedding using Gemini gemini-embedding-001 with exponential backoff retries.
        """
        import time
        max_retries = 3
        backoff_factor = 2
        for attempt in range(max_retries):
            try:
                task_type = "retrieval_query" if is_query else "retrieval_document"
                response = genai.embed_content(
                    model="models/gemini-embedding-001",
                    content=text,
                    task_type=task_type
                )
                return response["embedding"]
            except Exception as e:
                logger.warning(f"[RAGService] Failed to generate embedding (attempt {attempt + 1}): {e}")
                if attempt == max_retries - 1:
                    raise
                time.sleep(backoff_factor ** attempt)

    @staticmethod
    async def chunk_document(document_id: str, pages_content: list[str], user_id: str = None) -> bool:
        """
        Processes document page contents, generates chunk embeddings, and caches them in MongoDB.
        """
        try:
            logger.info(f"[RAGService] Starting chunking process for document: {document_id}")
            
            # 1. Clear existing chunks to prevent duplicates — scoped to this user+document pair
            delete_filter = {"documentId": document_id}
            if user_id:
                delete_filter["userId"] = user_id
            await db.db["document_chunks"].delete_many(delete_filter)
            
            if not pages_content:
                logger.warning(f"[RAGService] No pagesContent found for document {document_id}")
                return True
                
            chunks_to_insert = []
            
            # 2. Iterate page-by-page to keep page context for citation references
            for page_idx, page_text in enumerate(pages_content):
                page_num = page_idx + 1
                page_chunks = RAGService.split_text_into_chunks(page_text)
                
                for chunk_idx, chunk_text in enumerate(page_chunks):
                    # Generate vector embedding for this chunk
                    embedding = RAGService.get_embedding(chunk_text, is_query=False)
                    
                    chunks_to_insert.append({
                        "documentId": document_id,
                        "userId": user_id,
                        "pageNumber": page_num,
                        "chunkIndex": chunk_idx,
                        "text": chunk_text,
                        "embedding": embedding,
                        "createdAt": datetime.datetime.utcnow()
                    })
            
            # 3. Batch insert chunks into MongoDB
            if chunks_to_insert:
                await db.db["document_chunks"].insert_many(chunks_to_insert)
                logger.info(f"[RAGService] Successfully chunked and stored {len(chunks_to_insert)} vector chunks.")
            
            return True
        except Exception as e:
            logger.error(f"[RAGService] Error in chunk_document: {e}")
            return False

    @staticmethod
    def cosine_similarity(v1: list[float], v2: list[float]) -> float:
        """
        Compute the cosine similarity between two vectors.
        """
        dot_product = sum(x * y for x, y in zip(v1, v2))
        norm_v1 = math.sqrt(sum(x * x for x in v1))
        norm_v2 = math.sqrt(sum(y * y for y in v2))
        if not norm_v1 or not norm_v2:
            return 0.0
        return dot_product / (norm_v1 * norm_v2)

    @staticmethod
    async def retrieve_context(document_id: str, query: str, limit: int = 5, user_id: str = None) -> list[dict]:
        """
        Retrieves the top N most relevant document chunks based on semantic similarity.
        """
        try:
            logger.info(f"[RAGService] Querying context for doc '{document_id}': '{query}'")
            
            # Generate vector embedding for the query
            query_vector = RAGService.get_embedding(query, is_query=True)
            
            # Fetch all cached chunks for this user's document only
            chunks_filter = {"documentId": document_id}
            if user_id:
                chunks_filter["userId"] = user_id
            chunks = await db.db["document_chunks"].find(chunks_filter).to_list(None)
            if not chunks:
                logger.warning(f"[RAGService] No chunks found for document {document_id}")
                return []
                
            # Score each chunk using cosine similarity
            scored_chunks = []
            for chunk in chunks:
                similarity = RAGService.cosine_similarity(query_vector, chunk["embedding"])
                scored_chunks.append({
                    "text": chunk["text"],
                    "pageNumber": chunk["pageNumber"],
                    "similarity": similarity
                })
                
            # Sort by similarity score descending
            scored_chunks.sort(key=lambda x: x["similarity"], reverse=True)
            
            # Return the top matches up to limit
            retrieved = scored_chunks[:limit]
            logger.info(f"[RAGService] Retrieved {len(retrieved)} relevant chunks.")
            return retrieved
        except Exception as e:
            logger.error(f"[RAGService] Context retrieval failed: {e}")
            return []
