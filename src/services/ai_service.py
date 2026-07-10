import google.generativeai as genai
import os

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel(
    "gemini-3.1-flash-lite"
)

def ask_document(question: str, document_text: str):
    prompt = f"""
You are an AI document copilot assisting the user.

Below is the document content to analyze and answer from:
---
{document_text}
---

User Question:
{question}

Instructions for your response:
1. Tone & Style: Respond naturally and conversationally, as a human teammate would.
2. Avoid robotic phrasing: Do NOT use phrases like "The document is identified as...", "The document contains...", "Based on the provided document...".
3. Use human language: Use phrases like "I found that...", "It looks like...", "From what I can see...", "This section appears to discuss...".
4. Structure:
   - Keep the answer concise.
   - Use short, readable paragraphs.
   - Use bullet points when useful.
5. Uncertainty: If the answer is not clearly stated in the document or confidence is low, clearly mention the uncertainty or limitations.
6. Follow-up: End with a friendly, helpful follow-up suggestion or question to guide the user's next steps if appropriate.
"""

    response = model.generate_content(prompt)

    return response.text