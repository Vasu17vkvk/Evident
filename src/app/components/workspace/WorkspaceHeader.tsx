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
import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import logo from "../../../assets/Evident.png";

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
}

export function WorkspaceHeader({
  documentName = "Q4 Financial Report.pdf",
  searchQuery = "",
  onSearchChange,
  onSidebarToggle,
  onCopilotToggle,
  onInsightsToggle,
}: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="flex shrink-0 flex-col border-b border-border bg-background">
      {/* ── Main header row ── */}
      <div
        className="flex h-14 w-full items-center justify-between px-3 sm:px-5 md:h-[72px]"
      >
        {/* ── LEFT — Logo + Document name ── */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          {/* Mobile: sidebar hamburger */}
          <button
            type="button"
            onClick={onSidebarToggle}
            className="flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>

          {/* Evident logo + wordmark */}
          <a href="/" className="flex shrink-0 items-center gap-2">
            <img
              src={logo}
              alt="Evident logo"
              className="h-8 w-auto max-w-[32px] object-contain"
            />
            <span className="hidden text-sm font-semibold tracking-tight text-foreground xs:block sm:text-base">
              Evident
            </span>
          </a>

          {/* Vertical divider */}
          <div className="hidden h-5 w-px shrink-0 bg-border lg:block" />

          {/* Current document name */}
          <div className="hidden items-center gap-2.5 min-w-0 lg:flex">
            <FileText className="size-3.5 shrink-0 text-[#ff3d00]" strokeWidth={1.5} />
            <span className="max-w-[220px] truncate font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {documentName}
            </span>
          </div>
        </div>

        {/* ── CENTER — Search field (desktop only) ── */}
        <div className="mx-4 hidden max-w-[400px] flex-1 lg:flex">
          <div className="flex w-full items-center gap-3 border border-border bg-card px-4 py-2.5 focus-within:border-[#ff3d00]/40 transition-colors">
            <Search
              className="size-3.5 shrink-0 text-muted-foreground"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Search inside document..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full bg-transparent font-mono text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              aria-label="Search inside document"
            />
            {/* Keyboard hint */}
            <kbd className="hidden shrink-0 items-center gap-0.5 border border-border bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/50 sm:flex">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* ── RIGHT — Actions + Profile ── */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile: search icon — toggles inline search bar below */}
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

          {/* AI copilot toggle — desktop only (mobile uses bottom tab bar) */}
          <button
            type="button"
            onClick={onCopilotToggle}
            className="hidden lg:flex size-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle AI copilot"
          >
            <MessageSquare className="size-4" strokeWidth={1.5} />
          </button>

          {/* Insights toggle — desktop only (mobile uses bottom tab bar) */}
          <button
            type="button"
            onClick={onInsightsToggle}
            className="hidden lg:flex size-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle insights panel"
          >
            <BarChart3 className="size-4" strokeWidth={1.5} />
          </button>

          {/* Vertical divider (desktop only) */}
          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
              className="flex items-center gap-1.5 border border-[#ff3d00]/30 bg-[#ff3d00]/10 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-[#ff3d00] hover:bg-[#ff3d00]/20 hover:border-[#ff3d00] transition-all rounded-sm font-semibold sm:px-3.5"
            >
              Sign In
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/account")}
              className="flex items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-75 text-left animate-fade-in"
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
          )}
        </div>
      </div>

      {/* ── Mobile search bar (slides in below header) ── */}
      {mobileSearchOpen && (
        <div className="flex items-center gap-3 border-t border-border bg-background px-4 py-2.5 lg:hidden">
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
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
