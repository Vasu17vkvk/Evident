import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  // Show a styled, minimal loading spinner during authentication check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-[#ff3d00]" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 animate-pulse">
            Verifying Authentication...
          </span>
        </div>
      </div>
    );
  }

  // Redirect to sign-in page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Render children or nested routes
  return children ? <>{children}</> : <Outlet />;
}
