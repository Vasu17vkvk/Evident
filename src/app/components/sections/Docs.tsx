import { useState, useMemo } from "react";
import { Search, ChevronRight, FileText, Code2, Copy, Check } from "lucide-react";
import { Container } from "../layout/Container";
import { Section } from "../layout/Section";
import { FadeIn } from "../layout/FadeIn";
import { DOCS_SECTIONS, type DocsSection, type DocsPage } from "../../data/content";

export function Docs() {
  // Navigation State
  const [activeSectionId, setActiveSectionId] = useState(DOCS_SECTIONS[0].id);
  const [activePageId, setActivePageId] = useState(DOCS_SECTIONS[0].pages[0].id);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState("");
  
  // Copy code indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter sections and pages based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return DOCS_SECTIONS;
    
    return DOCS_SECTIONS.map(section => {
      const matchingPages = section.pages.filter(page => 
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (matchingPages.length > 0 || section.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return {
          ...section,
          pages: matchingPages.length > 0 ? matchingPages : section.pages
        };
      }
      return null;
    }).filter(Boolean) as DocsSection[];
  }, [searchQuery]);

  // Find the active page content
  const activePage = useMemo(() => {
    for (const s of DOCS_SECTIONS) {
      const page = s.pages.find(p => p.id === activePageId);
      if (page) return page;
    }
    return DOCS_SECTIONS[0].pages[0];
  }, [activePageId]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Section className="relative min-h-screen pt-24 pb-20 md:pt-28 md:pb-24">
      <Container>
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Sidebar - Navigation & Search (Col span 3) */}
          <aside className="w-full lg:col-span-3 lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
            <div className="mb-6 flex flex-col gap-4">
              <div>
                <p className="font-mono-label text-[10px] uppercase tracking-widest text-accent mb-1.5">
                  Documentation
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Reference Docs
                </h2>
              </div>
              
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-input/40 border border-border text-xs rounded-none pl-9 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent/80 transition-colors"
                />
              </div>
            </div>

            {/* Navigation Lists */}
            <nav className="flex flex-col gap-6">
              {filteredSections.map((section) => (
                <div key={section.id} className="flex flex-col gap-2">
                  <h3 className="font-mono-label text-[9px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-2">
                    {section.title}
                  </h3>
                  <ul className="flex flex-col gap-1 border-l border-border pl-2">
                    {section.pages.map((page) => {
                      const isActive = activePageId === page.id;
                      return (
                        <li key={page.id}>
                          <button
                            onClick={() => {
                              setActiveSectionId(section.id);
                              setActivePageId(page.id);
                            }}
                            className={`w-full flex items-center justify-between text-left text-xs px-2 py-1.5 transition-colors duration-150 ${
                              isActive
                                ? "text-accent font-medium border-l border-accent -ml-[9px] bg-accent/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            }`}
                          >
                            <span className="truncate">{page.title}</span>
                            {isActive && <ChevronRight className="size-3 text-accent shrink-0" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              
              {filteredSections.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No matching documentation found.
                </p>
              )}
            </nav>
          </aside>

          {/* Right Main Pane - Content Reader (Col span 9) */}
          <main className="w-full lg:col-span-9 border-t border-border pt-8 lg:border-t-0 lg:pt-0">
            <FadeIn key={activePage.id} className="max-w-3xl">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono-label text-[9px] uppercase tracking-wider text-muted-foreground/60">
                  {DOCS_SECTIONS.find(s => s.id === activeSectionId)?.title || "Guides"}
                </span>
                <span className="text-[10px] text-muted-foreground/40">/</span>
                <span className="font-mono-label text-[9px] uppercase tracking-wider text-accent font-semibold">
                  {activePage.title}
                </span>
              </div>

              {/* Page Title */}
              <h1 className="text-3xl font-semibold leading-tight tracking-tighter text-foreground sm:text-4xl mb-6">
                {activePage.title}
              </h1>

              {/* Main Text Content */}
              <div className="prose prose-invert max-w-none mb-10">
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  {activePage.content}
                </p>
              </div>

              {/* Rendering Code Snippet if exists */}
              {activePage.codeSnippet && (
                <div className="mb-10 flex flex-col border border-border bg-input/20">
                  {/* Code header */}
                  <div className="flex items-center justify-between border-b border-border bg-input/40 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Code2 className="size-3.5 text-accent" />
                      <span className="font-mono-label text-[10px] uppercase tracking-wider text-muted-foreground">
                        {activePage.codeSnippet.language}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(activePage.codeSnippet!.code, activePage.id)}
                      className="flex items-center gap-1.5 text-[10px] font-mono-label text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy code to clipboard"
                    >
                      {copiedId === activePage.id ? (
                        <>
                          <Check className="size-3 text-accent" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  {/* Code content */}
                  <pre className="overflow-x-auto p-4 font-mono text-xs leading-normal text-muted-foreground bg-input/10">
                    <code>{activePage.codeSnippet.code}</code>
                  </pre>
                </div>
              )}

              {/* Help Banner at end of page */}
              <div className="border border-border/80 bg-input/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold tracking-tight text-foreground mb-1">
                    Need additional assistance?
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Our technical developers are standing by. Get in touch with our team directly.
                  </p>
                </div>
                <button className="self-start md:self-center font-mono-label text-[10px] uppercase tracking-widest text-accent border border-accent/40 bg-accent/5 hover:bg-accent hover:text-accent-foreground px-4 py-2 transition-all duration-200">
                  Submit Support Ticket
                </button>
              </div>

            </FadeIn>
          </main>

        </div>
      </Container>
    </Section>
  );
}
