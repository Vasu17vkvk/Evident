"""
Gemini AI Provider
==================
Stub for Google Gemini integration.

Integration checklist
---------------------
1. ``pip install google-generativeai``
2. Set ``GEMINI_API_KEY`` in your environment / ``.env`` file.
3. Un-comment and complete the implementation in each method below.
4. Change the active provider in ``ai_service.py``:

       from app.services.providers.gemini_provider import GeminiProvider
       _provider: AIProvider = GeminiProvider()
"""

from __future__ import annotations

# import os
# import google.generativeai as genai  # pip install google-generativeai

from app.schemas.chat import Citation, ConversationTurn
from app.services.providers.base import AIProvider


class GeminiProvider(AIProvider):
    """
    Google Gemini provider stub.

    All methods raise ``NotImplementedError`` until the integration is complete.
    """

    def __init__(self) -> None:
        # TODO: initialise the Gemini client when ready
        # api_key = os.environ["GEMINI_API_KEY"]
        # genai.configure(api_key=api_key)
        # self._model = genai.GenerativeModel("gemini-pro")
        pass

    async def generate_answer(
        self,
        question: str,
        document_text: str,
        conversation_history: list[ConversationTurn],
    ) -> str:
        """
        Call Gemini to answer *question* grounded in *document_text*.

        Integration notes
        -----------------
        - Build a system prompt that includes ``document_text`` as context.
        - Map ``conversation_history`` to Gemini's ``history`` format
          (list of ``{"role": ..., "parts": [...]}`` dicts).
        - Call ``self._model.generate_content()`` (or the async variant).

        Example skeleton::

            system_prompt = f"Answer using only the document below.\\n\\n{document_text}"
            history_turns = [
                {"role": turn.role, "parts": [turn.content]}
                for turn in conversation_history
            ]
            response = await self._model.generate_content_async(
                [system_prompt, *history_turns, question]
            )
            return response.text
        """
        raise NotImplementedError("GeminiProvider.generate_answer() is not yet implemented.")

    async def generate_citations(
        self,
        question: str,
        document_text: str,
    ) -> list[Citation]:
        """
        Extract citations from *document_text* relevant to *question*.

        Integration notes
        -----------------
        - Chunk ``document_text`` into paragraphs / sentences.
        - Use Gemini to rank or select the most relevant chunks.
        - Return them as ``Citation`` objects with page and confidence.

        Example skeleton::

            # Simple: ask the model to quote the relevant passage
            prompt = (
                f"From the document below, quote the passage most relevant to: {question}\\n\\n"
                f"{document_text}"
            )
            response = await self._model.generate_content_async(prompt)
            return [Citation(text=response.text.strip(), page=1, confidence=0.9)]
        """
        raise NotImplementedError("GeminiProvider.generate_citations() is not yet implemented.")
