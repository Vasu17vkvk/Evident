import { api } from "../api/api";

const API_URL = import.meta.env.VITE_API_URL ||
    "https://evident-0e7j.onrender.com";

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

export interface ChatCitation {
    text: string;
    page?: number;
    confidence?: number;
}

export interface ChatResponse {
    answer: string;
    citations: ChatCitation[];
}

// ---------------------------------------------------------------------------
// Non-streaming request (current implementation)
// ---------------------------------------------------------------------------

export const askQuestion = async (
    question: string,
    documentText: string,
    conversationHistory: ConversationTurn[] = [],
    model?: string,
    documentId?: string
): Promise<ChatResponse> => {
    const url = documentId ? `/chat/${documentId}` : `/chat`;
    
    const response = await api.post(
        url,
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
    model?: string,
    documentId?: string
): Promise<void> => {
    try {
        const response = await askQuestion(question, documentText, conversationHistory, model, documentId);

        // Simulate token delivery so the streaming path is exercised end-to-end.
        // Replace this block with real token events when SSE is available.
        callbacks.onToken(response.answer);

        callbacks.onComplete(response);
    } catch (err) {
        callbacks.onError(err);
    }
};

// ---------------------------------------------------------------------------
// Persistent chat history
// ---------------------------------------------------------------------------

export interface ChatMessageResponse {
  role: "user" | "assistant";
  content: string;
  /** ISO-8601 timestamp string */
  timestamp: string;
  model?: string;
  tokenUsage?: number;
  /** Citations returned with assistant messages */
  citations?: ChatCitation[];
}

/** Fetch all messages for the current user's session on a document. */
export const fetchChatHistory = async (documentId: string): Promise<ChatMessageResponse[]> => {
  const response = await api.get(`/chat/${documentId}`);
  return response.data;
};

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/**
 * Delete a chat session and all its messages.
 * The server returns 403 if the session belongs to another user.
 */
export const deleteChatSession = async (sessionId: string): Promise<void> => {
  await api.delete(`/chat/session/${sessionId}`);
};

/**
 * Fetch session metadata (including sessionId) for a document.
 * Creates a new session if none exists yet.
 */
export interface ChatSessionInfo {
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export const fetchChatSession = async (documentId: string): Promise<ChatSessionInfo> => {
  const response = await api.get(`/chat/session/info/${documentId}`);
  return response.data;
};