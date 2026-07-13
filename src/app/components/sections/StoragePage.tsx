import { useEffect, useState } from "react";
import { HardDrive, Trash2, Zap, FileText, BarChart3, AlertTriangle, ArrowRight, Menu } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useSidebar } from "../../context/SidebarContext";
import { WorkspaceShell } from "../workspace/WorkspaceShell";
import { DocumentService } from "../../services/document/documentService";
import { Document } from "../../types/document";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";

export function StoragePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toggle: toggleSidebar } = useSidebar();

  const loadDocuments = async () => {
    try {
      const docs = await DocumentService.sync(user?.uid);
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document to free up space?")) return;
    try {
      await DocumentService.delete(docId);
      toast.success("Document deleted");
      await loadDocuments();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete document.");
    }
  };

  // Calculations
  const totalSizeBytes = documents.reduce((sum, doc) => sum + doc.size, 0);
  const usedMB = totalSizeBytes / (1024 * 1024);
  const totalLimitMB = 10 * 1024; // 10 GB limit in MB
  const usagePercentage = Math.min(100, (usedMB / totalLimitMB) * 100);

  // Group breakdown
  const pdfDocs = documents.filter((d) => d.name.toLowerCase().endsWith(".pdf"));
  const docxDocs = documents.filter((d) => d.name.toLowerCase().endsWith(".docx") || d.name.toLowerCase().endsWith(".doc"));
  const txtDocs = documents.filter((d) => d.name.toLowerCase().endsWith(".txt"));

  const pdfSizeMB = pdfDocs.reduce((sum, d) => sum + d.size, 0) / (1024 * 1024);
  const docxSizeMB = docxDocs.reduce((sum, d) => sum + d.size, 0) / (1024 * 1024);
  const txtSizeMB = txtDocs.reduce((sum, d) => sum + d.size, 0) / (1024 * 1024);
  const otherDocs = documents.filter(
    (d) =>
      !d.name.toLowerCase().endsWith(".pdf") &&
      !d.name.toLowerCase().endsWith(".docx") &&
      !d.name.toLowerCase().endsWith(".doc") &&
      !d.name.toLowerCase().endsWith(".txt")
  );
  const otherSizeMB = otherDocs.reduce((sum, d) => sum + d.size, 0) / (1024 * 1024);

  // Sort files by size (descending)
  const sortedFiles = [...documents].sort((a, b) => b.size - a.size);

  const formatSize = (mb: number): string => {
    if (mb < 0.1) return `${(mb * 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const formatFileSizeBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <WorkspaceShell activeId="storage" showDocSearch={false}>
      <div className="relative min-h-[calc(100vh-72px)] p-6 md:p-8 bg-background">
        <div className="pointer-events-none absolute -top-40 right-0 h-[400px] w-[400px] rounded-full bg-[#ff3d00]/5 blur-[120px]" />

        <div className="mx-auto max-w-5xl">
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
                <HardDrive className="size-6 text-[#ff3d00]" strokeWidth={1.5} />
                Storage Settings
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Review your document workspace limits, usage patterns, and storage allocations.
              </p>
            </div>
            <button
              onClick={() => navigate("/pricing")}
              className="inline-flex items-center justify-center gap-2 border border-[#ff3d00]/40 bg-[#ff3d00]/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-200 cursor-pointer rounded-sm"
            >
              <Zap className="size-3.5" strokeWidth={1.5} />
              Upgrade Limits
            </button>
          </FadeIn>

          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <div className="size-6 animate-spin rounded-full border-2 border-[#ff3d00]/20 border-t-[#ff3d00]" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Analyzing storage usage...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
              {/* Left Column: Progress circle/bar and Type breakdown */}
              <div className="space-y-6 lg:col-span-7">
                {/* Visual storage card */}
                <FadeIn className="border border-border p-6 bg-[#0f0f0f]/40 rounded-sm">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground mb-4">Storage Allocation</h2>
                  
                  {/* Progress Info */}
                  <div className="flex justify-between items-baseline mb-3">
                    <div>
                      <span className="text-2xl font-bold tracking-tight text-foreground">{usedMB.toFixed(1)} MB</span>
                      <span className="text-xs text-muted-foreground/60 ml-1">used</span>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">Limit: 10,240.0 MB (10 GB)</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-[#ff3d00] transition-all duration-500 rounded-full"
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 mb-6">
                    <span>{usagePercentage.toFixed(1)}% utilized</span>
                    <span>{(totalLimitMB - usedMB).toFixed(1)} MB available</span>
                  </div>

                  {usagePercentage > 85 && (
                    <div className="border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-2 text-xs text-amber-500 rounded-sm mb-4">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Storage almost full</p>
                        <p className="text-[10px] opacity-80 mt-0.5">Please upgrade your subscription or clean up large files to prevent document upload blocks.</p>
                      </div>
                    </div>
                  )}
                </FadeIn>

                {/* Storage breakdown by file type */}
                <FadeIn className="border border-border p-6 bg-[#0f0f0f]/40 rounded-sm">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="size-4 text-[#ff3d00]" />
                    Format Breakdown
                  </h2>
                  <div className="space-y-4">
                    {[
                      { name: "PDF Documents", count: pdfDocs.length, size: pdfSizeMB, color: "bg-[#ff3d00]" },
                      { name: "Word Documents (.docx)", count: docxDocs.length, size: docxSizeMB, color: "bg-blue-500" },
                      { name: "Plain Text Files (.txt)", count: txtDocs.length, size: txtSizeMB, color: "bg-emerald-500" },
                      { name: "Other Formats", count: otherDocs.length, size: otherSizeMB, color: "bg-purple-500" },
                    ].map(({ name, count, size, color }) => {
                      const itemPercentage = Math.min(100, (size / Math.max(1, usedMB)) * 100);
                      return (
                        <div key={name} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-foreground">{name} ({count} files)</span>
                            <span className="font-mono text-muted-foreground">{formatSize(size)}</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${color} transition-all duration-300`}
                              style={{ width: `${itemPercentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </FadeIn>
              </div>

              {/* Right Column: Storage clean-up / List files by size */}
              <div className="lg:col-span-5 space-y-6">
                <FadeIn className="border border-border p-6 bg-[#0f0f0f]/40 rounded-sm">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">Clean Up Space</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Review files occupying space in your workspace. Deleting files frees up space instantly.
                    </p>
                  </div>

                  {sortedFiles.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 py-6 text-center">
                      No files currently uploaded.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#161616] max-h-[300px] overflow-y-auto pr-1 space-y-2.5">
                      {sortedFiles.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between py-2 gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-7 shrink-0 items-center justify-center border border-border bg-input/20">
                              <FileText className="size-3 text-[#ff3d00]" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-foreground">{doc.name}</p>
                              <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                                {formatFileSizeBytes(doc.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="flex size-7 shrink-0 items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm transition-all cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </FadeIn>

                {/* Subscription Summary Plan Card */}
                <FadeIn className="border border-border p-6 bg-[#0f0f0f]/40 rounded-sm">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground mb-1">Starter Account</h2>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#ff3d00]">Free Plan</p>
                  <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="size-1 rounded-full bg-[#ff3d00]" />
                      Max upload file size: 10 MB
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="size-1 rounded-full bg-[#ff3d00]" />
                      Total workspace storage: 10 GB
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="size-1 rounded-full bg-[#ff3d00]" />
                      RAG indexing: Free
                    </li>
                  </ul>
                  <button
                    onClick={() => navigate("/pricing")}
                    className="mt-6 w-full flex items-center justify-center gap-1.5 border border-[#ff3d00]/30 hover:border-[#ff3d00] bg-[#ff3d00]/10 hover:bg-[#ff3d00]/20 py-2.5 font-mono text-[9px] uppercase tracking-widest text-[#ff3d00] transition-all rounded-sm cursor-pointer"
                  >
                    View Billing & Upgrade <ArrowRight className="size-3" />
                  </button>
                </FadeIn>
              </div>
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
