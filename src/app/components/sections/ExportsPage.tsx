import { useEffect, useState } from "react";
import { Download, Trash2, FileDown, Eye, FileText, RefreshCw, ExternalLink, Menu } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useSidebar } from "../../context/SidebarContext";
import { WorkspaceShell } from "../workspace/WorkspaceShell";
import { DocumentService } from "../../services/document/documentService";
import { ExportService } from "../../services/export/ExportService";
import { useDocument } from "../../hooks/useDocument";
import { Document } from "../../types/document";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";

interface ExportHistoryItem {
  id: string;
  documentId: string;
  documentName: string;
  format: string;
  fileName: string;
  fileSize: number;
  generatedAt: string;
  contentStr?: string | null;
}

export function ExportsPage() {
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectDocument } = useDocument();
  const navigate = useNavigate();
  const { toggle: toggleSidebar } = useSidebar();

  const loadData = async () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem("evident_export_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
      const docs = await DocumentService.getAll();
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem("evident_export_history", JSON.stringify(updated));
    setHistory(updated);
    toast.success("Export log removed");
  };

  const handleClearAll = () => {
    if (!confirm("Are you sure you want to clear your entire export history?")) return;
    localStorage.removeItem("evident_export_history");
    setHistory([]);
    toast.success("Export history cleared");
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (item: ExportHistoryItem) => {
    // Check if document still exists to re-export fresh
    const doc = documents.find((d) => d.id === item.documentId);
    
    if (doc) {
      toast.loading(`Re-generating export for ${doc.name}...`, { id: "download-toast" });
      try {
        const result = await ExportService.export(doc, item.format.toLowerCase(), {
          includeContent: true,
          includeMetadata: true,
          includeInsights: true,
          includeStatistics: true,
        });
        downloadBlob(result.content as Blob, result.fileName);
        toast.success("Download started!", { id: "download-toast" });
      } catch (err) {
        console.error(err);
        toast.error("Failed to re-generate export on the fly.", { id: "download-toast" });
      }
    } else if (item.contentStr) {
      // Use cached string content
      const mime = item.format === "JSON" ? "application/json" : "text/plain";
      const blob = new Blob([item.contentStr], { type: mime });
      downloadBlob(blob, item.fileName);
      toast.success("Downloaded cached export copy.");
    } else {
      toast.error("Original document was deleted, and export data is not cached.");
    }
  };

  const handleOpenDoc = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      await selectDocument(doc);
      navigate(`/workspace/${encodeURIComponent(doc.id)}`);
    } else {
      toast.error("This document no longer exists in your workspace.");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <WorkspaceShell activeId="exports" showDocSearch={false}>
      <div className="relative min-h-[calc(100vh-72px)] p-6 md:p-8 bg-background">
        <div className="pointer-events-none absolute -top-40 left-0 h-[400px] w-[400px] rounded-full bg-[#ff3d00]/5 blur-[120px]" />

        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <FadeIn className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] mb-1">
                Workspace
              </p>
              <h1 className="text-2xl font-semibold tracking-tighter text-foreground md:text-3xl flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden lg:flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm hover:bg-muted/10"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="size-5" />
                </button>
                <FileDown className="size-6 text-[#ff3d00]" strokeWidth={1.5} />
                Export History
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                A ledger of your generated document exports (PDF, Markdown, TXT, JSON, CSV).
              </p>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center justify-center gap-2 border border-destructive bg-destructive/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-destructive hover:bg-destructive hover:text-foreground transition-all duration-200 cursor-pointer rounded-sm"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
                Clear Ledger
              </button>
            )}
          </FadeIn>

          {/* Refresh Action */}
          <FadeIn className="mb-4 flex justify-end">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 border border-border px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-input/20 transition-all rounded-sm cursor-pointer"
            >
              <RefreshCw className="size-3" strokeWidth={1.5} />
              Reload History
            </button>
          </FadeIn>

          {/* History ledger content */}
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <div className="size-6 animate-spin rounded-full border-2 border-[#ff3d00]/20 border-t-[#ff3d00]" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Loading history ledger...
              </p>
            </div>
          ) : history.length === 0 ? (
            <FadeIn className="border border-dashed border-border bg-[#0f0f0f]/10 p-12 text-center rounded-sm">
              <div className="mx-auto flex size-12 items-center justify-center border border-border bg-input/10 mb-4">
                <FileDown className="size-5 text-[#ff3d00]/50" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No exports generated</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Any exports (structured text, JSON tables, insights, summaries) you download from a document viewer will be catalogued here.
              </p>
              <button
                onClick={() => navigate("/documents")}
                className="mt-5 inline-flex items-center gap-2 border border-[#ff3d00]/40 bg-[#ff3d00]/10 px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-150 cursor-pointer rounded-sm"
              >
                Go to Documents
              </button>
            </FadeIn>
          ) : (
            <FadeIn className="overflow-x-auto border border-border bg-[#0a0a0a]/50 rounded-sm">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-[#0f0f0f]/80 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-5 py-4 font-medium">Document Source</th>
                    <th className="px-5 py-4 font-medium">Format</th>
                    <th className="px-5 py-4 font-medium">Filename</th>
                    <th className="px-5 py-4 font-medium">File Size</th>
                    <th className="px-5 py-4 font-medium">Generated Date</th>
                    <th className="px-5 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161616]">
                  {history.map((item) => {
                    const docExists = documents.some((d) => d.id === item.documentId);
                    return (
                      <tr
                        key={item.id}
                        className="text-xs hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="size-3.5 text-[#ff3d00]" strokeWidth={1.5} />
                            <button
                              onClick={() => handleOpenDoc(item.documentId)}
                              className={`font-semibold hover:underline text-left transition-colors truncate max-w-[200px] ${
                                docExists ? "text-foreground hover:text-[#ff3d00]" : "text-muted-foreground/60 cursor-not-allowed"
                              }`}
                              title={docExists ? "Open document in workspace" : "Document deleted"}
                              disabled={!docExists}
                            >
                              {item.documentName}
                            </button>
                            {docExists && <ExternalLink className="size-2.5 text-muted-foreground/40" />}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-[10px] border border-border px-2 py-0.5 rounded-sm bg-[#0f0f0f] text-foreground font-semibold">
                            {item.format}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {item.fileName}
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-muted-foreground">
                          {formatFileSize(item.fileSize)}
                        </td>
                        <td className="px-5 py-4 font-mono text-[10px] text-muted-foreground/60">
                          {new Date(item.generatedAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownload(item)}
                              className="flex size-8 items-center justify-center text-muted-foreground hover:text-[#ff3d00] hover:bg-[#ff3d00]/10 transition-all rounded-sm cursor-pointer"
                              title="Download file"
                            >
                              <Download className="size-4" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="flex size-8 items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-sm cursor-pointer"
                              title="Delete log item"
                            >
                              <Trash2 className="size-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </FadeIn>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
