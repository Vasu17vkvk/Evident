import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { LogOut, User, LayoutDashboard, ChevronDown, Sun, Moon, Menu, X } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { Container } from "../layout/Container";
import { cn } from "../ui/utils";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
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
  const { isAuthenticated, user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <Container className="flex h-14 items-center justify-between md:h-16">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Evident"
            className="h-15 w-auto"
          />
          <span className="text-xl font-semibold tracking-tight text-foreground">
            Evident
          </span>
        </Link>

        {/* Desktop nav links */}
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
        <div className="flex items-center gap-3">
          {/* Theme switcher button */}
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

          {/* Desktop: Auth actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:text-foreground"
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

          {/* Mobile: Hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
          </button>
        </div>
      </Container>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
          <div className="flex flex-col px-4 py-4 gap-1">
            {NAV_ITEMS.map((item) =>
              item.isAnchor ? (
                <a
                  key={item.label}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  className="px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              )
            )}

            {/* Mobile auth section */}
            <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-foreground">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground">{user.email}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    <LayoutDashboard className="size-4 text-accent" strokeWidth={1.5} />
                    Dashboard
                  </Link>
                  <Link
                    to="/account"
                    className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    <User className="size-4 text-accent" strokeWidth={1.5} />
                    My Account
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); signOut(); }}
                    className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors text-left"
                  >
                    <LogOut className="size-4 text-accent" strokeWidth={1.5} />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors text-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signin"
                    className={cn(buttonVariants({ variant: "default" }), "w-full justify-center")}
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
