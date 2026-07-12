import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Sparkles,
  SendHorizontal,
  ChevronRight,
  X,
  Copy,
  Loader2,
} from "lucide-react";
import { useDocument } from "../../hooks/useDocument";
import { askQuestion, streamQuestion, type ConversationTurn, type MessageStatus, type ChatResponse } from "../../../services/ai/chatService";
import { SuggestionsService } from "../../services/document/SuggestionsService";
import { ChatHistoryService, type PersistedMessage } from "../../services/document/ChatHistoryService";


type ModelTier = "Economy" | "Balanced" | "Advanced";

const MODEL_MAP: Record<ModelTier, { name: string; cost: "Low" | "Medium" | "High" }> = {
  Economy: { name: "gemini-2.0-flash-lite", cost: "Low" },
  Balanced: { name: "gemini-2.5-flash", cost: "Medium" },
  Advanced: { name: "gemini-2.5-pro", cost: "High" },
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{ page: number; excerpt: string; confidence: number }>;
  timestamp: number; // Unix ms
  /**
   * Lifecycle status of assistant messages.
   * - streaming : tokens arriving, content is partial
   * - complete  : full response received
   * - error     : request failed
   * User messages are always "complete".
   */
  status: MessageStatus;
}

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  showMessages?: boolean;
  onCitationClick: (page: number, text?: string) => void;
}

