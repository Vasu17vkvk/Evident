import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useSidebar } from "../../context/SidebarContext";
import { DocumentService } from "../../services/document/documentService";
import { useAuth } from "../../context/AuthContext";
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
  LayoutDashboard,
} from "lucide-react";

/* ── Navigation items ─────────────────────────── */
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    count: null,
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    path: "/workspace",
    count: 24,
  },
  {
    id: "recent",
    label: "Recent",
    icon: Clock,
    path: "/recent",
    count: 6,
  },
  {
    id: "favorites",
    label: "Favorites",
    icon: Star,
    path: "/favorites",
    count: 4,
  },
  {
    id: "notes",
    label: "Notes",
    icon: StickyNote,
    path: "/notes",
    count: 11,
  },
];

const BOTTOM_ITEMS = [
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
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
  onSelect,
}: {
  item: (typeof NAV_ITEMS)[number] | (typeof BOTTOM_ITEMS)[number];
  isActive: boolean;
  onSelect?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onSelect}
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
  const [usedBytes, setUsedBytes] = useState(0);

  useEffect(() => {
    const calculateStorage = async () => {
      try {
        const docs = await DocumentService.getAll();
        const totalBytes = docs.reduce((sum, doc) => sum + doc.size, 0);
        setUsedBytes(totalBytes);
      } catch (e) {
        console.error(e);
      }
    };
    calculateStorage();
    window.addEventListener("evident-document-update", calculateStorage);
    return () => window.removeEventListener("evident-document-update", calculateStorage);
  }, []);

  const STORAGE_USED_GB = usedBytes / (1024 * 1024 * 1024);
  const STORAGE_TOTAL_GB = 10;
  const STORAGE_PCT = Math.min(100, (STORAGE_USED_GB / STORAGE_TOTAL_GB) * 100);

  const formatGB = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 0.001) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${gb.toFixed(3)} GB`;
  };

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
        <Link to="/storage" className="text-[13px] font-semibold text-[#fafafa] hover:text-[#ff3d00] transition-colors">
          {formatGB(usedBytes)}
        </Link>
        <span className="font-mono text-[9px] text-[#737373]">
          of {STORAGE_TOTAL_GB} GB
        </span>
      </div>

      {/* Progress bar */}
      <Link to="/storage" className="block mb-4 h-1 w-full overflow-hidden bg-[#1a1a1a]">
        <div
          className="h-full bg-[#ff3d00] transition-all duration-500"
          style={{ width: `${STORAGE_PCT}%` }}
        />
      </Link>

      {/* Remaining note */}
      <p className="mb-4 font-mono text-[9px] text-[#737373]/60">
        {Math.max(0, STORAGE_TOTAL_GB - STORAGE_USED_GB).toFixed(3)} GB remaining
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
  activeId?: string;
}

/* ── Main component ───────────────────────────── */
export function WorkspaceSidebar({ activeId }: Props) {
  const location = useLocation();
  const { isOpen, setOpen } = useSidebar();
  const { user } = useAuth();
  const onClose = () => setOpen(false);
  const handleNavSelect = () => {
    setOpen(false);
  };

  const [counts, setCounts] = useState({
    documents: 0,
    recent: 0,
    favorites: 0,
    notes: 0,
  });

  useEffect(() => {
    const updateCounts = async () => {
      try {
        const docs = await DocumentService.getAll();
        const docCount = docs.length;
        const recentCount = docs.filter((d: any) => !!d.lastOpenedAt).slice(0, 10).length;
        const favCount = docs.filter((d: any) => !!d.favorite).length;

        let notesCount = 0;
        const savedNotes = localStorage.getItem("evident_notes");
        if (savedNotes) {
          notesCount = JSON.parse(savedNotes).length;
        }

        setCounts({
          documents: docCount,
          recent: recentCount,
          favorites: favCount,
          notes: notesCount,
        });
      } catch (e) {
        console.error("Failed to calculate sidebar counts:", e);
      }
    };

    updateCounts();
    window.addEventListener("evident-document-update", updateCounts);
    return () => window.removeEventListener("evident-document-update", updateCounts);
  }, [isOpen]);

  // Close on ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  /* Determine active nav item */
  const getIsActive = (item: { id: string; path: string }) => {
    if (activeId) return item.id === activeId;
    
    // Strict match
    if (location.pathname === item.path) return true;
    
    // Scopes for /workspace matching to Documents
    if (item.id === "documents" && location.pathname.startsWith("/workspace")) return true;
    
    // Settings matches /settings or /account
    if (item.id === "settings" && (location.pathname.startsWith("/settings") || location.pathname.startsWith("/account"))) return true;
    
    // Other items matching by prefix (excluding root/empty paths)
    if (item.path !== "/" && location.pathname.startsWith(item.path)) return true;
    
    return false;
  };

  const dynamicNavItems = NAV_ITEMS.map((item) => ({
    ...item,
    count: item.count === null ? null : (counts[item.id as keyof typeof counts] ?? 0),
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with dark overlay and blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Floating overlay drawer panel */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 left-0 z-[101] flex h-full w-[320px] max-w-[85vw] flex-col border-r border-border bg-background shadow-2xl overflow-hidden"
            aria-label="Workspace sidebar drawer"
          >
            {/* Sidebar header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderOpen className="size-4 text-[#ff3d00] shrink-0" strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground truncate">
                  Workspace
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Main navigation */}
            <nav className="flex-1 overflow-y-auto">
              <div className="px-5 pb-1 pt-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#737373]/40">
                  Navigation
                </p>
              </div>

              {/* Primary nav items */}
              <div className="flex flex-col mt-2">
                {dynamicNavItems.map((item) => (
                  <NavItem key={item.id} item={item} isActive={getIsActive(item)} onSelect={handleNavSelect} />
                ))}
              </div>

              {/* Divider */}
              <div className="mx-5 my-4 h-px bg-[#262626]" />

              {/* Bottom nav items (Settings, etc.) */}
              <div className="flex flex-col">
                {BOTTOM_ITEMS.map((item) => (
                  <NavItem key={item.id} item={item} isActive={getIsActive(item)} onSelect={handleNavSelect} />
                ))}
              </div>
            </nav>

            {/* Storage card (bottom) */}
            <div className="shrink-0 border-t border-[#262626] p-4" onClick={handleNavSelect}>
              <StorageCard />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
