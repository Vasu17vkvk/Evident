import { useState, useRef, useCallback, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useDocument } from "../../hooks/useDocument";
import { DocumentRenderer } from "./DocumentRenderer";
import { DocumentStatus } from "../../types/document";
import { ProcessingPipeline } from "./ProcessingPipeline";
import { ProcessingErrorDisplay } from "./ProcessingErrorDisplay";
import { ExportService } from "../../services/export/ExportService";
import { downloadBlob } from "../../utils/download";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";

interface Props {
  documentName?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  currentView: "pdf" | "text";
  onViewChange: (view: "pdf" | "text") => void;
  searchQuery: string;
  onInsightsToggle?: () => void;
  searchResults?: any[];
  activeIndex?: number | null;
}

export function DocumentViewer({
  documentName = "Document",
  currentPage,
  onPageChange,
  currentView,
  onViewChange,
  searchQuery,
  onInsightsToggle,
  searchResults = [],
  activeIndex = null,
}: Props) {
  const navigate = useNavigate();
  const { document, hasDocument, retryProcessing } = useDocument();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const shouldShowProcessing =
    hasDocument && document
      ? document.status !== DocumentStatus.Ready && !document.content?.fullText && !document.pagesContent?.length
      : false;

  // Emergency fallback: allow user to enter workspace even if processing takes too long.
  // If document.status !== Ready for more than 10 seconds, disable AI/Insights/Search but keep PDF viewer + navigation.
  const [processingFallback, setProcessingFallback] = useState(false);
  const processingTimeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inside DocumentViewer log requirements
  console.log("[EVIDENT] Inside DocumentViewer:", {
    hasDocument,
    status: document?.status,
    content: document?.content,
    metadata: document?.metadata,
  });

  // Log reasons for blocking workspace rendering
  const isBlockedFromRendering = !hasDocument || !document || document.status === DocumentStatus.Error || (shouldShowProcessing && !processingFallback);
  if (isBlockedFromRendering) {
    const reasons: string[] = [];
    if (!hasDocument) reasons.push("hasDocument is false");
    if (!document) reasons.push("document object is null/undefined");
    if (document && document.status === DocumentStatus.Error) reasons.push("document status is Error");
    if (document && shouldShowProcessing && !processingFallback) {
      reasons.push(`shouldShowProcessing is true (status is ${document.status}, content.fullText is ${!!document.content?.fullText ? "present" : "missing"}, pagesContent is ${document.pagesContent?.length || 0})`);
    }
    console.log("[EVIDENT] Workspace rendering is blocked. Reasons:", reasons.join(", "));
  } else {
    console.log("[EVIDENT] Workspace rendering is not blocked.");
  }

  useEffect(() => {
    if (!hasDocument || !document) {
      setProcessingFallback(false);
      if (processingTimeoutTimerRef.current) {
        clearTimeout(processingTimeoutTimerRef.current);
        processingTimeoutTimerRef.current = null;
      }
      return;
    }

    if (document.status === DocumentStatus.Ready) {
      setProcessingFallback(false);
      if (processingTimeoutTimerRef.current) {
        clearTimeout(processingTimeoutTimerRef.current);
        processingTimeoutTimerRef.current = null;
      }
      return;
    }

    // Start a timer only when we are not Ready.
    if (!processingTimeoutTimerRef.current) {
      processingTimeoutTimerRef.current = setTimeout(() => {
        setProcessingFallback(true);
      }, 10_000);
    }

    return () => {
      if (processingTimeoutTimerRef.current) {
        clearTimeout(processingTimeoutTimerRef.current);
        processingTimeoutTimerRef.current = null;
      }
    };
  }, [hasDocument, document?.id, document?.status]);

  const aiAndInsightsDisabled = processingFallback;


  const handleRotate = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  const handleRefresh = useCallback(() => {
    onPageChange(1);
    setScale(1);
    setRotation(0);
  }, [onPageChange]);

  const handleToolbarPageChange = useCallback((pageNum: number) => {
    onPageChange(pageNum);
  }, [onPageChange]);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (format: string) => {
    if (!document || isExporting) return;

    setIsExporting(true);
    toast.loading(`Generating ${format.toUpperCase()} export...`, { id: "export-toast" });

    try {
      // Simulate short delay to display loading state
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result = await ExportService.export(document, format, {
        includeContent: true,
        includeMetadata: true,
        includeInsights: true,
        includeStatistics: true,
      });

      // Browser automatic download
      downloadBlob(result.content as Blob, result.fileName);

      toast.success(`${format.toUpperCase()} export downloaded successfully!`, { id: "export-toast" });
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Failed to generate ${format.toUpperCase()} export.`, { id: "export-toast" });
    } finally {
      setIsExporting(false);
    }
  }, [document, isExporting]);

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

  const handleErrorRetry = useCallback(async () => {
    // Call the retryProcessing function from context
    await retryProcessing();
  }, [retryProcessing]);

  const handleViewLogs = useCallback(() => {
    if (!document?.processingError) return;
    const logData = {
      document: {
        id: document.id,
        name: document.name,
        status: document.status,
      },
      error: document.processingError,
      processing: document.processing,
    };
    console.log("Processing Error Logs:", logData);
    // In production, you might send this to a logging service
    alert("Error details logged to console. Press F12 to view.");
  }, [document]);

  const handleOpenAnyway = useCallback(() => {
    // Document will still render if it has partial content
    // This is handled by the shouldShowProcessing logic
  }, []);

  return (
    <div ref={containerRef} className="flex h-full flex-1 min-w-0 flex-col overflow-hidden bg-background">
      {hasDocument && document ? (
        document.status === DocumentStatus.Error ? (
          <ProcessingErrorDisplay
            document={document}
            onRetry={handleErrorRetry}
            onOpenAnyway={handleOpenAnyway}
            onViewLogs={handleViewLogs}
          />
        ) : shouldShowProcessing && !processingFallback ? (
          <ProcessingPipeline
            status={document.status}
            fileName={document.name}
            fileSize={document.size}
          />
        ) : (
          <>
            {processingFallback && (
              <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#ff3d00]">
                    Document processing incomplete.
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    Some features may be unavailable.
                  </span>
                </div>
              </div>
            )}
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-2 sm:px-4">
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                {document.extension === "pdf" && (
                  <div className="flex border border-border bg-card p-0.5 rounded-sm mr-1 sm:mr-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewChange("pdf")}
                      className={`px-1.5 sm:px-2 py-0.5 font-mono text-[7px] sm:text-[8px] uppercase tracking-wider rounded-sm transition-colors ${currentView === "pdf" ? "bg-[#ff3d00] text-[#0a0a0a] font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewChange("text")}
                      className={`px-1.5 sm:px-2 py-0.5 font-mono text-[7px] sm:text-[8px] uppercase tracking-wider rounded-sm transition-colors ${currentView === "text" ? "bg-[#ff3d00] text-[#0a0a0a] font-semibold" : "text-muted-foreground hover:text-foreground"}`}
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

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToolbarPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="flex size-7 sm:size-8 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 transition-colors"
                >
                  <ChevronLeft className="size-3.5" strokeWidth={2} />
                </button>

                <div className="flex items-center gap-1 rounded-sm border border-border bg-secondary px-2.5 py-1 min-w-[52px] justify-center">
                  <span className="font-mono text-[10px] font-semibold tabular-nums text-foreground">
                    {currentPage}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">/</span>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {Math.max(document?.pages || 1, document?.pagesContent?.length || 1)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToolbarPageChange(Math.min(document?.pages || 1, currentPage + 1))}
                  disabled={currentPage >= Math.max(document?.pages || 1, document?.pagesContent?.length || 1)}
                  className="flex size-7 sm:size-8 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 transition-colors"
                >
                  <ChevronRight className="size-3.5" strokeWidth={2} />
                </button>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
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
                  onClick={() => setScale((s) => Math.min(2, s + 0.1))}
                  className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="size-3.5" strokeWidth={1.5} />
                </button>

                <div className="mx-1 sm:mx-2 h-4 w-px bg-border" />

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

                <button
                  type="button"
                  onClick={handlePrint}
                  className="hidden sm:flex size-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="Print Document"
                >
                  <Printer className="size-3.5" strokeWidth={1.5} />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={isExporting}
                      className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors cursor-pointer"
                      title="Export Document"
                    >
                      {isExporting ? (
                        <Loader2 className="size-3.5 animate-spin text-[#ff3d00]" />
                      ) : (
                        <Download className="size-3.5" strokeWidth={1.5} />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-popover text-popover-foreground border border-border p-1 rounded-md shadow-md z-50">
                    <DropdownMenuItem onClick={() => handleExport("PDF")} className="cursor-pointer font-mono text-[9px] uppercase tracking-wider focus:bg-accent focus:text-accent-foreground rounded-sm px-2 py-1.5">
                      PDF (.pdf)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("Markdown")} className="cursor-pointer font-mono text-[9px] uppercase tracking-wider focus:bg-accent focus:text-accent-foreground rounded-sm px-2 py-1.5">
                      Markdown (.md)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("TXT")} className="cursor-pointer font-mono text-[9px] uppercase tracking-wider focus:bg-accent focus:text-accent-foreground rounded-sm px-2 py-1.5">
                      Text (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("JSON")} className="cursor-pointer font-mono text-[9px] uppercase tracking-wider focus:bg-accent focus:text-accent-foreground rounded-sm px-2 py-1.5">
                      JSON (.json)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("CSV")} className="cursor-pointer font-mono text-[9px] uppercase tracking-wider focus:bg-accent focus:text-accent-foreground rounded-sm px-2 py-1.5">
                      CSV (.csv)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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

            <DocumentRenderer
              document={document}
              currentPage={currentPage}
              onPageChange={onPageChange}
              scale={scale}
              rotation={rotation}
              searchQuery={searchQuery}
              currentView={currentView}
              searchResults={searchResults}
              activeIndex={activeIndex}
            />
          </>
        )
      ) : (
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
