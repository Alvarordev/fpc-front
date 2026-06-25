import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getAccessToken, isAccessTokenExpired } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const isSessionExpired = user !== null && isAccessTokenExpired(getAccessToken());

  useEffect(() => {
    if (isSessionExpired) {
      logout();
    }
  }, [isSessionExpired, logout]);

  // Not authenticated → redirect to login
  if (!user || isSessionExpired) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  // Already authenticated → redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
