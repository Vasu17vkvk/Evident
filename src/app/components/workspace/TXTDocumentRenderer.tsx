import { useEffect, useRef, useState, useCallback } from "react";
import { StickyNote, Loader2 } from "lucide-react";
import { Document } from "../../types/document";
import { HighlightService } from "../../services/document/HighlightService";

interface Props {
  document: Document;
  currentPage: number;
  onPageChange: (page: number) => void;
  scale?: number;
  searchQuery?: string;
  searchResults?: any[];
  activeIndex?: number | null;
  /**
   * forcePlain = true  → text-mode (triggered by "Text" toggle in toolbar)
   *                       uses <pre> to preserve whitespace, white-paper layout
   * forcePlain = false → canvas-mode (default view for TXT files)
   *                       also uses white-paper layout with word-wrapped prose
   */
  forcePlain?: boolean;
}

export function TXTDocumentRenderer({
  document: doc,
  currentPage,
  onPageChange,
  scale = 1,
  searchQuery = "",
  searchResults = [],
  activeIndex = null,
  forcePlain = false,
}: Props) {
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const lastPageRef = useRef(currentPage);

  const pages = doc.content?.textPages || doc.pagesContent || [];
  const totalPages = pages.length > 0 ? pages.length : 1;

  const [selectionRange, setSelectionRange] = useState<{
    x: number; y: number; text: string; pageNum: number;
  } | null>(null);

  const handleMouseUp = (pageNum: number) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setSelectionRange(null); return; }
    const text = sel.toString().trim();
    if (!text || text.length < 3) { setSelectionRange(null); return; }
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

  // Scroll to active match
  useEffect(() => {
    if (activeIndex !== null && searchResults && searchResults.length > 0) {
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
  }, [activeIndex, searchResults, onPageChange]);

  // Sync toolbar page changes
  useEffect(() => {
    if (currentPage !== lastPageRef.current) {
      lastPageRef.current = currentPage;
      const targetPage = pageRefs.current[currentPage];
      if (targetPage && scrollContainerRef.current) {
        isProgrammaticScrollRef.current = true;
        targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => { isProgrammaticScrollRef.current = false; }, 850);
      }
    }
  }, [currentPage]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2;
    let closestPage = 1;
    let minDistance = Infinity;
    Object.entries(pageRefs.current).forEach(([pageNumStr, el]) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const distance = Math.abs(containerCenter - (rect.top + rect.height / 2));
      if (distance < minDistance) { minDistance = distance; closestPage = parseInt(pageNumStr, 10); }
    });
    if (closestPage !== lastPageRef.current) { lastPageRef.current = closestPage; onPageChange(closestPage); }
  }, [onPageChange]);

  /* ── Shared page shell (white paper) ──────────────────────────── */
  const renderPage = (pText: string, pNum: number, preMode: boolean) => {
    const segments = HighlightService.getHighlightedSegments(pText, pNum, searchResults, activeIndex);

    return (
      <div
        key={pNum}
        ref={el => { pageRefs.current[pNum] = el; }}
        onMouseUp={() => handleMouseUp(pNum)}
        className="relative bg-white shadow-[0_4px_32px_rgba(0,0,0,0.45)] rounded-sm mb-6 select-text"
      >
        {/* Page header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-10 py-3">
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-neutral-400">
            Page {pNum} of {totalPages}
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#ff3d00]/60">
            Evident AI · TXT
          </span>
        </div>

        {/* Content */}
        <div className="px-10 py-8 min-h-[500px]">
          {preMode ? (
            /* TEXT MODE — <pre> preserves all whitespace/newlines exactly */
            <pre className="font-mono text-[12px] leading-[1.65] text-neutral-900 whitespace-pre-wrap break-words m-0">
              {segments.map((seg, sIdx) => {
                if (seg.isMatch) {
                  return (
                    <mark
                      key={sIdx}
                      id={`search-match-${seg.matchIndex}`}
                      className={`font-medium border-b px-0.5 rounded-sm transition-all duration-150 ${
                        seg.isActive
                          ? "bg-[#ff9f00] text-[#0a0a0a] border-[#ff9f00]/80"
                          : "bg-[#ff3d00]/20 text-[#c02000] border-[#ff3d00]/40"
                      }`}
                    >
                      {seg.text}
                    </mark>
                  );
                }
                return seg.text;
              })}
            </pre>
          ) : (
            /* CANVAS MODE — prose paragraph rendering */
            <p className="text-[13px] leading-relaxed text-neutral-800 whitespace-pre-wrap break-words">
              {segments.map((seg, sIdx) => {
                if (seg.isMatch) {
                  return (
                    <mark
                      key={sIdx}
                      id={`search-match-${seg.matchIndex}`}
                      className={`font-medium border-b px-0.5 rounded-sm transition-all duration-150 ${
                        seg.isActive
                          ? "bg-[#ff9f00] text-[#0a0a0a] border-[#ff9f00]/80"
                          : "bg-[#ff3d00]/20 text-[#c02000] border-[#ff3d00]/40"
                      }`}
                    >
                      {seg.text}
                    </mark>
                  );
                }
                return seg.text;
              })}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 px-10 py-3">
          <p className="font-mono text-[7px] uppercase tracking-[0.15em] text-neutral-300">
            All insights are linked back to cited page segments
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-[#1a1a1a] px-4 py-8 md:px-10 md:py-12 flex flex-col items-center gap-0 scroll-smooth"
    >
      <div
        className="mx-auto w-full max-w-[700px] origin-top"
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      >
        {pages.map((pText, idx) => renderPage(pText, idx + 1, forcePlain))}
      </div>
      <div className="h-12" />

      {/* Note-creation popup */}
      {selectionRange && (
        <div
          style={{
            position: "fixed",
            left: `${selectionRange.x}px`,
            top: `${selectionRange.y}px`,
            transform: "translateX(-50%)",
            zIndex: 9999,
          }}
          className="animate-fade-in flex items-center gap-1.5 border border-neutral-700 bg-neutral-900 px-3 py-1.5 rounded shadow-xl text-[10px] text-[#ff3d00] hover:bg-[#ff3d00]/10 cursor-pointer font-mono uppercase tracking-wider font-semibold"
          onClick={handleAddSelectionNote}
        >
          <StickyNote className="size-3" />
          Add to Notes
        </div>
      )}
    </div>
  );
}
