import { useEffect, useRef, useState, useCallback } from "react";
import { StickyNote, Loader2 } from "lucide-react";
import DOMPurify from "dompurify";
import { renderAsync } from "docx-preview";
import { Document } from "../../types/document";
import { HighlightService } from "../../services/document/HighlightService";

/* ── Shared DOMPurify config for text mode ──────────────────────── */
const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    "p", "br", "b", "strong", "i", "em", "u", "s", "del", "ins",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "table", "thead", "tbody", "tr", "th", "td",
    "blockquote", "pre", "code",
    "span", "div", "hr", "a", "sub", "sup",
  ],
  ALLOWED_ATTR: ["class", "id", "href", "target", "style", "colspan", "rowspan"],
  ALLOW_DATA_ATTR: false,
};

function purify(html: string): string {
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}

interface Props {
  document: Document;
  currentPage: number;
  onPageChange: (page: number) => void;
  scale?: number;
  searchQuery?: string;
  searchResults?: any[];
  activeIndex?: number | null;
  /** When true, renders purified HTML content inline (text-mode) */
  textMode?: boolean;
  onTotalPagesDetected?: (pages: number) => void;
}

export function DOCXDocumentRenderer({
  document: doc,
  currentPage,
  onPageChange,
  scale = 1,
  searchQuery = "",
  searchResults = [],
  activeIndex = null,
  textMode = false,
  onTotalPagesDetected,
}: Props) {
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const lastPageRef = useRef(currentPage);
  const renderedBufferRef = useRef<ArrayBuffer | null>(null);

  const pagesText = doc.content?.textPages || doc.pagesContent || [];
  const totalPages = pagesText.length > 0 ? pagesText.length : 1;

  const [htmlContent, setHtmlContent] = useState<string>("");
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagesHtml, setPagesHtml] = useState<string[]>([]);
  const [renderError, setRenderError] = useState<boolean>(false);

  // 1. Fetch DOCX arrayBuffer and HTML using mammoth (for text mode)
  useEffect(() => {
    const loadDocx = async () => {
      try {
        const fileUrl = doc.viewerUrl || doc.url;
        if (!fileUrl) {
          setHtmlContent(pagesText.map(t => `<p>${t}</p>`).join(""));
          setLoading(false);
          return;
        }

        const response = await fetch(fileUrl);
        const buf = await response.arrayBuffer();
        setArrayBuffer(buf);

        // Convert to HTML for Text Mode backup / optimization
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer: buf.slice(0) });
        setHtmlContent(result.value || "");
      } catch (err) {
        console.error("Mammoth conversion/load failed, falling back to text pages:", err);
        setHtmlContent(pagesText.map(t => `<p>${t}</p>`).join(""));
        setRenderError(true);
      } finally {
        setLoading(false);
      }
    };
    loadDocx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.viewerUrl, doc.url]);

  // 2. Divide Mammoth HTML into pages (for textMode layout)
  useEffect(() => {
    if (!htmlContent) return;

    try {
      const tempDiv = window.document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      const childNodes = Array.from(tempDiv.childNodes);

      const pagesList: string[] = [];
      const nodesPerPage = Math.max(1, Math.ceil(childNodes.length / totalPages));

      for (let i = 0; i < totalPages; i++) {
        const pageContainer = window.document.createElement("div");
        const startIdx = i * nodesPerPage;
        const endIdx = Math.min(startIdx + nodesPerPage, childNodes.length);

        for (let j = startIdx; j < endIdx; j++) {
          pageContainer.appendChild(childNodes[j].cloneNode(true));
        }
        pagesList.push(pageContainer.innerHTML);
      }
      setPagesHtml(pagesList);
    } catch (e) {
      console.error("Failed to split mammoth HTML:", e);
      setPagesHtml(pagesText.map(t => `<p>${t}</p>`));
    }
  }, [htmlContent, totalPages]);

  // 3. Render docx-preview for Canvas Mode
  useEffect(() => {
    if (textMode) {
      renderedBufferRef.current = null;
      return;
    }
    
    // Wait until loading finishes, so that docxContainerRef is mounted and non-null!
    if (loading || !arrayBuffer || !docxContainerRef.current) return;

    // Prevent duplicate rendering calls on the same arrayBuffer reference
    if (renderedBufferRef.current === arrayBuffer) return;

    const render = async () => {
      try {
        const container = docxContainerRef.current;
        if (container) {
          container.innerHTML = ""; // Clear existing
          renderedBufferRef.current = arrayBuffer;
          await renderAsync(arrayBuffer, container, undefined, {
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
            className: "docx-preview-doc",
          });

          // Detect visual sections rendered by docx-preview
          const sections = container.querySelectorAll("section.docx");
          const count = sections.length || 1;
          if (onTotalPagesDetected) {
            onTotalPagesDetected(count);
          }
        }
      } catch (e) {
        console.error("docx-preview rendering failed:", e);
        setRenderError(true);
        renderedBufferRef.current = null;
      }
    };

    render();
  }, [arrayBuffer, textMode, loading, onTotalPagesDetected]);

  const [selectionRange, setSelectionRange] = useState<{ x: number; y: number; text: string; pageNum: number } | null>(null);

  const handleMouseUp = (pageNum: number) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setSelectionRange(null); return; }
    const text = sel.toString().trim();
    if (!text || text.length < 3) { setSelectionRange(null); return; }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionRange({ x: rect.left + rect.width / 2, y: rect.top - 40, text, pageNum });
  };

  // Selection detection for Canvas Mode
  const handleMouseUpCanvas = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setSelectionRange(null); return; }
    const text = sel.toString().trim();
    if (!text || text.length < 3) { setSelectionRange(null); return; }

    // Resolve page number from the containing section element rendered by docx-preview
    let pageNum = currentPage;
    let node: Node | null = sel.anchorNode;
    while (node && node !== window.document.body) {
      if (node instanceof HTMLElement && node.tagName === "SECTION" && node.classList.contains("docx")) {
        const container = docxContainerRef.current;
        if (container) {
          const sections = Array.from(container.querySelectorAll("section.docx"));
          const idx = sections.indexOf(node);
          if (idx !== -1) {
            pageNum = idx + 1;
          }
        }
        break;
      }
      node = node.parentNode;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionRange({ x: rect.left + rect.width / 2, y: rect.top - 40, text, pageNum });
  };

  const handleAddSelectionNote = () => {
    if (!selectionRange) return;
    window.dispatchEvent(new CustomEvent("evident-create-note", {
      detail: {
        title: `Selection from Page ${selectionRange.pageNum}`,
        content: "",
        sourceText: selectionRange.text,
        documentId: doc.mongoDbId || doc.id,
        pageNumber: selectionRange.pageNum,
      },
    }));
    window.getSelection()?.removeAllRanges();
    setSelectionRange(null);
  };

  // Scroll to active search match (Text mode)
  useEffect(() => {
    if (textMode && activeIndex !== null && searchResults && searchResults.length > 0) {
      const activeMatch = searchResults[activeIndex];
      if (activeMatch && activeMatch.page) {
        if (activeMatch.page !== lastPageRef.current) {
          lastPageRef.current = activeMatch.page;
          onPageChange(activeMatch.page);
        }
        setTimeout(() => {
          const matchEl = window.document.getElementById(`search-match-${activeMatch.matchIndex}`);
          if (matchEl) matchEl.scrollIntoView({ behavior: "smooth", block: "center" });
          else pageRefs.current[activeMatch.page]?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    }
  }, [activeIndex, searchResults, onPageChange, textMode]);

  // Sync toolbar page changes
  useEffect(() => {
    if (currentPage !== lastPageRef.current) {
      lastPageRef.current = currentPage;
      
      if (textMode) {
        const targetPage = pageRefs.current[currentPage];
        if (targetPage && scrollContainerRef.current) {
          isProgrammaticScrollRef.current = true;
          targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => { isProgrammaticScrollRef.current = false; }, 850);
        }
      } else {
        const container = docxContainerRef.current;
        if (container) {
          const sections = container.querySelectorAll("section.docx");
          const targetSection = sections[currentPage - 1];
          if (targetSection) {
            isProgrammaticScrollRef.current = true;
            targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
            setTimeout(() => { isProgrammaticScrollRef.current = false; }, 850);
          }
        }
      }
    }
  }, [currentPage, textMode]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2;

    let closestPage = 1;
    let minDistance = Infinity;

    if (textMode) {
      Object.entries(pageRefs.current).forEach(([pageNumStr, el]) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const pageCenter = rect.top + rect.height / 2;
        const distance = Math.abs(containerCenter - pageCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestPage = parseInt(pageNumStr, 10);
        }
      });
    } else {
      const containerEl = docxContainerRef.current;
      if (containerEl) {
        const sections = containerEl.querySelectorAll("section.docx");
        sections.forEach((sec, idx) => {
          const rect = sec.getBoundingClientRect();
          const pageCenter = rect.top + rect.height / 2;
          const distance = Math.abs(containerCenter - pageCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestPage = idx + 1;
          }
        });
      }
    }

    if (closestPage !== lastPageRef.current) {
      lastPageRef.current = closestPage;
      onPageChange(closestPage);
    }
  }, [onPageChange, textMode]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#1a1a1a] min-h-[600px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#ff3d00]" />
          <p className="text-[11px] text-neutral-400 font-mono">Loading DOCX content...</p>
        </div>
      </div>
    );
  }

  const finalPages = pagesHtml.length > 0 ? pagesHtml : pagesText.map(t => `<p>${t}</p>`);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-[#1a1a1a] px-4 py-8 md:px-10 md:py-12 flex flex-col items-center gap-8 scroll-smooth"
    >
      {textMode ? (
        /* ── TEXT MODE ── optimized for AI extraction and search highlights ── */
        <div
          key="text-mode-container"
          className="mx-auto w-full max-w-[700px] origin-top"
          style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
        >
          {finalPages.map((pHtml, idx) => {
            const pNum = idx + 1;
            const sanitized = purify(pHtml);
            const highlighted = HighlightService.highlightHtml(sanitized, pNum, searchResults, activeIndex);
            return (
              <div
                key={pNum}
                ref={el => { pageRefs.current[pNum] = el; }}
                onMouseUp={() => handleMouseUp(pNum)}
                className="relative mb-6 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.35)] rounded-sm"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 px-10 py-3">
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-neutral-400">
                    Page {pNum} of {totalPages}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#ff3d00]/70">
                    Evident AI · DOCX
                  </span>
                </div>

                <div
                  className="px-10 py-8 text-sm leading-relaxed text-neutral-900 select-text
                    [&_p]:mb-3 [&_p]:text-neutral-800
                    [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-neutral-900 [&_h1]:border-b [&_h1]:border-neutral-200 [&_h1]:pb-2
                    [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-neutral-900
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-neutral-800
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
                    [&_li]:mb-1 [&_li]:text-neutral-800
                    [&_strong]:font-semibold [&_strong]:text-neutral-900
                    [&_em]:italic
                    [&_blockquote]:border-l-4 [&_blockquote]:border-[#ff3d00]/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-neutral-600 [&_blockquote]:my-3
                    [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4 [&_table]:text-sm
                    [&_th]:bg-neutral-100 [&_th]:border [&_th]:border-neutral-300 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-left [&_th]:text-neutral-800
                    [&_td]:border [&_td]:border-neutral-200 [&_td]:px-3 [&_td]:py-2 [&_td]:text-neutral-700
                    [&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:text-neutral-700
                    [&_pre]:bg-neutral-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:text-xs [&_pre]:mb-3
                    [&_hr]:border-neutral-200 [&_hr]:my-4
                    [&_a]:text-[#ff3d00] [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: highlighted }}
                />

                <div className="border-t border-neutral-100 px-10 py-3">
                  <p className="font-mono text-[7px] uppercase tracking-[0.15em] text-neutral-300">
                    All insights are linked back to cited page segments
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── CANVAS MODE ── original document representation using docx-preview ── */
        <>
          <style>{`
            /* Overrides to make docx-preview styled exactly like white paper pages on dark backdrop */
            .docx-preview-container {
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .docx-preview-container .docx-wrapper {
              background: transparent !important;
              padding: 0 !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              gap: 24px !important;
              width: 100% !important;
            }
            .docx-preview-container section.docx {
              background: white !important;
              color: #111111 !important;
              box-shadow: 0 4px 32px rgba(0, 0, 0, 0.45) !important;
              border-radius: 0.125rem !important;
              margin-bottom: 8px !important;
              box-sizing: border-box !important;
              display: block !important;
              position: relative !important;
            }
            
            /* Ensure normal dark colors are preserved in text */
            .docx-preview-container section.docx p,
            .docx-preview-container section.docx span,
            .docx-preview-container section.docx h1,
            .docx-preview-container section.docx h2,
            .docx-preview-container section.docx h3,
            .docx-preview-container section.docx h4,
            .docx-preview-container section.docx td,
            .docx-preview-container section.docx th,
            .docx-preview-container section.docx li {
              color: #111111 !important;
              font-family: inherit;
            }
            
            /* Tables clean alignment overrides */
            .docx-preview-container section.docx table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            .docx-preview-container section.docx td,
            .docx-preview-container section.docx th {
              border: 1px solid #d1d5db !important;
              padding: 6px 10px !important;
            }
          `}</style>

          <div
            key="canvas-mode-container"
            ref={docxContainerRef}
            onMouseUp={handleMouseUpCanvas}
            className="docx-preview-container mx-auto origin-top select-text"
            style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
          />
        </>
      )}

      <div className="h-12" />

      <NotePopup selectionRange={selectionRange} onAdd={handleAddSelectionNote} />
    </div>
  );
}

/* ── Note popup ─────────────────────────────────────────────────── */
function NotePopup({
  selectionRange,
  onAdd,
}: {
  selectionRange: { x: number; y: number; text: string; pageNum: number } | null;
  onAdd: () => void;
}) {
  if (!selectionRange) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: `${selectionRange.x}px`,
        top: `${selectionRange.y}px`,
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
      className="animate-fade-in flex items-center gap-1.5 border border-neutral-700 bg-neutral-900 px-3 py-1.5 rounded shadow-xl text-[10px] text-[#ff3d00] hover:bg-[#ff3d00]/10 cursor-pointer font-mono uppercase tracking-wider font-semibold"
      onClick={onAdd}
    >
      <StickyNote className="size-3" />
      Add to Notes
    </div>
  );
}
