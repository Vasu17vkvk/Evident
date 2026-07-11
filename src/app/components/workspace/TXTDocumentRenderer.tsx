import { useEffect, useRef, useState, useCallback } from "react";
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
}

export function TXTDocumentRenderer({
  document: doc,
  currentPage,
  onPageChange,
  scale = 1,
  searchQuery = "",
  searchResults = [],
  activeIndex = null,
}: Props) {
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const lastPageRef = useRef(currentPage);

  const pages = doc.content?.textPages || doc.pagesContent || [];
  const totalPages = pages.length > 0 ? pages.length : 1;

  // Scroll to active match when activeIndex or searchResults changes
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
          if (matchEl) {
            matchEl.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            const pageEl = pageRefs.current[activeMatch.page];
            if (pageEl) {
              pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        }, 150);
      }
    }
  }, [activeIndex, searchResults, onPageChange]);

  // Synchronize external pagination page updates (toolbar clicks)
  useEffect(() => {
    if (currentPage !== lastPageRef.current) {
      lastPageRef.current = currentPage;
      const targetPage = pageRefs.current[currentPage];
      if (targetPage && scrollContainerRef.current) {
        isProgrammaticScrollRef.current = true;
        targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 850);
      }
    }
  }, [currentPage]);

  // Handle manual scrolling to update UI page indicator live
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
      const pageCenter = rect.top + rect.height / 2;
      const distance = Math.abs(containerCenter - pageCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestPage = parseInt(pageNumStr, 10);
      }
    });

    if (closestPage !== lastPageRef.current) {
      lastPageRef.current = closestPage;
      onPageChange(closestPage);
    }
  }, [onPageChange]);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-secondary px-4 py-8 md:px-10 md:py-12 flex flex-col items-center gap-8 scroll-smooth"
    >
      <div
        className="mx-auto w-full max-w-[680px] flex flex-col gap-8 transition-transform duration-200 ease-out origin-top"
        style={{ transform: `scale(${scale})` }}
      >
        {pages.map((pText, idx) => {
          const pNum = idx + 1;
          const segments = HighlightService.getHighlightedSegments(pText, pNum, searchResults, activeIndex);

          return (
            <div
              key={pNum}
              ref={(el) => {
                pageRefs.current[pNum] = el;
              }}
              className="border border-border bg-card p-4 sm:p-8 md:p-10 min-h-[500px] sm:min-h-[650px] shadow-lg relative flex flex-col justify-between"
            >
              <div className="absolute left-0 top-0 h-[2px] w-16 bg-[#ff3d00]" />

              <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                  Page {pNum} of {totalPages}
                </span>
                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#ff3d00]/70">
                  Evident AI Reader View (TXT)
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-start select-text">
                <p className="text-sm sm:text-base leading-relaxed text-foreground whitespace-pre-wrap select-text">
                  {segments.map((seg, sIdx) => {
                    if (seg.isMatch) {
                      return (
                        <mark
                          key={sIdx}
                          id={`search-match-${seg.matchIndex}`}
                          className={`font-medium border-b px-0.5 rounded-sm transition-all duration-150 ${
                            seg.isActive
                              ? "bg-[#ff9f00] text-[#0a0a0a] border-[#ff9f00]/80 scale-105"
                              : "bg-[#ff3d00]/30 text-[#ff3d00] border-[#ff3d00]/60"
                          }`}
                        >
                          {seg.text}
                        </mark>
                      );
                    }
                    return seg.text;
                  })}
                </p>
              </div>

              <div className="border-t border-border/40 pt-4 mt-8">
                <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted-foreground/45">
                  All insights are linked back to cited page segments
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-12" />
    </div>
  );
}
