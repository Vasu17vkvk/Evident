"""
OpenAI Provider
===============
Stub for OpenAI GPT integration.

Integration checklist
---------------------
1. ``pip install openai``
2. Set ``OPENAI_API_KEY`` in your environment / ``.env`` file.
3. Un-comment and complete the implementation in each method below.
4. Change the active provider in ``ai_service.py``:

       from app.services.providers.openai_provider import OpenAIProvider
       _provider: AIProvider = OpenAIProvider()
"""

from __future__ import annotations

# import os
# from openai import AsyncOpenAI  # pip install openai

from app.schemas.chat import Citation, ConversationTurn
from app.services.providers.base import AIProvider


class OpenAIProvider(AIProvider):
    """
    OpenAI GPT provider stub.

    All methods raise ``NotImplementedError`` until the integration is complete.
    """

    def __init__(self, model: str = "gpt-4o-mini") -> None:
        self._model = model
        # TODO: initialise the OpenAI async client when ready
        # self._client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

    async def generate_answer(
        self,
        question: str,
        document_text: str,
        conversation_history: list[ConversationTurn],
    ) -> str:
        """
        Call OpenAI to answer *question* grounded in *document_text*.

        Integration notes
        -----------------
        - Use the ``messages`` array format with a system message containing
          ``document_text`` as context.
        - Map ``conversation_history`` to OpenAI message dicts
          (``{"role": turn.role, "content": turn.content}``).
        - Append the new user question as the last message.

        Example skeleton::

            messages = [
                {
                    "role": "system",
                    "content": f"Answer using only the document below.\\n\\n{document_text}",
                },
                *[{"role": t.role, "content": t.content} for t in conversation_history],
                {"role": "user", "content": question},
            ]
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
            )
            return response.choices[0].message.content or ""
        """
        raise NotImplementedError("OpenAIProvider.generate_answer() is not yet implemented.")

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
        - Ask the model to identify and quote the most relevant chunks.
        - Parse the response into ``Citation`` objects.

        Example skeleton::

            prompt = (
                f"From the document below, quote the most relevant passage for: {question}\\n\\n"
                f"{document_text}"
            )
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
            )
            excerpt = response.choices[0].message.content or ""
            return [Citation(text=excerpt.strip(), page=1, confidence=0.9)]
        """
        raise NotImplementedError("OpenAIProvider.generate_citations() is not yet implemented.")
