import { useState, useRef, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  AlignLeft,
  FileText,
  Upload,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Printer,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useDocument } from "../../context/DocumentContext";
import { PDFViewer } from "./PDFViewer";
import { DocumentStatus } from "../../types/document";
import { ProcessingPipeline } from "./ProcessingPipeline";

function HighlightText({ text, search }: { text: string; search: string }) {
  if (!search || !search.trim()) return <p className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap select-text">{text}</p>;
  const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <p className="text-[12px] leading-relaxed text-foreground whitespace-pre-wrap select-text">
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-[#ff3d00]/30 text-[#ff3d00] font-medium border-b border-[#ff3d00]/60 px-0.5 rounded-sm">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </p>
  );
}

const DEFAULT_PAGES_TEXT = [
  "Evident AI Document Copilot - Platform Overview and Ingestion Pipeline\nThis document details the architecture and workflows of Evident AI's semantic document interrogation system. The platform allows users to upload documents (PDF, DOCX, TXT) and ask natural language queries, retrieving answers grounded in cited text passages to eliminate hallucinations.",
  "Section 1: The Retrieval-Augmented Generation (RAG) Architecture\nRather than passing entire documents directly into context windows, Evident AI operates on RAG principles. Text content is extracted, segmented into recursive semantic blocks, and indexed as high-dimensional vector embeddings. When a query is made, the vector index surfaces only the top-K relevant chunks, which are injected into the LLM prompt.",
  "Section 2: Interactive Interrogation and Verification\nEvery answer generated includes inline bracket citations (e.g., [p.1, p.3]). These citations correspond to the source chunks in the database. Users can click any citation to instantly highlight the originating text segment in the side-by-side document viewer, establishing auditability.",
  "Section 3: Financial Scaling and Projections\nEvident AI has demonstrated 34% quarter-over-quarter growth in Q4 2024. Enterprise accounts have surpassed 12,000 active instances. Standard indexing latency remains under 8 seconds per file, with average query responses completing in less than 2 seconds.",
  "Section 4: Privacy, Sandboxing, and Security Compliance\nUser documents are processed strictly in-memory during active sessions. No document data or parsed text blocks are retained in persistent storage after the session is closed. Transport security uses TLS 1.3, and vector nodes are protected with AES-256 server-side encryption keys."
];

interface Props {
  documentName?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  currentView: "pdf" | "text";
  onViewChange: (view: "pdf" | "text") => void;
  searchQuery: string;
  onInsightsToggle?: () => void;
}