export function AICopilotPanel({
  isOpen = true,
  onClose,
  onCitationClick,
}: Props) {
  const { document } = useDocument();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const [selectedTier, setSelectedTier] = useState<ModelTier>(() => {
    const saved = localStorage.getItem("evident_copilot_model_tier");
    return (saved as ModelTier) || "Economy";
  });

  const handleModelChange = useCallback((tier: ModelTier) => {
    setSelectedTier(tier);
    localStorage.setItem("evident_copilot_model_tier", tier);
  }, []);
  // Track the previous document id so we can detect document swaps
  const prevDocIdRef = useRef<string | undefined>(undefined);

  // Derive context-aware suggestions whenever the document changes
  const suggestions = useMemo(
    () => SuggestionsService.getSuggestions(document ?? null),
    [document]
  );

  // ── Chat history: load / clear / save ──────────────────────────────────

  // Load history when the document first becomes available
  useEffect(() => {
    if (!document?.id) return;

    const docId = document.id;

    if (prevDocIdRef.current === docId) {
      // Same document — nothing to do (already loaded)
      return;
    }

    // Document changed: clear the displayed messages while we load the new history
    setMessages([]);

    if (prevDocIdRef.current !== undefined) {
      // Previous document existed — its history was already saved; nothing to clear
      // (We intentionally keep old history in IDB so the user can reopen it later)
    }

    prevDocIdRef.current = docId;

    ChatHistoryService.load(docId).then((persisted) => {
      if (persisted.length === 0) return;
      // Map PersistedMessage → UI Message (same shape — timestamp already present)
      setMessages(persisted as Message[]);
      console.log(`[EVIDENT] Chat history restored: ${persisted.length} messages for doc ${docId}`);
    });
  }, [document?.id]);

  // Persist messages to IDB whenever the list changes
  useEffect(() => {
    const docId = document?.id;
    if (!docId || messages.length === 0) return;
    // Cast is safe: Message is a strict superset of PersistedMessage
    ChatHistoryService.save(docId, messages as PersistedMessage[]);
  }, [messages, document?.id]);

  // Auto-scroll to bottom whenever messages or typing indicator change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const HISTORY_LIMIT = 10;

  /** Immutably update a single message by id, leaving others intact. */
  const updateMessageById = useCallback(
    (id: string, patch: Partial<Message>) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
      ),
    []
  );

  const handleSend = useCallback(async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) return;

    // Snapshot current messages BEFORE the state update so we can build history
    const historySnapshot = messages
      .slice(-HISTORY_LIMIT) // last 10 turns
      .map((m): ConversationTurn => ({ role: m.role, content: m.content }));

    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
      status: "complete",
    };

    // Placeholder assistant message shown immediately with streaming status
    const assistantId = Math.random().toString();
    const placeholderMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      status: "streaming",
    };

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInput("");
    setIsTyping(true);

    const documentText = document?.content?.fullText?.trim() || "No text content available.";
    const docIdForChat = document?.mongoDbId || document?.id;
    const modelName = MODEL_MAP[selectedTier].name;

    await streamQuestion(trimmed, documentText, historySnapshot, {
      /** Append each token chunk to the placeholder message content */
      onToken(token: string) {
        updateMessageById(assistantId, {
          content: token, // currently receives the full answer in one shot
          // When real SSE lands, change to: content: (prev.content ?? "") + token
        });
      },

      /** Finalise the message: attach citations and mark complete */
      onComplete(response: ChatResponse) {
        const citations = (response.citations ?? []).map(
          (c) => ({
            page: c.page ?? 1,
            excerpt: c.text.length > 200 ? c.text.substring(0, 200) + "…" : c.text,
            confidence: c.confidence ?? 1,
          })
        );
        updateMessageById(assistantId, {
          content: response.answer,
          citations,
          status: "complete",
        });
        setIsTyping(false);
      },

      /** Mark the placeholder as errored */
      onError(err: any) {
        console.error("[EVIDENT] chat API error:", err);
        let errorText = "Failed to contact AI Copilot.";
        if (err?.response?.data?.detail) {
          errorText = err.response.data.detail;
        } else if (err?.message) {
          errorText = `Error: ${err.message}`;
        }
        updateMessageById(assistantId, {
          content: errorText,
          status: "error",
        });
        setIsTyping(false);
      },
    }, modelName, docIdForChat);
  }, [document, isTyping, messages, updateMessageById, selectedTier]);

  return (
    <>
      {/* Panel */}
      <aside
        className={`
          flex flex-col h-full w-full
          border-l border-border bg-background
          transition-all duration-200 ease-in-out
          lg:shrink-0 lg:relative lg:h-full
          ${isOpen ? "lg:w-[360px] lg:opacity-100" : "lg:w-0 lg:opacity-0 lg:border-none lg:overflow-hidden"}
        `}
      >
        {/* ── Panel header ────────────────────────── */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-[#ff3d00]" strokeWidth={1.5} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">
              AI Copilot
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Message / empty area ─────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-5 flex size-10 items-center justify-center border border-border bg-card">
                <Sparkles className="size-4 text-[#ff3d00]" strokeWidth={1.5} />
              </div>
              <p className="mb-1 text-sm font-semibold tracking-tight text-foreground">
                Ask anything about this document
              </p>
              <p className="mb-8 text-[11px] leading-relaxed text-muted-foreground">
                Every answer includes direct citations linked to the source page.
              </p>

              {/* Suggested prompts — empty state */}
              <div className="flex w-full flex-col gap-2">
                {suggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="flex items-center justify-between border border-border px-4 py-3 text-left text-[11px] text-muted-foreground hover:border-[#ff3d00]/30 hover:text-foreground transition-all duration-150"
                  >
                    {prompt}
                    <ChevronRight
                      className="size-3 shrink-0"
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message thread */
            <div className="flex flex-col">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`border-b border-border px-5 py-5 ${msg.role === "user" ? "bg-background" : "bg-card"}`}
                >
                  {/* Role label */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
                      {msg.role === "user" ? "You" : "Copilot"}
                    </span>
                    {msg.role === "assistant" && msg.status === "complete" && (
                      <button 
                        type="button"
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                      >
                        <Copy className="size-3" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  {/* Content + streaming cursor */}
                  <p className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap select-text">
                    {msg.content}
                    {msg.status === "streaming" && (
                      <span
                        aria-hidden="true"
                        className="ml-0.5 inline-block h-3 w-0.5 bg-[#ff3d00] align-middle animate-pulse"
                      />
                    )}
                  </p>

                  {/* Citations — only shown once the response is complete */}
                  {msg.status === "complete" && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">
                        Sources
                      </p>
                      <div className="flex flex-col gap-2">
                        {msg.citations.map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onCitationClick(c.page, c.excerpt)}
                            className="group flex flex-col gap-2 rounded border border-border bg-card px-3 py-3 text-left hover:border-[#ff3d00]/40 transition-colors"
                          >
                            {/* Header row: page + confidence */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] font-semibold text-[#ff3d00]">
                                  Page {c.page}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[9px] text-muted-foreground/60">
                                  {Math.round(c.confidence * 100)}% confidence
                                </span>
                                <ChevronRight
                                  className="size-2.5 text-muted-foreground/30 group-hover:text-[#ff3d00]/50 transition-colors"
                                  strokeWidth={1.5}
                                />
                              </div>
                            </div>
                            {/* Quoted excerpt */}
                            <p className="font-mono text-[10px] leading-relaxed text-muted-foreground line-clamp-3">
                              &ldquo;{c.excerpt}&rdquo;
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="bg-card border-b border-border px-5 py-5 flex items-center gap-2">
                  <Loader2 className="size-3.5 text-[#ff3d00] animate-spin" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Evident AI is thinking…
                  </span>
                </div>
              )}
              {/* Scroll anchor */}
              <div ref={bottomRef} />
            </div>
          )}
        </div>



        {/* ── Input area ───────────────────────────── */}
        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-center gap-2 border border-border bg-secondary pl-3 pr-2 py-1.5 focus-within:border-[#ff3d00]/40 transition-colors">
            <textarea
              rows={1}
              placeholder="Ask a question about this document…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              disabled={isTyping}
              className="flex-1 resize-none bg-transparent text-[12px] leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed align-middle py-0.5"
            />
            
            {/* Model Dropdown */}
            <div className="shrink-0 flex items-center bg-background border border-border rounded-sm h-7 w-[85px] lg:w-[110px]">
              <select
                value={selectedTier}
                onChange={(e) => handleModelChange(e.target.value as ModelTier)}
                className="bg-transparent font-mono text-[8px] uppercase tracking-wider text-foreground focus:outline-none cursor-pointer w-full pl-1.5 pr-1"
              >
                <option value="Economy" className="bg-popover text-foreground">Economy</option>
                <option value="Balanced" className="bg-popover text-foreground">Balanced</option>
                <option value="Advanced" className="bg-popover text-foreground">Advanced</option>
              </select>
            </div>

            {/* Send Button */}
            <button 
              type="button"
              onClick={() => handleSend(input)}
              disabled={isTyping}
              aria-label={isTyping ? "Waiting for response" : "Send message"}
              className="flex size-7 shrink-0 items-center justify-center bg-[#ff3d00] text-primary-foreground hover:bg-[#ff3d00]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTyping
                ? <Loader2 className="size-3.5 animate-spin" strokeWidth={1.5} />
                : <SendHorizontal className="size-3.5" strokeWidth={1.5} />}
            </button>
          </div>
          <p className="mt-1.5 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/30">
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </aside>
    </>
  );
}
