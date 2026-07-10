"""
Mock AI Provider
================
Returns hard-coded placeholder responses.

This is the **default** provider and is the only one that makes no
external network calls.  All business logic that currently lives in
``AIService`` was moved here.

Replace with ``GeminiProvider`` or ``OpenAIProvider`` once API keys
are configured (see ``ai_service.py``).
"""

from __future__ import annotations

from app.schemas.chat import Citation, ConversationTurn
from app.services.providers.base import AIProvider


class MockProvider(AIProvider):
    """Deterministic placeholder provider — no external calls."""

    async def generate_answer(
        self,
        question: str,
        document_text: str,
        conversation_history: list[ConversationTurn],
    ) -> str:
        return (
            f"Based on the document, the answer to \"{question}\" is currently "
            "being processed. This is a placeholder response \u2014 a real answer will be "
            "generated once an LLM is integrated."
        )

    async def generate_citations(
        self,
        question: str,
        document_text: str,
    ) -> list[Citation]:
        excerpt_end = min(300, len(document_text))
        excerpt = document_text[:excerpt_end].strip()
        if len(document_text) > excerpt_end:
            excerpt += "\u2026"

        return [
            Citation(
                text=excerpt,
                page=1,
                confidence=0.95,
            )
        ]