export function DocumentViewer({
  documentName = "Document",
  currentPage,
  onPageChange,
  currentView,
  onViewChange,
  searchQuery,
  onInsightsToggle,
}: Props) {
  const navigate = useNavigate();
  const { document, hasDocument } = useDocument();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRotate = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  const handleRefresh = useCallback(() => {
    onPageChange(1);
    setScale(1);
    setRotation(0);
  }, [onPageChange]);

  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);

  const handleToolbarPageChange = useCallback((pageNum: number) => {
    isProgrammaticScrollRef.current = true;
    onPageChange(pageNum);
    const targetPage = pageRefs.current[pageNum];
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 850);
    }
  }, [onPageChange]);

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

    if (closestPage !== currentPage) {
      onPageChange(closestPage);
    }
  }, [currentPage, onPageChange]);

  const handleDownload = useCallback(() => {
    if (document && document.url) {
      const link = window.document.createElement("a");
      link.href = document.url;
      link.download = document.name;
      link.click();
    }
  }, [document]);

  const handlePrint = useCallback(() => {
    if (document && document.url) {
      const iframe = window.document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = document.url;
      window.document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
      };
    }
  }, [document]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!window.document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      window.document.exitFullscreen();
    }
  }, []);

  return (
    <div ref={containerRef} className="flex h-full flex-1 min-w-0 flex-col overflow-hidden bg-background">
      {hasDocument && document ? (
        document.status !== DocumentStatus.READY ? (
          <ProcessingPipeline
            status={document.status}
            fileName={document.name}
            fileSize={document.size}
          />
        ) : (
          <>
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-2 sm:px-4">
            {/* Left: View selector + Document Name */}
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              {document.extension === "pdf" && (
                <div className="flex border border-border bg-card p-0.5 rounded-sm mr-1 sm:mr-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onViewChange("pdf")}
                    className={`px-1.5 sm:px-2 py-0.5 font-mono text-[7px] sm:text-[8px] uppercase tracking-wider rounded-sm transition-colors ${currentView === 'pdf' ? 'bg-[#ff3d00] text-[#0a0a0a] font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewChange("text")}
                    className={`px-1.5 sm:px-2 py-0.5 font-mono text-[7px] sm:text-[8px] uppercase tracking-wider rounded-sm transition-colors ${currentView === 'text' ? 'bg-[#ff3d00] text-[#0a0a0a] font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Text
                  </button>
                </div>
              )}
              <AlignLeft className="hidden sm:block size-3 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 truncate max-w-[80px] sm:max-w-[150px] md:max-w-none">
                {documentName}
              </span>
            </div>

            {/* Center: Pagination */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleToolbarPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="flex size-7 sm:size-8 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 transition-colors"
              >
                <ChevronLeft className="size-3.5" strokeWidth={2} />
              </button>

              {/* Page pill */}
              <div className="flex items-center gap-1 rounded-sm border border-border bg-secondary px-2.5 py-1 min-w-[52px] justify-center">
                <span className="font-mono text-[10px] font-semibold tabular-nums text-foreground">
                  {currentPage}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/60">/</span>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {document?.pages || 5}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToolbarPageChange(Math.min(document?.pages || 5, currentPage + 1))}
                disabled={currentPage >= (document?.pages || 5)}
                className="flex size-7 sm:size-8 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 transition-colors"
              >
                <ChevronRight className="size-3.5" strokeWidth={2} />
              </button>
            </div>

            {/* Zoom + actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="size-3.5" strokeWidth={1.5} />
              </button>
              <span className="hidden sm:block font-mono w-10 text-center text-[10px] text-muted-foreground">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale(s => Math.min(2, s + 0.1))}
                className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="size-3.5" strokeWidth={1.5} />
              </button>

              <div className="mx-1 sm:mx-2 h-4 w-px bg-border" />

              {/* Refresh/Reset Button */}
              {document.extension === "pdf" && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="Refresh/Reset View"
                >
                  <RefreshCw className="size-3.5" strokeWidth={1.5} />
                </button>
              )}

              {/* Rotate Button */}
              {document.extension === "pdf" && (
                <button
                  type="button"
                  onClick={handleRotate}
                  className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="Rotate PDF 90°"
                >
                  <RotateCw className="size-3.5" strokeWidth={1.5} />
                </button>
              )}

              {/* Print Button — hide on mobile to save space */}
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:flex size-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Print Document"
              >
                <Printer className="size-3.5" strokeWidth={1.5} />
              </button>

              <button 
                type="button"
                onClick={handleDownload}
                className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Download file"
              >
                <Download className="size-3.5" strokeWidth={1.5} />
              </button>

              {/* Insights — hide on mobile (available via tab bar) */}
              <button
                type="button"
                onClick={onInsightsToggle}
                className="hidden sm:flex size-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Insights Panel"
              >
                <BarChart3 className="size-3.5" strokeWidth={1.5} />
              </button>

              <button 
                type="button"
                onClick={toggleFullscreen}
                className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Fullscreen Toggle"
              >
                <Maximize2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Render appropriate viewer based on view choice and file type */}
          {(currentView === "text" || document.extension !== "pdf") ? (
            /* Text Reader View */
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto bg-secondary px-4 py-8 md:px-10 md:py-12 flex flex-col items-center scroll-smooth"
            >
              <div className="mx-auto w-full max-w-[680px] flex flex-col gap-8">
                {Array.from({ length: document?.pages || 5 }).map((_, idx) => {
                  const pNum = idx + 1;
                  const pText = document?.pagesContent?.[idx] || DEFAULT_PAGES_TEXT[idx % DEFAULT_PAGES_TEXT.length];
                  
                  return (
                    <div 
                      key={pNum}
                      ref={(el) => { pageRefs.current[pNum] = el; }}
                      className="border border-border bg-card p-4 sm:p-8 md:p-10 min-h-[500px] sm:min-h-[650px] shadow-lg relative flex flex-col justify-between"
                    >
                      {/* Accent bar */}
                      <div className="absolute left-0 top-0 h-[2px] w-16 bg-[#ff3d00]" />
                      
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
                        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                          Page {pNum} of {document?.pages || 5}
                        </span>
                        <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#ff3d00]/70">
                          Evident AI Reader View
                        </span>
                      </div>

                      {/* Content body */}
                      <div className="flex-1 flex flex-col justify-start select-text">
                        <HighlightText 
                          text={pText} 
                          search={searchQuery} 
                        />
                      </div>

                      {/* Footer */}
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
          ) : (
            <PDFViewer
              url={document.url || ""}
              currentPage={currentPage}
              onPageChange={onPageChange}
              scale={scale}
              rotation={rotation}
              searchQuery={searchQuery}
            />
          )}
        </>
      ) ) : (
        <div className="flex flex-1 flex-col items-center justify-center bg-secondary px-4 sm:px-6 text-center">
          <div className="relative mb-6 sm:mb-8">
            <div className="absolute inset-0 -z-10 bg-[#ff3d00]/[0.04] blur-2xl" />
            <div className="flex size-16 sm:size-20 items-center justify-center border border-border bg-card">
              <FileText className="size-6 sm:size-8 text-muted-foreground" strokeWidth={1.25} />
            </div>
          </div>
          <h3 className="mb-2 text-base sm:text-lg font-semibold tracking-tight text-foreground">
            No document loaded
          </h3>
          <p className="mb-6 sm:mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Upload a PDF, DOCX, or TXT file to start chatting with your document.
            Every answer will be grounded in cited passages.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 border border-[#ff3d00]/40 bg-[#ff3d00]/10 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff3d00] transition-all duration-150 hover:border-[#ff3d00] hover:bg-[#ff3d00]/20"
          >
            <Upload className="size-3.5 transition-transform group-hover:-translate-y-0.5" strokeWidth={1.5} />
            Upload Document
          </button>
          <p className="mt-4 sm:mt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">
            Drag &amp; drop or click to browse
          </p>
        </div>
      )}
    </div>
  );
}
