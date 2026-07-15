import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { FileText, Star, Trash2, Search, Upload, RefreshCw, Eye, Menu } from "lucide-react";
import { toast } from "sonner";
import { useSidebar } from "../../context/SidebarContext";
import { WorkspaceShell } from "../workspace/WorkspaceShell";
import { DocumentService } from "../../services/document/documentService";
import { useDocument } from "../../hooks/useDocument";
import { useAuth } from "../../context/AuthContext";
import { Document } from "../../types/document";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFavorite, setFilterFavorite] = useState<string>("all");

  const { uploadDocument, selectDocument } = useDocument();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { toggle: toggleSidebar } = useSidebar();

  const loadDocuments = async () => {
    try {
      const docs = await DocumentService.sync(user?.uid);
      setDocuments(docs);
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error("Failed to fetch documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Trigger upload
    toast.loading(`Uploading "${file.name}"...`, { id: "upload-toast" });
    try {
      await uploadDocument(file);
      toast.success("Document uploaded successfully!", { id: "upload-toast" });
      await loadDocuments();
      
      // Get the document we just uploaded (should be latest one)
      const allDocs = await DocumentService.getAll();
      allDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (allDocs.length > 0) {
        const latestDoc = allDocs[0];
        // Select it and go to workspace
        await selectDocument(latestDoc);
        navigate(`/workspace/${encodeURIComponent(latestDoc.id)}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload document.", { id: "upload-toast" });
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    e.preventDefault();
    const originalDocs = [...documents];
    const isFavorite = !doc.favorite;

    // Optimistic UI Update: toggle the state locally immediately
    const updatedDocs = documents.map((d) =>
      d.id === doc.id ? { ...d, favorite: isFavorite } : d
    );
    setDocuments(updatedDocs);

    try {
      await DocumentService.update(doc.id, { favorite: isFavorite });
      if (doc.mongoDbId) {
        const { addFavorite, deleteFavorite } = await import("../../../services/api/api");
        if (isFavorite) {
          await addFavorite(doc.mongoDbId);
        } else {
          await deleteFavorite(doc.mongoDbId);
        }
      }
      // Dispatch document update event so other components refresh
      window.dispatchEvent(new CustomEvent("evident-document-update"));
      toast.success(isFavorite ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Could not update document.");
      // Revert state on failure
      setDocuments(originalDocs);
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

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesType = true;
    if (filterType === "pdf") matchesType = doc.name.toLowerCase().endsWith(".pdf");
    else if (filterType === "word") matchesType = doc.name.toLowerCase().endsWith(".docx") || doc.name.toLowerCase().endsWith(".doc");
    else if (filterType === "text") matchesType = doc.name.toLowerCase().endsWith(".txt");

    let matchesFavorite = true;
    if (filterFavorite === "favorites") matchesFavorite = !!doc.favorite;

    return matchesSearch && matchesType && matchesFavorite;
  });

  // Sort documents
  filteredDocs.sort((a, b) => {
    if (sortBy === "date-desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "date-asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "name-asc") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "name-desc") {
      return b.name.localeCompare(a.name);
    }
    if (sortBy === "size-desc") {
      return b.size - a.size;
    }
    if (sortBy === "size-asc") {
      return a.size - b.size;
    }
    if (sortBy === "opened-desc") {
      const dateA = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
      const dateB = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <WorkspaceShell activeId="documents" showDocSearch={false}>
      <div className="relative min-h-[calc(100vh-72px)] p-6 md:p-8 bg-background">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -top-40 left-0 h-[400px] w-[400px] rounded-full bg-[#ff3d00]/5 blur-[120px]" />

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mx-auto max-w-6xl">
          {/* Header row */}
          <FadeIn className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] mb-1">
                Workspace
              </p>
              <h1 className="text-2xl font-semibold tracking-tighter text-foreground md:text-3xl flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden lg:flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm hover:bg-muted/10"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="size-5" />
                </button>
                My Documents
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Manage and analyze your uploaded files with Evident RAG.
              </p>
            </div>
            <button
              onClick={handleUploadClick}
              className="inline-flex items-center justify-center gap-2 border border-[#ff3d00] bg-[#ff3d00]/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-200 cursor-pointer rounded-sm"
            >
              <Upload className="size-3.5" strokeWidth={1.5} />
              Upload Document
            </button>
          </FadeIn>

          {/* Search bar, sorting, filtering & Refresh */}
          <FadeIn className="mb-6 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search documents by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-[#0f0f0f]/60 border border-border focus:border-[#ff3d00]/40 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none transition-colors rounded-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-11 px-3 bg-[#0f0f0f]/60 border border-border text-xs text-muted-foreground focus:text-foreground focus:outline-none transition-colors rounded-sm cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF</option>
                <option value="word">Word</option>
                <option value="text">Text</option>
              </select>

              <select
                value={filterFavorite}
                onChange={(e) => setFilterFavorite(e.target.value)}
                className="h-11 px-3 bg-[#0f0f0f]/60 border border-border text-xs text-muted-foreground focus:text-foreground focus:outline-none transition-colors rounded-sm cursor-pointer"
              >
                <option value="all">All Documents</option>
                <option value="favorites">Favorites Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 px-3 bg-[#0f0f0f]/60 border border-border text-xs text-muted-foreground focus:text-foreground focus:outline-none transition-colors rounded-sm cursor-pointer"
              >
                <option value="date-desc">Newest Uploaded</option>
                <option value="date-asc">Oldest Uploaded</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="size-desc">Largest Size</option>
                <option value="size-asc">Smallest Size</option>
                <option value="opened-desc">Recently Opened</option>
              </select>

              <button
                onClick={loadDocuments}
                className="flex size-11 shrink-0 items-center justify-center border border-border bg-[#0f0f0f]/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm"
                title="Refresh list"
              >
                <RefreshCw className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </FadeIn>


          {/* Main content list */}
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <div className="size-6 animate-spin rounded-full border-2 border-[#ff3d00]/20 border-t-[#ff3d00]" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Loading workspace...
              </p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <FadeIn className="border border-dashed border-border bg-[#0f0f0f]/10 p-12 text-center rounded-sm">
              <div className="mx-auto flex size-12 items-center justify-center border border-border bg-input/10 mb-4">
                <FileText className="size-5 text-[#ff3d00]/60" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {searchQuery ? "No search results" : "Your document library is empty"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? `We couldn't find any documents matching "${searchQuery}". Try editing your query.`
                  : "Upload PDF, Word (DOCX), or Text files to begin exploring, querying, and extracting insights."}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleUploadClick}
                  className="mt-5 inline-flex items-center gap-2 border border-[#ff3d00]/40 bg-[#ff3d00]/10 px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-150 cursor-pointer rounded-sm"
                >
                  <Upload className="size-3" strokeWidth={1.5} />
                  Choose File
                </button>
              )}
            </FadeIn>
          ) : (
            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDocs.map((doc) => {
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
                        <span className="font-mono text-[9px] text-muted-foreground/60">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                        
                        {doc.status !== "Ready" ? (
                          <span className="font-mono text-[9px] text-[#ff3d00] uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-[#ff3d00]" />
                            {doc.status}
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] text-muted-foreground/80 group-hover:text-foreground transition-colors flex items-center gap-1">
                            Open <Eye className="size-3" />
                          </span>
                        )}
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
