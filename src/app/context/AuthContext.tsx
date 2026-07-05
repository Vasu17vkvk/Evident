import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AuthUser {
  email: string;
  name: string;
  initials: string;
}

interface AuthContextType {
  user: AuthUser | null;
  signIn: (email: string) => void;
  signOut: () => void;
  updateName: (name: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function deriveNameFromEmail(email: string): { name: string; initials: string } {
  const localPart = email.split("@")[0];
  // Turn something like "john.doe" or "johndoe" into "John Doe"
  const parts = localPart.split(/[._-]/);
  const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  const initials = parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
  return { name, initials };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const signIn = useCallback((email: string) => {
    const { name, initials } = deriveNameFromEmail(email);
    setUser({ email, name, initials });
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const updateName = useCallback((name: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const parts = name.trim().split(/\s+/);
      const initials = parts
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join("");
      return { ...prev, name: name.trim(), initials };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateName, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
