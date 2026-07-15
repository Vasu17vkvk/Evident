import datetime
import json
import logging
import os
import re
from app.database.mongodb import db
from app.services.ai_service import get_working_model_name
import google.generativeai as genai

logger = logging.getLogger("uvicorn.error")


class InsightService:

    # ------------------------------------------------------------------
    # Read / generate
    # ------------------------------------------------------------------

    @staticmethod
    async def get_or_generate_insights(
        document_id: str,
        default_model: str = None,
        user_id: str = None,
    ) -> dict:
        """
        Return cached insights if they exist, otherwise generate via Gemini,
        persist to the insights collection, and return.
        """
        # 1. Cache hit — return immediately. Filter using both userId and user_id for strict compliance.
        existing = await db.db["insights"].find_one({
            "documentId": document_id,
            "userId": user_id,
            "user_id": user_id,
        })
        if existing:
            logger.info(f"[Insights] Returning cached insights for document: {document_id}")
            return InsightService._format_response(existing)

        # 2. Fetch document text
        from bson import ObjectId
        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            doc_oid = document_id

        # Use double-safety filter when reading document as well
        doc = await db.db["documents"].find_one({
            "_id": doc_oid,
            "userId": user_id,
        })
        if not doc:
            logger.warning(f"[Insights] Document {document_id} not found for user {user_id}.")
            return {}

        pages_content = doc.get("pagesContent", [])
        if not pages_content and doc.get("content"):
            content_obj = doc.get("content")
            if isinstance(content_obj, dict):
                pages_content = content_obj.get("textPages", [])

        document_text = "\n".join(pages_content) if pages_content else ""
        if not document_text.strip():
            logger.warning(f"[Insights] No text content for document: {document_id}")
            document_text = f"Document: {doc.get('filename', 'Untitled')}"

        filename = doc.get("filename", "document")
        model_name = get_working_model_name(default_model)
        logger.info(f"[Insights] Generating insights for {document_id} using {model_name}...")

        # 3. Generate via Gemini
        insights_data = await InsightService._generate_with_gemini(
            document_text, filename, model_name
        )

        # 4. Persist — upsert with both camelCase and snake_case fields
        now = datetime.datetime.utcnow()
        insights_doc = {
            "userId": user_id,
            "user_id": user_id,
            "documentId": document_id,
            "document_id": document_id,
            "summary": {
                "executiveSummary": insights_data.get("executiveSummary", ""),
                "documentPurpose": insights_data.get("documentPurpose", ""),
                "executive_summary": insights_data.get("executiveSummary", ""),
                "document_purpose": insights_data.get("documentPurpose", ""),
            },
            "keyPoints": insights_data.get("keyPoints", []),
            "key_points": insights_data.get("keyPoints", []),
            "actionItems": insights_data.get("actionItems", []),
            "action_items": insights_data.get("actionItems", []),
            "questions": insights_data.get("questions", []),
            "entities": insights_data.get(
                "entities", {"people": [], "organizations": [], "locations": []}
            ),
            "timeline": insights_data.get("timeline", []),
            "facts": insights_data.get("facts", []),
            "modelUsed": model_name,
            "updatedAt": now,
            "updated_at": now,
        }

        # Only set createdAt/created_at on the first insert
        await db.db["insights"].update_one(
            {
                "documentId": document_id,
                "userId": user_id,
                "user_id": user_id,
            },
            {
                "$set": insights_doc,
                "$setOnInsert": {
                    "createdAt": now,
                    "created_at": now,
                },
            },
            upsert=True,
        )

        try:
            from app.services.usage_service import UsageService
            await UsageService.track_usage(user_id, "insights_generated")
        except Exception as ue:
            print(f"[UsageService] Error: {ue}")

        # Fetch back to get the final document (captures createdAt/created_at from DB)
        saved = await db.db["insights"].find_one({
            "documentId": document_id,
            "userId": user_id,
            "user_id": user_id,
        })
        return InsightService._format_response(
            saved or {**insights_doc, "createdAt": now, "created_at": now}
        )

    @staticmethod
    async def delete_insights(document_id: str, user_id: str) -> bool:
        """
        Delete cached insights for a (user, document) pair.
        Returns True if a document was deleted, False if nothing was found.
        """
        result = await db.db["insights"].delete_one({
            "documentId": document_id,
            "userId": user_id,
            "user_id": user_id,
        })
        deleted = result.deleted_count > 0
        if deleted:
            logger.info(f"[Insights] Deleted cached insights for document {document_id} (user {user_id})")
        return deleted

    @staticmethod
    async def insights_exist(document_id: str, user_id: str) -> bool:
        """Quick existence check without fetching the full document."""
        doc = await db.db["insights"].find_one(
            {
                "documentId": document_id,
                "userId": user_id,
                "user_id": user_id,
            },
            projection={"_id": 1},
        )
        return doc is not None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    async def _generate_with_gemini(document_text: str, filename: str, model_name: str) -> dict:
        prompt = f"""
You are an AI document assistant. Analyze the document content below and extract structured insights in strict JSON format.

Document Filename: {filename}
Document Content:
---
{document_text[:100000]}
---

Extract the following:
1. Executive Summary: A detailed summary of the document (2-3 short paragraphs).
2. Document Purpose: The primary purpose/aim of the document.
3. Key Points: 3-6 bullet-point takeaways from the document. Each must be a concise sentence.
4. Action Items: 2-5 concrete next steps or recommendations found in or implied by the document.
5. Questions: 3-5 thought-provoking questions a reader might have after reading the document.
6. Facts: 3-5 key numerical facts or statistics. Each must have:
   - label: Short label (e.g. "Total Revenue")
   - value: The value (e.g. "$1.2M")
   - change: Brief description of what this value represents.
   - icon: One of: "DollarSign", "Users", "Zap", "Building2", "TrendingUp", "Check", "Calendar", "Sparkles", "FileText"
7. Entities: Key entities. Categories:
   - people: Each must have: name, role, mentions (count).
   - organizations: Each must have: name, role, mentions (count).
   - locations: Each must have: name, mentions (count).
8. Timeline: Key events or dates. Each must have: date, title, description, page (estimate, default 1).

Respond ONLY with a valid JSON object matching this schema (no markdown code blocks, no extra text):
{{
  "executiveSummary": "...",
  "documentPurpose": "...",
  "keyPoints": ["...", "..."],
  "actionItems": ["...", "..."],
  "questions": ["...", "..."],
  "facts": [
    {{"label": "...", "value": "...", "change": "...", "icon": "..."}}
  ],
  "entities": {{
    "people": [{{"name": "...", "role": "...", "mentions": 1}}],
    "organizations": [{{"name": "...", "role": "...", "mentions": 1}}],
    "locations": [{{"name": "...", "mentions": 1}}]
  }},
  "timeline": [
    {{"date": "...", "title": "...", "description": "...", "page": 1}}
  ]
}}
"""
        import asyncio
        import concurrent.futures
        max_retries = 3
        backoff_factor = 2
        for attempt in range(max_retries):
            try:
                model = genai.GenerativeModel(model_name)
                loop = asyncio.get_running_loop()
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    response = await loop.run_in_executor(pool, lambda: model.generate_content(prompt))
                raw_text = response.text.strip()

                # Strip markdown code block wrappers if present
                if raw_text.startswith("```"):
                    raw_text = re.sub(r"^```(?:json)?\n", "", raw_text)
                    raw_text = re.sub(r"\n```$", "", raw_text)
                    raw_text = raw_text.strip()

                return json.loads(raw_text)
            except Exception as api_err:
                logger.warning(f"[Insights] Gemini generation attempt {attempt + 1} failed: {api_err}")
                if attempt == max_retries - 1:
                    logger.error(f"[Insights] Gemini generation completely failed: {api_err}. Using fallback skeleton.")
                    return {
                        "executiveSummary": f"Executive summary of {filename}. Insights could not be generated automatically at this time.",
                        "documentPurpose": "To convey the key information contained in the document.",
                        "keyPoints": [],
                        "actionItems": [],
                        "questions": [],
                        "facts": [],
                        "entities": {"people": [], "organizations": [], "locations": []},
                        "timeline": [],
                    }
                await asyncio.sleep(backoff_factor ** attempt)

    @staticmethod
    def _format_response(doc: dict) -> dict:
        """Normalise a MongoDB insights document into the API response shape."""
        # Grab from summary with support for both snake_case and camelCase
        summary = doc.get("summary", {})
        exec_sum = summary.get("executiveSummary") or summary.get("executive_summary") or ""
        doc_purp = summary.get("documentPurpose") or summary.get("document_purpose") or ""

        return {
            "documentId": doc.get("documentId") or doc.get("document_id") or "",
            "executiveSummary": exec_sum,
            "documentPurpose": doc_purp,
            "keyPoints": doc.get("keyPoints") or doc.get("key_points") or [],
            "actionItems": doc.get("actionItems") or doc.get("action_items") or [],
            "questions": doc.get("questions") or [],
            "entities": doc.get(
                "entities", {"people": [], "organizations": [], "locations": []}
            ),
            "timeline": doc.get("timeline") or [],
            "facts": doc.get("facts") or [],
            "modelUsed": doc.get("modelUsed") or doc.get("model_used") or "",
            "createdAt": doc.get("createdAt") or doc.get("created_at"),
            "updatedAt": doc.get("updatedAt") or doc.get("updated_at"),
        }
