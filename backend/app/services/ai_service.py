"""
AI Service
==========
Thin orchestrator that delegates answer generation and citation
extraction to the configured ``AIProvider``.

Switching providers
-------------------
Change the ``_provider`` assignment below to the desired implementation:

    # Use Google Gemini
    from app.services.providers.gemini_provider import GeminiProvider
    _provider: AIProvider = GeminiProvider()

    # Use OpenAI GPT
    from app.services.providers.openai_provider import OpenAIProvider
    _provider: AIProvider = OpenAIProvider()

The router (``api/chat.py``) and all callers require **zero changes**.
"""

from __future__ import annotations

from app.schemas.chat import Citation, ConversationTurn
from app.services.providers.base import AIProvider
from app.services.providers.mock_provider import MockProvider

# ---------------------------------------------------------------------------
# Active provider — change this line to swap implementations
# ---------------------------------------------------------------------------

_provider: AIProvider = MockProvider()


# ---------------------------------------------------------------------------
# Public facade
# ---------------------------------------------------------------------------

class AIService:
    """
    Stateless facade over the active ``AIProvider``.

    The router calls ``AIService.answer()``; this class forwards the call
    to ``_provider`` and returns the result.  The provider can be replaced
    at any time without touching the router or the schema layer.
    """

    @staticmethod
    async def answer(
        question: str,
        document_text: str,
        conversation_history: list[ConversationTurn] | None = None,
    ) -> tuple[str, list[Citation]]:
        """
        Generate an answer and supporting citations for *question*.

        Parameters
        ----------
        question:
            The user's natural-language question.
        document_text:
            Full plain-text content of the document being queried.
        conversation_history:
            Previous turns in this session (oldest first, max 10 items).

        Returns
        -------
        (answer, citations)
            A 2-tuple of the answer string and a list of ``Citation`` objects.
        """
        history = conversation_history or []

        answer_text = await _provider.generate_answer(question, document_text, history)
        citations = await _provider.generate_citations(question, document_text)

        return answer_text, citations


# ---------------------------------------------------------------------------
# ask_document function (referenced by chat.py)
# ---------------------------------------------------------------------------

import google.generativeai as genai
import os
from dotenv import load_dotenv

# Ensure environment variables from .env are loaded
load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

_cached_model_name = None

def get_working_model_name(selected_model: str | None = None) -> str:
    global _cached_model_name
    if selected_model is None and _cached_model_name is not None:
        return _cached_model_name

    models_to_try = []
    if selected_model:
        models_to_try.append(selected_model)

    models_to_try.extend([
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
    ])

    # De-duplicate while preserving order
    seen = set()
    models_to_try = [x for x in models_to_try if not (x in seen or seen.add(x))]

    api_key = os.getenv("GEMINI_API_KEY")
    print("SDK Version:", genai.__version__)
    print("API Key Exists:", bool(api_key))
    if api_key:
        print("API Key Length:", len(api_key))

    # Test each model in order and stop on the first successful model
    for m_name in models_to_try:
        try:
            print(f"Testing model connectivity: {m_name}")
            m = genai.GenerativeModel(m_name)
            # Try a quick test generate_content call
            response = m.generate_content("ping")
            if response.text:
                if not selected_model:
                    _cached_model_name = m_name
                print("Using Gemini model:", m_name)
                return m_name
        except Exception as init_err:
            print(f"Model {m_name} failed: {init_err}. Trying next...")
            continue

    # Fallback to the first one in list
    fallback = models_to_try[0]
    if not selected_model:
        _cached_model_name = fallback
    print("Using Gemini model:", fallback)
    return fallback



def ask_document(question: str, context_chunks: list[dict] | str, model_name: str | None = None) -> str:
    if isinstance(context_chunks, str):
        context_text = context_chunks
    else:
        formatted_chunks = []
        for chunk in context_chunks:
            page_num = chunk.get("pageNumber", "Unknown")
            text = chunk.get("text", "")
            formatted_chunks.append(f"--- [Page {page_num}] ---\n{text}")
        context_text = "\n\n".join(formatted_chunks)

    prompt = f"""
You are an AI document copilot assisting the user.

Below is the retrieved document context to analyze and answer from:
{context_text}

User Question:
{question}

Instructions for your response:
1. Tone & Style: Respond naturally and conversationally, as a human teammate would.
2. Avoid robotic phrasing: Do NOT use phrases like "The document is identified as...", "Based on the provided chunks...", "According to the context...".
3. Use human language: Use phrases like "I found that...", "It looks like...", "From what I can see...", "This section appears to discuss...".
4. Citations: When referring to information from a specific page, always cite the source page number using the format [Page X] (e.g., "[Page 3]"). This is extremely important. If information spans multiple pages, cite them all (e.g., "[Page 1], [Page 2]").
5. Structure:
   - Keep the answer concise.
   - Use short, readable paragraphs.
   - Use bullet points when useful.
6. Uncertainty: If the answer cannot be found in the provided context, clearly mention the uncertainty or limitations.
7. Follow-up: End with a friendly, helpful follow-up suggestion or question to guide the user's next steps if appropriate.
"""

    model_to_use = get_working_model_name(model_name)
    try:
        model = genai.GenerativeModel(model_to_use)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        import traceback
        print("\n========== GEMINI ERROR ==========")
        print(str(e))
        traceback.print_exc()
        print("==================================")
        raise



