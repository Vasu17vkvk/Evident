import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FileText, Star, Trash2, Clock, Eye, Menu } from "lucide-react";
import { toast } from "sonner";
import { useSidebar } from "../../context/SidebarContext";
import { WorkspaceShell } from "../workspace/WorkspaceShell";
import { DocumentService } from "../../services/document/documentService";
import { useDocument } from "../../hooks/useDocument";
import { useAuth } from "../../context/AuthContext";
import { Document } from "../../types/document";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";

export function RecentPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectDocument } = useDocument();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggle: toggleSidebar } = useSidebar();

  const loadDocuments = async () => {
    try {
      const docs = await DocumentService.sync(user?.uid);
      // Filter: only documents with lastOpenedAt, sorted descending, limit 10
      const recentDocs = docs
        .filter((d) => !!d.lastOpenedAt)
        .sort((a, b) => {
          const dateA = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
          const dateB = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 10);
      setDocuments(recentDocs);
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error("Failed to fetch recent documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);


  const handleToggleFavorite = async (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const isFavorite = !doc.favorite;
      await DocumentService.update(doc.id, { favorite: isFavorite });
      toast.success(isFavorite ? "Added to favorites" : "Removed from favorites");
      await loadDocuments();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Could not update document.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await DocumentService.delete(docId);
      toast.success("Document deleted");
      await loadDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Could not delete document.");
    }
  };

  const handleOpenDoc = async (doc: Document) => {
    await selectDocument(doc);
    navigate(`/workspace/${encodeURIComponent(doc.id)}`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format time relative or simple string
  const formatTimeAgo = (dateStr: Date | string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <WorkspaceShell activeId="recent" showDocSearch={false}>
      <div className="relative min-h-[calc(100vh-72px)] p-6 md:p-8 bg-background">
        <div className="pointer-events-none absolute -top-40 left-0 h-[400px] w-[400px] rounded-full bg-[#ff3d00]/5 blur-[120px]" />

        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <FadeIn className="mb-8">
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
              <Clock className="size-6 text-[#ff3d00]" strokeWidth={2} />
              Recent Documents
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Pick up where you left off. Here are the documents you've accessed recently.
            </p>
          </FadeIn>

          {/* List of files */}
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <div className="size-6 animate-spin rounded-full border-2 border-[#ff3d00]/20 border-t-[#ff3d00]" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Loading recent activity...
              </p>
            </div>
          ) : documents.length === 0 ? (
            <FadeIn className="border border-dashed border-border bg-[#0f0f0f]/10 p-12 text-center rounded-sm">
              <div className="mx-auto flex size-12 items-center justify-center border border-border bg-input/10 mb-4">
                <Clock className="size-5 text-[#ff3d00]/60" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No recent documents</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Documents you upload and review will appear here in chronological order of access.
              </p>
              <button
                onClick={() => navigate("/documents")}
                className="mt-5 inline-flex items-center gap-2 border border-[#ff3d00]/40 bg-[#ff3d00]/10 px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-150 cursor-pointer rounded-sm"
              >
                Go to Documents
              </button>
            </FadeIn>
          ) : (
            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => {
                const isFav = !!doc.favorite;
                return (
                  <StaggerItem key={doc.id}>
                    <div
                      onClick={() => handleOpenDoc(doc)}
                      className="group relative flex flex-col justify-between border border-border bg-[#0f0f0f]/40 p-5 hover:border-[#ff3d00]/30 hover:bg-[#ff3d00]/[0.02] transition-all duration-200 cursor-pointer rounded-sm h-full"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex size-9 shrink-0 items-center justify-center border border-border bg-input/20 group-hover:border-[#ff3d00]/30 transition-colors">
                            <FileText className="size-4 text-[#ff3d00]" strokeWidth={1.5} />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => handleToggleFavorite(e, doc)}
                              className={`flex size-7 items-center justify-center text-muted-foreground transition-colors rounded-sm hover:bg-[#ff3d00]/10 ${
                                isFav ? "text-[#ff3d00]" : "hover:text-[#ff3d00]"
                              }`}
                              title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                            >
                              <Star className={`size-3.5 ${isFav ? "fill-[#ff3d00]" : ""}`} strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, doc.id)}
                              className="flex size-7 items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-sm"
                              title="Delete file"
                            >
                              <Trash2 className="size-3.5" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>

                        {/* Title & info */}
                        <h3 className="text-xs font-semibold text-foreground group-hover:text-[#ff3d00] transition-colors truncate">
                          {doc.name}
                        </h3>
                        <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                          {formatFileSize(doc.size)}
                        </p>
                      </div>

                      {/* Footer info */}
                      <div className="mt-5 border-t border-[#1f1f1f] pt-3 flex items-center justify-between">
                        <span className="font-mono text-[9px] text-muted-foreground/60 flex items-center gap-1">
                          <Clock className="size-3 text-[#ff3d00]/60" />
                          {formatTimeAgo(doc.updatedAt)}
                        </span>
                        
                        <span className="font-mono text-[9px] text-muted-foreground/80 group-hover:text-foreground transition-colors flex items-center gap-1">
                          Open <Eye className="size-3" />
                        </span>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
