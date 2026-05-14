import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // Not authenticated → redirect to login
  if (!user) {
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
