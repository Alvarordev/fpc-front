import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/types";

interface RoleGuardProps {
  /** Roles that are ALLOWED to access this route. If empty, no restriction. */
  allowedRoles: UserRole[];
  /** Where to redirect if the role is not allowed */
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * Route-level role protection.
 *
 * Redirects the user if their role is not in the allowed list.
 * For VOLUNTEER users, the default redirect is `/agenda`.
 * For other users, the default redirect is `/`.
 */
export function RoleGuard({
  allowedRoles,
  redirectTo,
  children,
}: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    // Should not happen if wrapped inside AuthGuard, but handle gracefully
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const fallback = user.role === "VOLUNTEER" ? "/agenda" : "/";
    return <Navigate to={redirectTo ?? fallback} replace />;
  }

  return <>{children}</>;
}
