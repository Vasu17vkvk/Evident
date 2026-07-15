import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, MessageSquare, BarChart3, Settings as SettingsIcon, StickyNote, X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPersistedNote } from "../../../services/api/api";
import { WorkspaceShell } from "./WorkspaceShell";
import { DocumentViewer } from "./DocumentViewer";
import { AICopilotPanel } from "./AICopilotPanel";
import { InsightsPanel } from "./InsightsPanel";
import { Account } from "../sections/Account";
import { useDocument } from "../../hooks/useDocument";
import { SearchService, SearchResult } from "../../services/document/SearchService";

type MobileTab = "document" | "copilot" | "insights" | "files" | "settings";

interface Props {
  documentName?: string;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  /** Show the mock message thread instead of the empty state */
  showMessages?: boolean;
}

export function WorkspaceLayout({
  documentName = "Q4 Financial Report",
  userName = "User",
  userEmail = "user@evident.ai",
  userInitials = "U",
  showMessages = false,
}: Props) {
  const [copilotOpen, setCopilotOpen] = useState(true); // Default Copilot to open on desktop
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Create Note Modal States
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSourceText, setNoteSourceText] = useState("");
  const [notePageNumber, setNotePageNumber] = useState<number | undefined>(undefined);
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    const handleCreateNoteEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail || {};
      setNoteTitle(detail.title || "");
      setNoteContent(detail.content || "");
      setNoteSourceText(detail.sourceText || "");
      setNotePageNumber(detail.pageNumber);
      setNoteModalOpen(true);
    };

    window.addEventListener("evident-create-note", handleCreateNoteEvent);
    return () => {
      window.removeEventListener("evident-create-note", handleCreateNoteEvent);
    };
  }, []);

  const handleSaveWorkspaceNote = async () => {
    if (!noteTitle.trim()) {
      toast.error("Please enter a note title");
      return;
    }
    setIsSavingNote(true);
    try {
      const docId = document?.mongoDbId || document?.id;
      const token = localStorage.getItem("access_token");
      let noteId = Math.random().toString(36).substring(7);

      if (token && docId) {
        const res = await createPersistedNote({
          title: noteTitle,
          content: noteContent,
          documentId: docId,
          pageNumber: notePageNumber,
          sourceText: noteSourceText || undefined,
        });
        noteId = res.noteId;
      }

      // Sync localstorage too so sidebar/dashboard count updates immediately
      const savedNotesStr = localStorage.getItem("evident_notes");
      const savedNotes = savedNotesStr ? JSON.parse(savedNotesStr) : [];
      const newNote = {
        id: noteId,
        title: noteTitle,
        content: noteContent,
        sourceText: noteSourceText,
        documentId: docId || "",
        documentName: document?.name || "",
        pageNumber: notePageNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      savedNotes.unshift(newNote);
      localStorage.setItem("evident_notes", JSON.stringify(savedNotes));
      window.dispatchEvent(new CustomEvent("evident-document-update"));

      toast.success("Note saved successfully!");
      setNoteModalOpen(false);
      setNoteTitle("");
      setNoteContent("");
      setNoteSourceText("");
      setNotePageNumber(undefined);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save note");
    } finally {
      setIsSavingNote(false);
    }
  };
  const [currentPage, setCurrentPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("page");
    return p ? parseInt(p) : 1;
  });
  const [currentView, setCurrentView] = useState<"pdf" | "text">("pdf");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("page");
    if (p) {
      setCurrentPage(parseInt(p));
    }
  }, [window.location.search]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("document");
  const { document, hasDocument } = useDocument();

  // Search Engine States
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  // Timer ref to clear transient citation search query after highlight
  const citationSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Emergency fallback: if doc isn't Ready for too long, disable AI/Insights/Search.
  const emergencyFallback = !!(document && document.status !== "Ready");

  // Only allow searching once full processing completed.
  const effectiveSearchQuery = emergencyFallback ? "" : searchQuery;

  // Run search engine live
  useEffect(() => {
    if (effectiveSearchQuery && effectiveSearchQuery.trim().length > 1) {
      const results = SearchService.search(document, effectiveSearchQuery);
      setSearchResults(results);
      if (results.length > 0) {
        setActiveIndex(0);
      } else {
        setActiveIndex(null);
      }
    } else {
      setSearchResults([]);
      setActiveIndex(null);
    }
  }, [effectiveSearchQuery, document]);

  // Shortcut Ctrl + F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleNextResult = useCallback(() => {
    if (searchResults.length === 0) return;
    setActiveIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % searchResults.length;
    });
  }, [searchResults]);

  const handlePrevResult = useCallback(() => {
    if (searchResults.length === 0) return;
    setActiveIndex((prev) => {
      if (prev === null) return searchResults.length - 1;
      return (prev - 1 + searchResults.length) % searchResults.length;
    });
  }, [searchResults]);

  // Use uploaded document name if available
  const displayDocumentName = hasDocument && document ? document.name : documentName;

  const mobileTabs: { id: MobileTab; label: string; icon: React.ElementType }[] = [
    { id: "document", label: "Document", icon: FileText },
    { id: "copilot", label: "Copilot", icon: MessageSquare },
    { id: "insights", label: "Insights", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <WorkspaceShell
      activeId="documents"
      showDocSearch={true}
      documentName={displayDocumentName}
      searchQuery={searchQuery}
      onSearchChange={(q) => {
        if (emergencyFallback) return;
        setSearchQuery(q);
      }}
      onCopilotToggle={() => {
        if (emergencyFallback) {
          // Prevent trapping user into AI UI during long processing.
          return;
        }
        // On mobile: switch to copilot tab
        if (window.innerWidth < 1024) {
          setMobileTab("copilot");
        } else {
          setCopilotOpen((o) => !o);
        }
      }}
      onInsightsToggle={() => {
        if (emergencyFallback) {
          return;
        }
        if (window.innerWidth < 1024) {
          setMobileTab("insights");
        } else {
          setInsightsOpen((o) => !o);
        }
      }}
      searchResultsCount={searchResults.length}
      activeResultIndex={activeIndex}
      onNextResult={handleNextResult}
      onPrevResult={handlePrevResult}
      searchInputRef={searchInputRef}
    >
      <style>{`
        :root {
          --navbar-height: 64px;
        }
        @media (min-width: 640px) {
          :root {
            --navbar-height: 72px;
          }
        }
      `}</style>

      {/* ── Desktop layout: side-by-side panels ── */}
      <div className="relative hidden lg:flex h-full w-full overflow-hidden">
        <DocumentViewer
          documentName={displayDocumentName}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          currentView={currentView}
          onViewChange={setCurrentView}
          searchQuery={effectiveSearchQuery}
          onInsightsToggle={() => setInsightsOpen((o) => !o)}
          searchResults={searchResults}
          activeIndex={activeIndex}
        />
        <div className="flex flex-col xl:flex-row xl:shrink-0 h-full">
          <AICopilotPanel
            isOpen={copilotOpen && !emergencyFallback}
            onClose={() => setCopilotOpen(false)}
            showMessages={showMessages}
            onCitationClick={(page, text) => {
              if (emergencyFallback) return;
              // Navigate to page
              setCurrentPage(page);
              // Switch to text view so highlights are visible for all formats
              setCurrentView("text");
              // Inject citation text into search pipeline to trigger highlight
              if (text) {
                // Use first 60 chars — enough for a specific match, short enough to find reliably
                const query = text.substring(0, 60).trim();
                setSearchQuery(query);
                // Clear after 4 s so the search bar doesn't stay polluted
                if (citationSearchTimeoutRef.current) clearTimeout(citationSearchTimeoutRef.current);
                citationSearchTimeoutRef.current = setTimeout(() => setSearchQuery(""), 4000);
              }
            }}
          />
          <InsightsPanel
            isOpen={insightsOpen && !emergencyFallback}
            onClose={() => setInsightsOpen(false)}
          />
        </div>
      </div>

      {/* ── Mobile layout: tabbed panels ── */}
      <div
        className="flex lg:hidden h-full flex-col overflow-hidden"
        style={{
          paddingBottom: "calc(var(--navbar-height) + env(safe-area-inset-bottom))",
        }}
      >
        {/* Tab content area */}
        <div className="flex-1 overflow-hidden h-full">
          {/* Document tab */}
          <div className={mobileTab === "document" ? "h-full w-full" : "hidden"}>
            <DocumentViewer
              documentName={displayDocumentName}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              currentView={currentView}
              onViewChange={setCurrentView}
              searchQuery={effectiveSearchQuery}
              onInsightsToggle={() => setMobileTab("insights")}
              searchResults={searchResults}
              activeIndex={activeIndex}
            />
          </div>

          {/* Copilot tab */}
          <div className={mobileTab === "copilot" ? "flex flex-col h-full w-full" : "hidden"}>
            <AICopilotPanel
              isOpen={true}
              onClose={() => setMobileTab("document")}
              showMessages={showMessages}
              onCitationClick={(page, text) => {
                setCurrentPage(page);
                setCurrentView("text");
                setMobileTab("document");
                if (text) {
                  const query = text.substring(0, 60).trim();
                  setSearchQuery(query);
                  if (citationSearchTimeoutRef.current) clearTimeout(citationSearchTimeoutRef.current);
                  citationSearchTimeoutRef.current = setTimeout(() => setSearchQuery(""), 4000);
                }
              }}
            />
          </div>

          {/* Insights tab */}
          <div className={mobileTab === "insights" ? "flex flex-col h-full w-full overflow-y-auto" : "hidden"}>
            <InsightsPanel
              isOpen={true}
              onClose={() => setMobileTab("document")}
            />
          </div>

          {/* Settings tab */}
          <div className={mobileTab === "settings" ? "flex flex-col h-full w-full overflow-y-auto" : "hidden"}>
            <Account />
          </div>
        </div>

        {/* ── Mobile bottom tab bar ── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background flex items-stretch"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            height: "calc(var(--navbar-height) + env(safe-area-inset-bottom))",
          }}
        >
          {mobileTabs.map(({ id, label, icon: Icon }) => {
            const isActive = mobileTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMobileTab(id);
                }}
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors relative ${
                  isActive
                    ? "text-[#ff3d00]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={label}
              >
                {/* Active top accent line */}
                <span
                  className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full transition-all duration-200 ${
                    isActive ? "bg-[#ff3d00] opacity-100" : "opacity-0"
                  }`}
                />
                <Icon className={`${isActive ? "size-5" : "size-4"} transition-all duration-150`} strokeWidth={isActive ? 2 : 1.5} />
                <span className={`font-mono text-[8px] uppercase tracking-wider transition-all duration-150 ${isActive ? "font-semibold" : ""}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Workspace Note Editor Modal ── */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[90vh] max-h-[600px] w-full max-w-lg flex-col border border-border bg-[#0f0f0f] p-6 shadow-2xl animate-fade-in rounded-sm">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <StickyNote className="size-4 text-[#ff3d00]" />
                Annotate Document
              </h3>
              <button
                onClick={() => {
                  setNoteModalOpen(false);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">
                  Note Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Findings from Page X"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full h-11 px-4 bg-[#0a0a0a] border border-border focus:border-[#ff3d00]/40 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-colors rounded-sm font-medium"
                />
              </div>

              {/* Source selection quotes */}
              {noteSourceText && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">
                    Selected Quote
                  </label>
                  <div className="p-3 bg-[#161616] border-l-2 border-[#ff3d00] text-[11px] leading-relaxed text-muted-foreground font-mono rounded-r-sm italic">
                    "{noteSourceText}"
                  </div>
                </div>
              )}

              {/* Annotation notes */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">
                  Annotation / Notes
                </label>
                <textarea
                  placeholder="Write details, key metrics, or comments..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full h-32 p-4 bg-[#0a0a0a] border border-border focus:border-[#ff3d00]/40 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-colors rounded-sm resize-none font-mono leading-relaxed"
                />
              </div>

              {/* Link Details Info */}
              <div className="text-[10px] font-mono text-muted-foreground/50 border border-border/40 p-2.5 rounded-sm bg-secondary/20">
                <span className="text-[#ff3d00] font-semibold">LINKED TO:</span> {displayDocumentName} {notePageNumber ? `(Page ${notePageNumber})` : ""}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-3 border-t border-border pt-4">
              <button
                onClick={handleSaveWorkspaceNote}
                disabled={isSavingNote}
                className="flex flex-1 items-center justify-center gap-2 border border-[#ff3d00] bg-[#ff3d00]/10 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-200 cursor-pointer rounded-sm font-semibold disabled:opacity-50"
              >
                {isSavingNote ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" strokeWidth={1.5} />
                )}
                Save Annotation
              </button>
              <button
                onClick={() => {
                  setNoteModalOpen(false);
                }}
                className="px-5 border border-border py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-input/20 transition-all cursor-pointer rounded-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
