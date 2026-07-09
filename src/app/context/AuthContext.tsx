import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { AuthService, EvidentUser } from "../services/auth/AuthService";
import { AnonymousSessionService } from "../services/auth/AnonymousSessionService";

interface AuthContextType {
  user: EvidentUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;

  // Migration banner
  showMigrationBanner: boolean;
  pendingMigrationCount: number;
  dismissMigrationBanner: () => void;

  // Backward compatibility mock aliases for existing components
  signIn: (email: string) => void;
  updateName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EvidentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [pendingMigrationCount, setPendingMigrationCount] = useState(0);

  // Sync auth state live with Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((evtUser) => {
      setUser(evtUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Check for pending migration whenever user becomes authenticated
  useEffect(() => {
    if (user && AnonymousSessionService.hasPendingMigration()) {
      const count = AnonymousSessionService.getMigrationQueue().length;
      setPendingMigrationCount(count);
      setShowMigrationBanner(true);
    }
  }, [user]);

  /** Triggers migration check after sign-in resolves */
  const checkMigration = useCallback((u: EvidentUser) => {
    if (AnonymousSessionService.hasPendingMigration()) {
      const count = AnonymousSessionService.getMigrationQueue().length;
      setPendingMigrationCount(count);
      setShowMigrationBanner(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const u = await AuthService.signInWithEmail(email, password);
      setUser(u);
      checkMigration(u);
    } finally {
      setLoading(false);
    }
  }, [checkMigration]);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const u = await AuthService.signUpWithEmail(email, password);
      setUser(u);
      checkMigration(u);
    } finally {
      setLoading(false);
    }
  }, [checkMigration]);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const u = await AuthService.signInWithGoogle();
      setUser(u);
      checkMigration(u);
    } finally {
      setLoading(false);
    }
  }, [checkMigration]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
      setShowMigrationBanner(false);
      setPendingMigrationCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const u = AuthService.getCurrentUser();
    setUser(u);
  }, []);

  const dismissMigrationBanner = useCallback(() => {
    setShowMigrationBanner(false);
    setPendingMigrationCount(0);
  }, []);

  // Backward compatibility implementations (temporary mock fallback wrappers)
  const signIn = useCallback((email: string) => {
    const localPart = email.split("@")[0];
    const parts = localPart.split(/[._-]/);
    const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    const initials = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("");
    const mockUser: EvidentUser = {
      uid: "mock-uid",
      email,
      name,
      initials,
      photoURL: null,
    };
    setUser(mockUser);
    checkMigration(mockUser);
  }, [checkMigration]);

  const updateName = useCallback((name: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const parts = name.trim().split(/\s+/);
      const initials = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("");
      return { ...prev, name: name.trim(), initials };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        refresh,
        loginWithGoogle,
        showMigrationBanner,
        pendingMigrationCount,
        dismissMigrationBanner,
        signIn,
        updateName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
