"""
Abstract base class for all AI providers.

Every concrete provider must implement:
- ``generate_answer()``  — produce a text answer for the question
- ``generate_citations()`` — extract supporting excerpts from the document
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas.chat import Citation, ConversationTurn


class AIProvider(ABC):
    """
    Interface contract for AI answer providers.

    Implementations must be stateless (or manage their own state internally)
    and must not raise unless the error is unrecoverable.
    """

    @abstractmethod
    async def generate_answer(
        self,
        question: str,
        document_text: str,
        conversation_history: list[ConversationTurn],
    ) -> str:
        """
        Generate a natural-language answer for *question* given the document.

        Parameters
        ----------
        question:
            The user's question.
        document_text:
            Full plain-text content of the document.
        conversation_history:
            Previous (role, content) turns, oldest first.

        Returns
        -------
        str
            The answer text.
        """

    @abstractmethod
    async def generate_citations(
        self,
        question: str,
        document_text: str,
    ) -> list[Citation]:
        """
        Extract one or more citations that support the answer.

        Parameters
        ----------
        question:
            The original user question (may guide retrieval).
        document_text:
            Full plain-text content of the document.

        Returns
        -------
        list[Citation]
            Ordered list of supporting excerpts with page and confidence.
        """
