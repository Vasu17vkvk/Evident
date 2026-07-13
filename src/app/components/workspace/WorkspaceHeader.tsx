import {
  Search,
  Sun,
  Moon,
  ChevronDown,
  FileText,
  Menu,
  MessageSquare,
  BarChart3,
  X,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import logo from "../../../assets/Evident.png";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

interface Props {
  documentName?: string;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSidebarToggle?: () => void;
  onCopilotToggle?: () => void;
  onInsightsToggle?: () => void;
  searchResultsCount?: number;
  activeResultIndex?: number | null;
  onNextResult?: () => void;
  onPrevResult?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  showDocSearch?: boolean;
}

export function WorkspaceHeader({
  documentName = "Q4 Financial Report.pdf",
  searchQuery = "",
  onSearchChange,
  onSidebarToggle,
  onCopilotToggle,
  onInsightsToggle,
  searchResultsCount = 0,
  activeResultIndex = null,
  onNextResult,
  onPrevResult,
  searchInputRef,
  showDocSearch = false,
}: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout, navigate]);

  return (
    <header className="flex shrink-0 flex-col border-b border-border bg-background">
      {/* ── Main header row ── */}
      <div
        className="flex h-14 w-full items-center justify-between px-3 sm:px-5 md:h-[72px]"
      >
        {/* ── LEFT — Logo + Document name ── */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Mobile: sidebar hamburger */}
          <button
            type="button"
            onClick={onSidebarToggle}
            className="flex lg:hidden size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>

          {/* Evident logo + wordmark */}
          <a href="/" className="flex shrink-0 items-center gap-2">
            <img
              src={logo}
              alt="Evident logo"
              className={`h-8 w-auto max-w-[32px] object-contain ${!isDark ? 'invert hue-rotate-180' : ''}`}
            />
            <span className="hidden text-sm font-semibold tracking-tight text-foreground xs:block sm:text-base">
              Evident
            </span>
          </a>

          {/* Vertical divider */}
          <div className="hidden lg:block h-5 w-px shrink-0 bg-border" />

          {/* Current document name */}
          {showDocSearch && (
            <div className="hidden items-center gap-2.5 min-w-0 lg:flex">
              <FileText className="size-3.5 shrink-0 text-[#ff3d00]" strokeWidth={1.5} />
              <span className="max-w-[220px] truncate font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {documentName}
              </span>
            </div>
          )}
        </div>

        {/* ── CENTER — Search field (desktop only) ── */}
        {showDocSearch && (
          <div className="mx-4 hidden max-w-[400px] flex-1 lg:flex animate-fade-in">
            <div className="flex w-full items-center gap-3 border border-border bg-card px-4 py-2.5 focus-within:border-[#ff3d00]/40 transition-colors">
              <Search
                className="size-3.5 shrink-0 text-muted-foreground"
                strokeWidth={1.5}
              />
              <input
                ref={searchInputRef as React.RefObject<HTMLInputElement>}
                type="text"
                placeholder="Search inside document..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full bg-transparent font-mono text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                aria-label="Search inside document"
              />
              {/* Search navigation for desktop */}
              {searchResultsCount > 0 && (
                <div className="flex items-center gap-1 shrink-0 border-l border-border pl-2 font-mono text-[9px] text-muted-foreground select-none">
                  <span className="mr-1">
                    {activeResultIndex !== null ? activeResultIndex + 1 : 0}/{searchResultsCount}
                  </span>
                  <button
                    type="button"
                    onClick={onPrevResult}
                    className="p-0.5 hover:text-foreground transition-colors cursor-pointer"
                    title="Previous result"
                  >
                    <ChevronDown className="size-3 rotate-180" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={onNextResult}
                    className="p-0.5 hover:text-foreground transition-colors cursor-pointer"
                    title="Next result"
                  >
                    <ChevronDown className="size-3" strokeWidth={2.5} />
                  </button>
                </div>
              )}
              {/* Keyboard hint */}
              <kbd className="hidden shrink-0 items-center gap-0.5 border border-border bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/50 sm:flex">
                Ctrl+F
              </kbd>
            </div>
          </div>
        )}

        {/* ── RIGHT — Actions + Profile ── */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile: search icon — toggles inline search bar below */}
          {showDocSearch && (
            <button
              type="button"
              onClick={() => setMobileSearchOpen((o) => !o)}
              className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors lg:hidden"
              aria-label="Toggle search"
            >
              {mobileSearchOpen ? (
                <X className="size-4" strokeWidth={1.5} />
              ) : (
                <Search className="size-4" strokeWidth={1.5} />
              )}
            </button>
          )}

          {/* AI copilot toggle — desktop only (mobile uses bottom tab bar) */}
          {showDocSearch && (
            <button
              type="button"
              onClick={onCopilotToggle}
              className="hidden lg:flex size-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle AI copilot"
            >
              <MessageSquare className="size-4" strokeWidth={1.5} />
            </button>
          )}

          {/* Insights toggle — desktop only (mobile uses bottom tab bar) */}
          {showDocSearch && (
            <button
              type="button"
              onClick={onInsightsToggle}
              className="hidden lg:flex size-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle insights panel"
            >
              <BarChart3 className="size-4" strokeWidth={1.5} />
            </button>
          )}

          {/* Vertical divider (desktop only) */}
          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="size-4" strokeWidth={1.5} />
            ) : (
              <Moon className="size-4" strokeWidth={1.5} />
            )}
          </button>

          {/* Vertical divider */}
          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

          {/* User profile / Sign In button */}
          {!user ? (
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="flex items-center gap-1.5 border border-[#ff3d00]/30 bg-[#ff3d00]/10 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-[#ff3d00] hover:bg-[#ff3d00]/20 hover:border-[#ff3d00] transition-all rounded-sm font-semibold sm:px-3.5 cursor-pointer"
            >
              Sign In
            </button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-75 text-left animate-fade-in cursor-pointer"
                  aria-label="User profile"
                >
                  {/* Avatar circle */}
                  <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full bg-[#ff3d00] font-mono text-[10px] font-bold text-[#0a0a0a]">
                    {user.initials}
                  </div>

                  {/* Name + email (desktop only) */}
                  <div className="hidden flex-col items-start lg:flex">
                    <span className="text-[11px] font-semibold leading-tight text-foreground">
                      {user.name}
                    </span>
                    <span className="font-mono text-[9px] leading-tight text-muted-foreground">
                      {user.email}
                    </span>
                  </div>

                  <ChevronDown
                    className="hidden size-3 text-muted-foreground lg:block"
                    strokeWidth={1.5}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground border border-border p-1 rounded-md shadow-md z-50 animate-fade-in">
                <div className="border-b border-border/60 px-2.5 py-2">
                  <p className="text-[10px] font-semibold text-foreground truncate">{user.name}</p>
                  <p className="font-mono mt-0.5 text-[8px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer font-mono text-[9px] uppercase tracking-wider focus:bg-accent focus:text-accent-foreground rounded-sm px-2 py-1.5">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/documents")} className="cursor-pointer font-mono text-[9px] uppercase tracking-wider focus:bg-accent focus:text-accent-foreground rounded-sm px-2 py-1.5">
                  Documents
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/exports")} className="cursor-pointer font-mono text-[9px] uppercase tracking-wider focus:bg-accent focus:text-accent-foreground rounded-sm px-2 py-1.5">
                  Exports
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer font-mono text-[9px] uppercase tracking-wider focus:bg-accent focus:text-accent-foreground rounded-sm px-2 py-1.5">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/60 my-1" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer font-mono text-[9px] uppercase tracking-wider focus:bg-accent focus:text-accent-foreground rounded-sm px-2 py-1.5 text-[#ff3d00] hover:text-[#ff3d00]">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── Mobile search bar (slides in below header) ── */}
      {showDocSearch && mobileSearchOpen && (
        <div className="flex items-center gap-3 border-t border-border bg-background px-4 py-2.5 lg:hidden animate-fade-in">
          <Search className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search inside document..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent font-mono text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            aria-label="Search inside document (mobile)"
          />
          {searchResultsCount > 0 && (
            <div className="flex items-center gap-1 shrink-0 font-mono text-[9px] text-muted-foreground select-none">
              <span className="mr-1">
                {activeResultIndex !== null ? activeResultIndex + 1 : 0}/{searchResultsCount}
              </span>
              <button
                type="button"
                onClick={onPrevResult}
                className="p-0.5 hover:text-foreground transition-colors cursor-pointer"
                title="Previous result"
              >
                <ChevronDown className="size-3 rotate-180" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={onNextResult}
                className="p-0.5 hover:text-foreground transition-colors cursor-pointer"
                title="Next result"
              >
                <ChevronDown className="size-3" strokeWidth={2.5} />
              </button>
            </div>
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              className="text-muted-foreground hover:text-foreground animate-fade-in"
            >
              <X className="size-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
