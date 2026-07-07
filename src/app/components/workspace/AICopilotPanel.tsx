import { useState, useCallback } from "react";
import {
  Sparkles,
  SendHorizontal,
  ChevronRight,
  X,
  Copy,
  Loader2,
} from "lucide-react";
import { useDocument } from "../../context/DocumentContext";

const SUGGESTED_PROMPTS = [
  "Summarise the document's main point",
  "What are the core conclusions?",
  "Find all key figures and mentions",
  "Give me an overview of page 1",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{ page: number; excerpt: string }>;
}

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  showMessages?: boolean;
  onCitationClick: (page: number) => void;
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

  const handleSend = useCallback((textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Dynamic browser-based RAG search engine
    setTimeout(() => {
      let content = "";
      let citations: Message["citations"] = [];
      const queryLower = trimmed.toLowerCase();

      if (document && document.pagesContent && document.pagesContent.length > 0) {
        // Tokenize query terms
        const queryTerms = queryLower.split(/\s+/).filter(w => w.length > 3);
        let bestPageIdx = 0;
        let maxMatches = -1;

        // Perform tf-idf-like frequency analysis across pages
        for (let p = 0; p < document.pagesContent.length; p++) {
          const pageText = document.pagesContent[p].toLowerCase();
          let matches = 0;
          if (queryTerms.length > 0) {
            for (const term of queryTerms) {
              if (pageText.includes(term)) matches++;
            }
          } else {
            if (pageText.includes(queryLower)) matches += 5;
          }
          if (matches > maxMatches) {
            maxMatches = matches;
            bestPageIdx = p;
          }
        }

        // Isolate the best paragraph on the chosen page
        const bestPageText = document.pagesContent[bestPageIdx];
        const paragraphs = bestPageText.split(/(?:\n\s*){2,}/).flatMap(p => p.split("\n")).filter(p => p.trim().length > 15);
        let bestParagraph = paragraphs[0] || bestPageText;

        if (queryTerms.length > 0) {
          let maxParaMatches = -1;
          for (const para of paragraphs) {
            let paraMatches = 0;
            const paraLower = para.toLowerCase();
            for (const term of queryTerms) {
              if (paraLower.includes(term)) paraMatches++;
            }
            if (paraMatches > maxParaMatches) {
              maxParaMatches = paraMatches;
              bestParagraph = para;
            }
          }
        }

        const pageNum = bestPageIdx + 1;
        const cleanPara = bestParagraph.replace(/\[\d+\]/g, "").trim();

        // Formulate response dynamically
        if (queryLower.includes("summary") || queryLower.includes("summarise") || queryLower.includes("overview")) {
          content = `Here is a summary based on the contents of page ${pageNum}:\n\n"${cleanPara}"`;
        } else if (queryLower.includes("who") || queryLower.includes("author") || queryLower.includes("person") || queryLower.includes("people")) {
          content = `According to page ${pageNum}, the document notes:\n\n"${cleanPara}"`;
        } else if (queryLower.includes("conclusion") || queryLower.includes("conclude") || queryLower.includes("finally")) {
          content = `Based on the text on page ${pageNum}, the core findings note:\n\n"${cleanPara}"`;
        } else {
          content = `Based on page ${pageNum} of the document, the text notes:\n\n"${cleanPara}"`;
        }

        citations = [
          { page: pageNum, excerpt: cleanPara.substring(0, 70) + "..." }
        ];
      } else {
        content = "No document is currently active in the workspace session. Please upload a file to analyze its content.";
      }

      const aiMsg: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content,
        citations,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  }, [document]);

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

              {/* Suggested prompts */}
              <div className="flex w-full flex-col gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
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
                    {msg.role === "assistant" && (
                      <button 
                        type="button"
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                      >
                        <Copy className="size-3" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap select-text">
                    {msg.content}
                  </p>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">
                        Sources
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {msg.citations.map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onCitationClick(c.page)}
                            className="flex items-center gap-2 border border-border bg-secondary px-3 py-2 text-left hover:border-[#ff3d00]/30 transition-colors"
                          >
                            <span className="font-mono text-[9px] text-[#ff3d00] shrink-0">
                              p.{c.page}
                            </span>
                            <span className="flex-1 truncate font-mono text-[9px] text-muted-foreground">
                              {c.excerpt}
                            </span>
                            <ChevronRight
                              className="size-2.5 shrink-0 text-muted-foreground/30"
                              strokeWidth={1.5}
                            />
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
            </div>
          )}
        </div>

        {/* ── Input area ───────────────────────────── */}
        <div className="shrink-0 border-t border-border p-4">
          <div className="flex items-end gap-3 border border-border bg-secondary px-4 py-3 focus-within:border-[#ff3d00]/40 transition-colors">
            <textarea
              rows={2}
              placeholder="Ask a question about this document…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              className="flex-1 resize-none bg-transparent text-[12px] leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
            <button 
              type="button"
              onClick={() => handleSend(input)}
              className="flex size-7 shrink-0 items-center justify-center bg-[#ff3d00] text-primary-foreground hover:bg-[#ff3d00]/80 transition-colors"
            >
              <SendHorizontal className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>
          <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/30">
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </aside>
    </>
  );
}
