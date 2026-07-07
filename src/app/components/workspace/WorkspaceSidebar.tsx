import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  FileText,
  Clock,
  Star,
  StickyNote,
  Settings,
  ChevronRight,
  X,
  Zap,
  HardDrive,
  FolderOpen,
} from "lucide-react";

/* ── Navigation items ─────────────────────────── */
const NAV_ITEMS = [
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    path: "/dashboard",
    count: 24,
  },
  {
    id: "recent",
    label: "Recent",
    icon: Clock,
    path: "/dashboard?tab=recent",
    count: 6,
  },
  {
    id: "favorites",
    label: "Favorites",
    icon: Star,
    path: "/dashboard?tab=favorites",
    count: 4,
  },
  {
    id: "notes",
    label: "Notes",
    icon: StickyNote,
    path: "/dashboard?tab=notes",
    count: 11,
  },
];

const BOTTOM_ITEMS = [
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/account",
    count: null,
  },
];

/* ── Storage card ─────────────────────────────── */
const STORAGE_USED_GB = 2.4;
const STORAGE_TOTAL_GB = 10;
const STORAGE_PCT = (STORAGE_USED_GB / STORAGE_TOTAL_GB) * 100;

/* ── Nav item component ───────────────────────── */
function NavItem({
  item,
  isActive,
}: {
  item: (typeof NAV_ITEMS)[number] | (typeof BOTTOM_ITEMS)[number];
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      className={`
        group relative flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
        ${
          isActive
            ? "border-l-2 border-l-[#ff3d00] bg-[#ff3d00]/[0.06] text-[#fafafa]"
            : "border-l-2 border-l-transparent text-[#737373] hover:border-l-[#ff3d00]/30 hover:bg-[#ff3d00]/[0.03] hover:text-[#fafafa]"
        }
      `}
    >
      {/* Icon */}
      <Icon
        className={`size-4 shrink-0 transition-colors ${
          isActive ? "text-[#ff3d00]" : "text-[#737373] group-hover:text-[#fafafa]"
        }`}
        strokeWidth={1.5}
      />

      {/* Label */}
      <span
        className={`flex-1 text-[12px] font-medium tracking-tight transition-colors ${
          isActive ? "text-[#fafafa]" : ""
        }`}
      >
        {item.label}
      </span>

      {/* Count badge */}
      {"count" in item && item.count !== null && (
        <span
          className={`font-mono text-[9px] tabular-nums transition-colors ${
            isActive ? "text-[#ff3d00]" : "text-[#737373]/50 group-hover:text-[#737373]"
          }`}
        >
          {item.count}
        </span>
      )}

      {/* Hover arrow */}
      <ChevronRight
        className={`size-3 shrink-0 transition-all duration-150 ${
          isActive
            ? "text-[#ff3d00]/50 opacity-100"
            : "opacity-0 group-hover:opacity-60 text-[#737373]"
        }`}
        strokeWidth={1.5}
      />
    </Link>
  );
}

/* ── Storage card ─────────────────────────────── */
function StorageCard() {
  return (
    <div className="border border-[#262626] bg-[#0f0f0f] p-4">
      {/* Card header */}
      <div className="mb-3 flex items-center gap-2">
        <HardDrive className="size-3.5 text-[#737373]" strokeWidth={1.5} />
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#737373]">
          Storage
        </span>
      </div>

      {/* Usage text */}
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-[#fafafa]">
          {STORAGE_USED_GB} GB
        </span>
        <span className="font-mono text-[9px] text-[#737373]">
          of {STORAGE_TOTAL_GB} GB
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1 w-full overflow-hidden bg-[#1a1a1a]">
        <div
          className="h-full bg-[#ff3d00] transition-all duration-500"
          style={{ width: `${STORAGE_PCT}%` }}
        />
      </div>

      {/* Remaining note */}
      <p className="mb-4 font-mono text-[9px] text-[#737373]/60">
        {(STORAGE_TOTAL_GB - STORAGE_USED_GB).toFixed(1)} GB remaining
      </p>

      {/* Upgrade button */}
      <Link
        to="/pricing"
        className="flex w-full items-center justify-center gap-2 border border-[#ff3d00]/40 bg-[#ff3d00]/10 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#ff3d00] transition-all duration-150 hover:border-[#ff3d00] hover:bg-[#ff3d00]/20"
      >
        <Zap className="size-3" strokeWidth={1.5} />
        Upgrade Plan
      </Link>
    </div>
  );
}

/* ── Props ────────────────────────────────────── */
interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  /** Override active item (defaults to route-based detection) */
  activeId?: string;
}

/* ── Main component ───────────────────────────── */
export function WorkspaceSidebar({ isOpen = true, onClose, activeId }: Props) {
  const location = useLocation();

  /* Determine active nav item */
  const getIsActive = (item: { id: string; path: string }) => {
    if (activeId) return item.id === activeId;
    // Simple path matching — treat /dashboard as "documents"
    if (item.id === "documents" && location.pathname === "/dashboard") return true;
    if (item.id === "settings" && location.pathname.startsWith("/account")) return true;
    return false;
  };

  return (
    <>
      {/* ── Mobile backdrop ─────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/70 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ───────────────────────── */}
      <aside
        className={`
          fixed top-[72px] left-0 z-30 flex h-[calc(100vh-72px)]
          flex-col border-r border-border bg-background
          transition-all duration-200 ease-in-out
          ${isOpen ? "translate-x-0 w-[260px] opacity-100" : "-translate-x-full w-0 opacity-0 border-none overflow-hidden"}
          lg:relative lg:top-0 lg:z-auto lg:h-full lg:shrink-0
        `}
        aria-label="Workspace sidebar"
      >
        {/* ── Sidebar header ─────────────────────── */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="size-4 text-[#ff3d00]" strokeWidth={1.5} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">
              Workspace
            </span>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Main navigation ────────────────────── */}
        <nav className="flex-1 overflow-y-auto">
          {/* Top section label */}
          <div className="px-5 pb-1 pt-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#737373]/40">
              Navigation
            </p>
          </div>

          {/* Primary nav items */}
          <div className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.id} item={item} isActive={getIsActive(item)} />
            ))}
          </div>

          {/* Divider */}
          <div className="mx-5 my-4 h-px bg-[#262626]" />

          {/* Bottom nav items (Settings, etc.) */}
          <div className="flex flex-col">
            {BOTTOM_ITEMS.map((item) => (
              <NavItem key={item.id} item={item} isActive={getIsActive(item)} />
            ))}
          </div>
        </nav>

        {/* ── Storage card (bottom) ──────────────── */}
        <div className="shrink-0 border-t border-[#262626] p-4">
          <StorageCard />
        </div>
      </aside>
    </>
  );
}
