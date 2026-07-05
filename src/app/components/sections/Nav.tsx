import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { LogOut, User, LayoutDashboard, ChevronDown } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { Container } from "../layout/Container";
import { cn } from "../ui/utils";
import { useAuth } from "../../context/AuthContext";
import logo from "../../../assets/Evident.png";

const NAV_ITEMS = [
  { label: "Features", path: "/#features", isAnchor: true },
  { label: "Pricing", path: "/pricing", isAnchor: false },
  { label: "Docs", path: "/docs", isAnchor: false },
  { label: "Blog", path: "/blog", isAnchor: false },
];

function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-150"
      >
        {/* Avatar initials circle */}
        <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
          {user.initials}
        </span>
        <span className="hidden text-xs font-medium tracking-tight text-foreground sm:block max-w-[100px] truncate">
          {user.name}
        </span>
        <ChevronDown
          className={`size-3 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 border border-border bg-card shadow-lg z-50">
          {/* User info header */}
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
            <p className="font-mono-label mt-0.5 text-[9px] text-muted-foreground truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="size-3.5 text-accent" strokeWidth={1.5} />
              Dashboard
            </Link>
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User className="size-3.5 text-accent" strokeWidth={1.5} />
              My Account
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-border py-1">
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="size-3.5 text-accent" strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Nav() {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <Container className="flex h-14 items-center justify-between md:h-16">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Evident"
            className="h-15 w-auto"
          />
          <span className="text-xl font-semibold tracking-tight text-white">
            Evident
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) =>
            item.isAnchor ? (
              <a
                key={item.label}
                href={item.path}
                className="group relative text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-150 group-hover:scale-x-100" />
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.path}
                className="group relative text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-150 group-hover:scale-x-100" />
              </Link>
            )
          )}
        </div>

        {/* Authenticated vs Guest Nav Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Link
                to="/signin"
                className="hidden text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:text-foreground sm:inline"
              >
                Sign in
              </Link>
              <Link
                to="/signin"
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </Container>
    </nav>
  );
}
