import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, MessageSquare, BarChart3, FolderOpen } from "lucide-react";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { DocumentViewer } from "./DocumentViewer";
import { AICopilotPanel } from "./AICopilotPanel";
import { InsightsPanel } from "./InsightsPanel";
import { useDocument } from "../../hooks/useDocument";
import { SearchService, SearchResult } from "../../services/document/SearchService";

type MobileTab = "document" | "copilot" | "insights" | "files";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(true); // Default Copilot to open on desktop
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentView, setCurrentView] = useState<"pdf" | "text">("pdf");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("document");
  const { document, hasDocument } = useDocument();

  // Search Engine States
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
    { id: "files", label: "Files", icon: FolderOpen },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <WorkspaceHeader
          documentName={displayDocumentName}
          userName={userName}
          userEmail={userEmail}
          userInitials={userInitials}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            if (emergencyFallback) return;
            setSearchQuery(q);
          }}
          onSidebarToggle={() => setSidebarOpen((o) => !o)}
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
        />

      {/* ── Desktop layout: side-by-side panels ── */}
      <div className="relative hidden lg:flex flex-1 overflow-hidden">
        <WorkspaceSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
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
            onCitationClick={(page) => {
              if (emergencyFallback) return;
              setCurrentPage(page);
              setCurrentView("text");
            }}
          />
          <InsightsPanel
            isOpen={insightsOpen && !emergencyFallback}
            onClose={() => setInsightsOpen(false)}
          />
        </div>
      </div>

      {/* ── Mobile layout: tabbed panels ── */}
      <div className="flex lg:hidden flex-1 flex-col overflow-hidden">
        {/* Mobile sidebar drawer (over content) */}
        <WorkspaceSidebar
          isOpen={mobileTab === "files" || sidebarOpen}
          onClose={() => {
            setSidebarOpen(false);
            setMobileTab("document");
          }}
        />

        {/* Tab content area */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === "document" && (
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
          )}
          {mobileTab === "copilot" && (
            <div className="flex flex-col h-full">
              <AICopilotPanel
                isOpen={true}
                onClose={() => setMobileTab("document")}
                showMessages={showMessages}
                onCitationClick={(page) => {
                  setCurrentPage(page);
                  setCurrentView("text");
                  setMobileTab("document");
                }}
              />
            </div>
          )}
          {mobileTab === "insights" && (
            <div className="flex flex-col h-full overflow-y-auto">
              <InsightsPanel
                isOpen={true}
                onClose={() => setMobileTab("document")}
              />
            </div>
          )}
          {mobileTab === "files" && (
            // Files tab opens the sidebar drawer — show doc viewer behind
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
          )}
        </div>

        {/* ── Mobile bottom tab bar ── */}
        <nav className="shrink-0 border-t border-border bg-background flex items-stretch pb-safe">
          {mobileTabs.map(({ id, label, icon: Icon }) => {
            const isActive = mobileTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (id === "files") {
                    setSidebarOpen(true);
                  }
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
    </div>
  );
}
