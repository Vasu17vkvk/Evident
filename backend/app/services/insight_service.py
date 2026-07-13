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
    @staticmethod
    async def get_or_generate_insights(document_id: str, default_model: str = None, user_id: str = None) -> dict:
        # 1. Check if insights already exist for this user+document pair
        existing = await db.db["insights"].find_one({"documentId": document_id, "userId": user_id})
        if existing:
            logger.info(f"[Insights] Returning cached insights for document: {document_id}")
            return {
                "documentId": existing["documentId"],
                "executiveSummary": existing.get("summary", {}).get("executiveSummary", ""),
                "documentPurpose": existing.get("summary", {}).get("documentPurpose", ""),
                "entities": existing.get("entities", {"people": [], "organizations": [], "locations": []}),
                "timeline": existing.get("timeline", []),
                "facts": existing.get("facts", [])
            }

        # 2. Fetch the document text
        # If it doesn't exist, we fallback to mock generation or return error
        from bson import ObjectId
        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            doc_oid = document_id

        doc = await db.db["documents"].find_one({"_id": doc_oid})
        if not doc:
            logger.warning(f"[Insights] Document {document_id} not found in database.")
            return {}

        # Combine text pages if available
        pages_content = doc.get("pagesContent", [])
        if not pages_content and doc.get("content"):
            content_obj = doc.get("content")
            if isinstance(content_obj, dict):
                pages_content = content_obj.get("textPages", [])

        document_text = "\n".join(pages_content) if pages_content else ""
        if not document_text.strip():
            logger.warning(f"[Insights] No text content found for document: {document_id}")
            document_text = f"Untitled Document: {doc.get('filename')}"

        filename = doc.get("filename", "document")
        model_name = get_working_model_name(default_model)

        logger.info(f"[Insights] Generating new insights for document {document_id} using {model_name}...")
        
        # 3. Request Gemini to generate insights in JSON format
        prompt = f"""
You are an AI document assistant. Your task is to analyze the document content below and extract insights in a strict JSON format.

Document Filename: {filename}
Document Content:
---
{document_text[:100000]}  # Truncate to safety limits if extremely large
---

Extract the following:
1. Executive Summary: A detailed summary of the document (2-3 short paragraphs).
2. Document Purpose: The primary purpose/aim of the document.
3. Facts: 3-5 key numerical facts or statistics from the document. Each fact must have:
   - label: A short label (e.g. "Total Revenue", "Headcount")
   - value: The value (e.g. "$1.2M", "45")
   - change: A brief description of what this value represents.
   - icon: One of the following lucide-react icon strings: "DollarSign", "Users", "Zap", "Building2", "TrendingUp", "Check", "Calendar", "Sparkles", "FileText"
4. Entities: Key entities mentioned in the document. Catagories:
   - people: List of people. Each must have: name, role, mentions (count).
   - organizations: List of organizations. Each must have: name, role, mentions (count).
   - locations: List of locations. Each must have: name, mentions (count).
5. Timeline: Key events or dates mentioned. Each timeline event must have:
   - date: The date or time period (e.g. "Q1 2026", "2026-07-09")
   - title: Event title
   - description: Description of the event
   - page: Page number where it occurred (estimate if unknown, or default to 1)

Response format:
Respond ONLY with a valid JSON object matching this schema (do not wrap in markdown code blocks or add introductory/concluding text):
{{
  "executiveSummary": "...",
  "documentPurpose": "...",
  "facts": [
    {{
      "label": "...",
      "value": "...",
      "change": "...",
      "icon": "..."
    }}
  ],
  "entities": {{
    "people": [
      {{
        "name": "...",
        "role": "...",
        "mentions": 1
      }}
    ],
    "organizations": [
      {{
        "name": "...",
        "role": "...",
        "mentions": 1
      }}
    ],
    "locations": [
      {{
        "name": "...",
        "mentions": 1
      }}
    ]
  }},
  "timeline": [
    {{
      "date": "...",
      "title": "...",
      "description": "...",
      "page": 1
    }}
  ]
}}
"""
        
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            raw_text = response.text.strip()
            
            # Clean up potential markdown formatting block wrapper
            if raw_text.startswith("```"):
                # strip out code block wrappers like ```json and ```
                cleaned = re.sub(r"^```(?:json)?\n", "", raw_text)
                cleaned = re.sub(r"\n```$", "", cleaned)
                raw_text = cleaned.strip()

            insights_data = json.loads(raw_text)
        except Exception as api_err:
            logger.error(f"[Insights] Gemini generation failed: {api_err}. Falling back to default skeleton.")
            # Fallback skeleton to prevent failure
            insights_data = {
                "executiveSummary": f"Executive summary of {filename}. Detailed insights could not be processed automatically at this time.",
                "documentPurpose": "To analyze key structures in the document.",
                "facts": [],
                "entities": {"people": [], "organizations": [], "locations": []},
                "timeline": []
            }

        # 4. Save the generated insights to MongoDB using upsert
        insights_doc = {
            "userId": user_id,
            "documentId": document_id,
            "summary": {
                "executiveSummary": insights_data.get("executiveSummary", ""),
                "documentPurpose": insights_data.get("documentPurpose", "")
            },
            "entities": insights_data.get("entities", {"people": [], "organizations": [], "locations": []}),
            "timeline": insights_data.get("timeline", []),
            "facts": insights_data.get("facts", []),
            "generatedAt": datetime.datetime.utcnow()
        }

        await db.db["insights"].update_one(
            {"documentId": document_id, "userId": user_id},
            {"$set": insights_doc},
            upsert=True
        )

        return {
            "documentId": document_id,
            "executiveSummary": insights_doc["summary"]["executiveSummary"],
            "documentPurpose": insights_doc["summary"]["documentPurpose"],
            "entities": insights_doc["entities"],
            "timeline": insights_doc["timeline"],
            "facts": insights_doc["facts"]
        }
