import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Loader2 } from "lucide-react";
import { useDocument } from "../../hooks/useDocument";

// Configure pdfjs worker path to use local bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Props {
  /** URL of the PDF file (should be an object URL) */
  url: string;
  /** Current page number (1-based) */
  currentPage: number;
  /** Called when page changes */
  onPageChange: (page: number) => void;
  /** Zoom level (e.g., 1, 1.2, 1.5) */
  scale?: number;
  /** Rotation angle (0, 90, 180, 270) */
  rotation?: number;
  /** Active search query from workspace header */
  searchQuery?: string;
  searchResults?: any[];
  activeIndex?: number | null;
}

export function PDFViewer({
  url,
  currentPage,
  onPageChange,
  scale = 1,
  rotation = 0,
  searchQuery = "",
  searchResults = [],
  activeIndex = null,
}: Props) {
  const [pdf, setPdf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { document: docObj } = useDocument();

  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const lastPageRef = useRef(currentPage);

  // Load PDF document on mount or source URL changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPdf(null);

    const loadingTask = pdfjsLib.getDocument(url);
    loadingTask.promise
      .then((pdfInstance) => {
        setPdf(pdfInstance);
        setLoading(false);
      })
      .catch((err) => {
        console.error("PDF load error:", err);
        setError("Failed to initialize canvas rendering engine. Please switch to the 'Text Reader' view above to view document text.");
        setLoading(false);
      });
  }, [url]);

  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const updateDimensions = useCallback(() => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.clientWidth - 48; // p-6 is 24px padding on each side
      setContainerWidth(width > 0 ? width : window.innerWidth - 48);
    } else {
      setContainerWidth(window.innerWidth - 48);
    }
  }, []);

  // Fetch page width of the first page to compute scale
  useEffect(() => {
    if (pdf) {
      pdf.getPage(1).then((page: any) => {
        const viewport = page.getViewport({ scale: 1 });
        setPageWidth(viewport.width);
      }).catch((e: any) => {
        console.error("Error getting page width:", e);
      });
    }
  }, [pdf]);

  // Event listener for window resize and orientation changes
  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    window.addEventListener("orientationchange", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("orientationchange", updateDimensions);
    };
  }, [updateDimensions, pdf]);

  // Re-run dimension updates when pageWidth changes
  useEffect(() => {
    const timer = setTimeout(updateDimensions, 100);
    return () => clearTimeout(timer);
  }, [pageWidth, updateDimensions]);

  const isMobile = window.innerWidth < 768;
  const mobileFitScale = (isMobile && pageWidth && containerWidth)
    ? (containerWidth / pageWidth)
    : 1;

  const actualScale = scale * mobileFitScale;

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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-secondary min-h-[600px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#ff3d00]" />
          <p className="text-[11px] text-muted-foreground">Loading PDF pages…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center bg-secondary p-8 text-center min-h-[600px]">
        <p className="text-[11px] text-muted-foreground max-w-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-secondary p-6 flex flex-col items-center gap-8 scroll-smooth"
    >
      {Array.from({ length: pdf ? pdf.numPages : 0 }).map((_, idx) => {
        const pNum = idx + 1;
        return (
          <div
            key={pNum}
            ref={(el) => { pageRefs.current[pNum] = el; }}
            className="flex justify-center"
          >
            <PDFPage
              pdf={pdf}
              pageNumber={pNum}
              scale={actualScale}
              rotation={rotation}
              searchQuery={searchQuery}
              searchResults={searchResults}
              activeIndex={activeIndex}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ── Individual Canvas Page Renderer ───────────────────── */
function PDFPage({
  pdf,
  pageNumber,
  scale,
  rotation,
  searchQuery,
  searchResults = [],
  activeIndex = null,
}: {
  pdf: any;
  pageNumber: number;
  scale: number;
  rotation: number;
  searchQuery: string;
  searchResults?: any[];
  activeIndex?: number | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  
  // Highlight layout coordinates states
  const [highlights, setHighlights] = useState<Array<{ x: number; y: number; w: number; h: number; matchIndex: number; isActive: boolean }>>([]);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!pdf) return;

    pdf.getPage(pageNumber).then((page: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const viewport = page.getViewport({ scale, rotation });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setViewportSize({ width: viewport.width, height: viewport.height });

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      renderTask.promise
        .then(() => {
          renderTaskRef.current = null;

          // Render query highlight box overlays
          if (searchQuery && searchQuery.trim().length > 1) {
            page.getTextContent().then((textContent: any) => {
              const query = searchQuery.toLowerCase();
              const newHighlights: typeof highlights = [];

              // Filter matches for this specific page
              const pageMatches = (searchResults || []).filter((r) => r.page === pageNumber);
              let pageMatchCounter = 0;

              for (const item of textContent.items) {
                const str = item.str.toLowerCase();
                if (str.includes(query)) {
                  const matchInfo = pageMatches[pageMatchCounter];

                  // Transform contains coordinate matrix: transform[4]=x, transform[5]=y
                  const tx = item.transform;
                  const x = tx[4];
                  const y = tx[5];

                  // Convert PDF coordinate origin (bottom-left) to viewport layout (top-left)
                  const [vx, vy] = viewport.convertToViewportPoint(x, y);

                  // Extract font height dimension from the matrix scale
                  const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
                  const vWidth = item.width * scale;
                  const vHeight = fontHeight * scale;

                  newHighlights.push({
                    x: vx,
                    y: vy - vHeight, // offset back since converted base maps text baseline
                    w: vWidth,
                    h: vHeight,
                    matchIndex: matchInfo ? matchInfo.matchIndex : -1,
                    isActive: matchInfo ? matchInfo.matchIndex === activeIndex : false,
                  });

                  if (matchInfo) {
                    pageMatchCounter++;
                  }
                }
              }
              setHighlights(newHighlights);
            });
          } else {
            setHighlights([]);
          }
        })
        .catch((err: any) => {
          if (err.name !== "RenderingCancelledException") {
            console.error("Page render error:", err);
          }
        });
    });

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageNumber, scale, rotation, searchQuery, searchResults, activeIndex]);

  return (
    <div 
      className="relative"
      style={{ width: viewportSize.width || "auto", height: viewportSize.height || "auto" }}
    >
      <canvas
        ref={canvasRef}
        className="shadow-lg max-w-full bg-[#fafafa]"
      />
      {/* Absolute search highlight divs */}
      {highlights.map((h, i) => (
        <div
          key={i}
          id={h.matchIndex !== -1 ? `search-match-${h.matchIndex}` : undefined}
          className={`absolute pointer-events-none rounded-sm border transition-all duration-150 ${
            h.isActive
              ? "bg-[#ff9f00]/65 border-[#ff9f00]/90 shadow-md scale-105 z-10"
              : "bg-[#ff3d00]/30 border-[#ff3d00]/50"
          }`}
          style={{
            left: `${h.x}px`,
            top: `${h.y}px`,
            width: `${h.w}px`,
            height: `${h.h}px`,
          }}
        />
      ))}
    </div>
  );
}
