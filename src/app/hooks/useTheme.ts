import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "evident-theme";

function getInitialTheme(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) return stored === "dark";
  // Default to dark if no preference stored
  return true;
}

function applyTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
}

/**
 * Shared theme hook — reads from and writes to localStorage so
 * theme is consistent across all pages and component re-mounts.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);

  // Apply theme to DOM on mount and whenever isDark changes
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  }, []);

  return { isDark, toggleTheme };
}
