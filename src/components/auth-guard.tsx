import { Navigate, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { getAccessToken, isAccessTokenExpired } from "@/lib/api-client"
import { useAuthStore } from "@/store/auth-store"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const restoreSession = useAuthStore((s) => s.restoreSession)
  const location = useLocation()
  const needsSessionRestore =
    user === null || isAccessTokenExpired(getAccessToken())

  useEffect(() => {
    if (needsSessionRestore) {
      void restoreSession()
    }
  }, [needsSessionRestore, restoreSession])

  if (isLoading || (needsSessionRestore && user)) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return null
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
