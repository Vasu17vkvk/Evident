import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { StickyNote, Search, Plus, Trash2, Edit, Save, X, Link as LinkIcon, FileText, Menu } from "lucide-react";
import { toast } from "sonner";
import { useSidebar } from "../../context/SidebarContext";
import { WorkspaceShell } from "../workspace/WorkspaceShell";
import { DocumentService } from "../../services/document/documentService";
import { useDocument } from "../../hooks/useDocument";
import { useAuth } from "../../context/AuthContext";
import { Document } from "../../types/document";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";
import { fetchNotes, createPersistedNote, updatePersistedNote, deletePersistedNote } from "../../../services/api/api";

interface Note {
  id: string;
  title: string;
  content: string;
  documentId?: string;
  documentName?: string;
  pageNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note> | null>(null);
  
  const { selectDocument } = useDocument();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggle: toggleSidebar } = useSidebar();

  const loadNotes = async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const cloudNotes = await fetchNotes();
        const formatted: Note[] = cloudNotes.map(n => ({
          id: n.noteId,
          title: n.title,
          content: n.content,
          documentId: n.documentId,
          documentName: n.documentName,
          pageNumber: n.pageNumber,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        }));
        localStorage.setItem("evident_notes", JSON.stringify(formatted));
        setNotes(formatted);
        window.dispatchEvent(new CustomEvent("evident-document-update"));
        return;
      } catch (e) {
        console.error("Failed to fetch notes from cloud, falling back to local:", e);
      }
    }
    
    const saved = localStorage.getItem("evident_notes");
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await DocumentService.sync(user?.uid);
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    }
  };

  // Load notes and documents
  useEffect(() => {
    loadNotes();
    loadDocuments();
  }, [user]);

  const saveNotesToStorage = (updatedNotes: Note[]) => {
    localStorage.setItem("evident_notes", JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
    window.dispatchEvent(new CustomEvent("evident-document-update"));
  };

  const handleCreateNew = () => {
    setCurrentNote({
      title: "",
      content: "",
      documentId: "",
      documentName: "",
      pageNumber: undefined
    });
    setIsEditing(true);
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote({ ...note });
    setIsEditing(true);
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        await deletePersistedNote(noteId);
      } catch (err) {
        console.error("Failed to delete note from cloud:", err);
        toast.error("Failed to delete note from cloud.");
        return;
      }
    }

    const updated = notes.filter((n) => n.id !== noteId);
    saveNotesToStorage(updated);
    toast.success("Note deleted");
  };

  const handleSave = async () => {
    if (!currentNote || !currentNote.title?.trim()) {
      toast.error("Please enter a note title.");
      return;
    }

    let updatedNotes = [...notes];
    
    // Find doc name if documentId is linked
    let docName = "";
    if (currentNote.documentId) {
      const matchedDoc = documents.find((d) => d.id === currentNote.documentId);
      if (matchedDoc) docName = matchedDoc.name;
    }

    const token = localStorage.getItem("access_token");

    // Map local documentId to MongoDB ObjectID for cloud sync calls
    let backendDocId: string | undefined = undefined;
    if (currentNote.documentId) {
      const matchedDoc = documents.find((d) => d.id === currentNote.documentId);
      backendDocId = matchedDoc?.mongoDbId || currentNote.documentId;
    }

    if (currentNote.id) {
      // Editing existing note
      if (token) {
        try {
          await updatePersistedNote(currentNote.id, {
            title: currentNote.title,
            content: currentNote.content,
            documentId: backendDocId || undefined,
            pageNumber: currentNote.pageNumber || undefined,
          });
        } catch (err) {
          console.error("Failed to update note in cloud:", err);
          toast.error("Failed to update note in cloud.");
          return;
        }
      }

      updatedNotes = notes.map((n) =>
        n.id === currentNote.id
          ? {
              ...(currentNote as Note),
              documentName: docName,
              updatedAt: new Date().toISOString()
            }
          : n
      );
      toast.success("Note updated");
    } else {
      // Creating new note
      let noteId = Math.random().toString(36).substring(7);
      if (token) {
        try {
          const res = await createPersistedNote({
            title: currentNote.title,
            content: currentNote.content || "",
            documentId: backendDocId || undefined,
            pageNumber: currentNote.pageNumber || undefined,
          });
          noteId = res.noteId;
        } catch (err) {
          console.error("Failed to create note in cloud:", err);
          toast.error("Failed to create note in cloud.");
          return;
        }
      }

      const newNote: Note = {
        id: noteId,
        title: currentNote.title,
        content: currentNote.content || "",
        documentId: currentNote.documentId || "",
        documentName: docName,
        pageNumber: currentNote.pageNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updatedNotes.unshift(newNote);
      toast.success("Note created successfully!");
    }

    saveNotesToStorage(updatedNotes);
    setIsEditing(false);
    setCurrentNote(null);
  };

  const handleLinkClick = async (e: React.MouseEvent, docId: string, pageNumber?: number) => {
    e.stopPropagation();
    e.preventDefault();
    let doc = documents.find((d) => d.id === docId);
    if (!doc) {
      try {
        doc = await DocumentService.get(docId);
      } catch (err) {
        console.error("Failed to load document from IndexedDB:", err);
      }
    }
    if (doc) {
      await selectDocument(doc);
      navigate(`/workspace/${encodeURIComponent(doc.id)}?page=${pageNumber || 1}`);
    } else {
      toast.error("Linked document could not be found.");
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group notes by document
  const groupedNotes = filteredNotes.reduce((acc, note) => {
    const docId = note.documentId || "unlinked";
    const docName = note.documentName || "Unlinked Notes";
    if (!acc[docId]) {
      acc[docId] = { documentName: docName, notes: [] };
    }
    acc[docId].notes.push(note);
    return acc;
  }, {} as Record<string, { documentName: string; notes: Note[] }>);

  return (
    <WorkspaceShell activeId="notes" showDocSearch={false}>
      <div className="relative min-h-[calc(100vh-72px)] p-6 md:p-8 bg-background">
        <div className="pointer-events-none absolute -top-40 left-0 h-[400px] w-[400px] rounded-full bg-[#ff3d00]/5 blur-[120px]" />

        <div className="mx-auto max-w-6xl">
          {/* Editor Sidebar/Panel overlay */}
          {isEditing && currentNote && (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 p-4 backdrop-blur-sm">
              <div className="flex h-full w-full max-w-xl flex-col border border-border bg-[#0f0f0f] p-6 shadow-2xl animate-fade-in rounded-sm">
                {/* Editor Header */}
                <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    {currentNote.id ? "Edit Workspace Note" : "Create Workspace Note"}
                  </h3>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setCurrentNote(null);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="size-5" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Editor Form */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {/* Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">
                      Note Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Key Legal Findings..."
                      value={currentNote.title}
                      onChange={(e) =>
                        setCurrentNote((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full h-11 px-4 bg-[#0a0a0a] border border-border focus:border-[#ff3d00]/40 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-colors rounded-sm font-medium"
                    />
                  </div>

                  {/* Document Linkage */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">
                      Link to Document (Optional)
                    </label>
                    <select
                      value={currentNote.documentId || ""}
                      onChange={(e) =>
                        setCurrentNote((prev) => ({ ...prev, documentId: e.target.value, pageNumber: undefined }))
                      }
                      className="w-full h-11 px-4 bg-[#0a0a0a] border border-border focus:border-[#ff3d00]/40 text-xs text-foreground focus:outline-none transition-colors rounded-sm"
                    >
                      <option value="">No Document Link</option>
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Page Number Linkage */}
                  {currentNote.documentId && (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">
                        Page Number (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 1"
                        value={currentNote.pageNumber || ""}
                        onChange={(e) =>
                          setCurrentNote((prev) => ({
                            ...prev,
                            pageNumber: e.target.value ? parseInt(e.target.value) : undefined,
                          }))
                        }
                        className="w-full h-11 px-4 bg-[#0a0a0a] border border-border focus:border-[#ff3d00]/40 text-xs text-foreground focus:outline-none transition-colors rounded-sm"
                      />
                    </div>
                  )}

                  {/* Content body */}
                  <div className="flex flex-col gap-1.5 flex-1 h-[calc(100%-180px)] min-h-[220px]">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">
                      Note Content
                    </label>
                    <textarea
                      placeholder="Write findings, summaries, or citations from your RAG context..."
                      value={currentNote.content}
                      onChange={(e) =>
                        setCurrentNote((prev) => ({ ...prev, content: e.target.value }))
                      }
                      className="w-full flex-1 p-4 bg-[#0a0a0a] border border-border focus:border-[#ff3d00]/40 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-colors rounded-sm resize-none font-mono leading-relaxed"
                    />
                  </div>
                </div>

                {/* Editor Actions */}
                <div className="mt-6 flex gap-3 border-t border-border pt-4">
                  <button
                    onClick={handleSave}
                    className="flex flex-1 items-center justify-center gap-2 border border-[#ff3d00] bg-[#ff3d00]/10 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-200 cursor-pointer rounded-sm font-semibold"
                  >
                    <Save className="size-3.5" strokeWidth={1.5} />
                    Save Note
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setCurrentNote(null);
                    }}
                    className="px-5 border border-border py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-input/20 transition-all cursor-pointer rounded-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main layout */}
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
                <StickyNote className="size-6 text-[#ff3d00]" strokeWidth={1.5} />
                My Notes
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Capture summaries, annotations, and key excerpts from your documents.
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center justify-center gap-2 border border-[#ff3d00] bg-[#ff3d00]/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-200 cursor-pointer rounded-sm"
            >
              <Plus className="size-3.5" strokeWidth={1.5} />
              Create Note
            </button>
          </FadeIn>

          {/* Search bar */}
          <FadeIn className="mb-6 flex">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search through notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-[#0f0f0f]/60 border border-border focus:border-[#ff3d00]/40 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none transition-colors rounded-sm"
              />
            </div>
          </FadeIn>

          {/* Notes display grouped by document */}
          {filteredNotes.length === 0 ? (
            <FadeIn className="border border-dashed border-border bg-[#0f0f0f]/10 p-12 text-center rounded-sm">
              <div className="mx-auto flex size-12 items-center justify-center border border-border bg-input/10 mb-4">
                <StickyNote className="size-5 text-[#ff3d00]/60" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {searchQuery ? "No notes found" : "No notes yet."}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? `No notes match your search term "${searchQuery}".`
                  : "Save important information while reading documents."}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreateNew}
                  className="mt-5 inline-flex items-center gap-2 border border-[#ff3d00]/40 bg-[#ff3d00]/10 px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-150 cursor-pointer rounded-sm"
                >
                  <Plus className="size-3" strokeWidth={1.5} />
                  Write First Note
                </button>
              )}
            </FadeIn>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedNotes).map(([docId, group]) => (
                <div key={docId} className="space-y-4">
                  <h2 className="text-xs font-semibold tracking-wider text-muted-foreground border-b border-border/30 pb-2 flex items-center gap-2">
                    <FileText className="size-3.5 text-[#ff3d00]" />
                    <span className="uppercase tracking-[0.1em]">{group.documentName}</span>
                    <span className="font-mono text-[9px] text-[#ff3d00] bg-[#ff3d00]/10 px-1.5 py-0.5 rounded-sm">
                      {group.notes.length} note{group.notes.length !== 1 ? "s" : ""}
                    </span>
                  </h2>
                  <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.notes.map((note) => (
                      <StaggerItem key={note.id}>
                        <div className="group relative flex flex-col justify-between border border-border bg-[#0f0f0f]/40 p-5 hover:border-[#ff3d00]/30 hover:bg-[#ff3d00]/[0.02] transition-all duration-200 rounded-sm min-h-[180px]">
                          <div>
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="text-xs font-semibold text-foreground group-hover:text-[#ff3d00] transition-colors truncate pr-10">
                                {note.title}
                              </h3>
                              <div className="absolute right-4 top-4 flex gap-1">
                                <button
                                  onClick={() => handleEditNote(note)}
                                  className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[#ff3d00]/10 transition-colors rounded-sm"
                                  title="Edit Note"
                                >
                                  <Edit className="size-3" strokeWidth={1.5} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteNote(e, note.id)}
                                  className="flex size-6 items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-sm"
                                  title="Delete Note"
                                >
                                  <Trash2 className="size-3" strokeWidth={1.5} />
                                </button>
                              </div>
                            </div>

                            {/* Content snippet */}
                            <p className="text-[11px] text-muted-foreground line-clamp-4 leading-relaxed font-mono whitespace-pre-wrap mt-2">
                              {note.content}
                            </p>
                          </div>

                          {/* Footer - linked document */}
                          <div className="mt-4 border-t border-[#1f1f1f] pt-2.5 flex flex-col gap-1.5">
                            {note.documentId ? (
                              <button
                                type="button"
                                onClick={(e) => handleLinkClick(e, note.documentId!, note.pageNumber)}
                                className="flex items-center gap-1 text-[9px] font-medium text-[#ff3d00] hover:underline text-left truncate w-full"
                              >
                                <LinkIcon className="size-2.5 shrink-0" />
                                <span className="truncate">
                                  Linked: {note.documentName}
                                  {note.pageNumber ? ` (Page ${note.pageNumber})` : ""}
                                </span>
                              </button>
                            ) : (
                              <span className="font-mono text-[8px] text-muted-foreground/40 uppercase tracking-wider">
                                Unlinked Note
                              </span>
                            )}
                            
                            <span className="font-mono text-[8px] text-muted-foreground/40">
                              Edited {new Date(note.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
