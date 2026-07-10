import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationTurn {
    role: "user" | "assistant";
    content: string;
}

/**
 * Lifecycle status of an assistant message.
 *
 * streaming → tokens are arriving (content may be partial)
 * complete  → full response received, citations available
 * error     → request failed
 */
export type MessageStatus = "streaming" | "complete" | "error";

/**
 * Callback contract for streaming responses.
 * Future SSE / WebSocket implementations must satisfy this interface —
 * swapping from mock to real streaming only requires replacing the body
 * of `streamQuestion`, not any call sites.
 */
export interface ChatStreamCallbacks {
    /** Called for every token chunk as it arrives. */
    onToken: (token: string) => void;
    /** Called once when the full response (including citations) is available. */
    onComplete: (response: ChatResponse) => void;
    /** Called if the request fails at any point. */
    onError: (error: unknown) => void;
}

export interface ChatResponse {
    answer: string;
    citations: Array<{
        text: string;
        page?: number;
        confidence?: number;
    }>;
}

// ---------------------------------------------------------------------------
// Non-streaming request (current implementation)
// ---------------------------------------------------------------------------

export const askQuestion = async (
    question: string,
    documentText: string,
    conversationHistory: ConversationTurn[] = [],
    model?: string
): Promise<ChatResponse> => {
    const response = await axios.post(
        `${API_URL}/chat`,
        {
            question,
            documentText,
            conversationHistory,
            model,
        }
    );

    return response.data as ChatResponse;
};

// ---------------------------------------------------------------------------
// Streaming-ready request
//
// Currently delegates to the non-streaming implementation.
// To enable real streaming: replace this body with an SSE / WebSocket
// connection that calls `callbacks.onToken(chunk)` for each token and
// `callbacks.onComplete(fullResponse)` when done.
// ---------------------------------------------------------------------------

export const streamQuestion = async (
    question: string,
    documentText: string,
    conversationHistory: ConversationTurn[] = [],
    callbacks: ChatStreamCallbacks,
    model?: string
): Promise<void> => {
    try {
        const response = await askQuestion(question, documentText, conversationHistory, model);

        // Simulate token delivery so the streaming path is exercised end-to-end.
        // Replace this block with real token events when SSE is available.
        callbacks.onToken(response.answer);

        callbacks.onComplete(response);
    } catch (err) {
        callbacks.onError(err);
    }
};