import { create } from "zustand"
import { authApi } from "@/api/auth"
import { clearAccessToken, registerAuthExpiredHandler } from "@/lib/api-client"
import type { LoginRequest, User } from "@/types"

interface AuthState {
  user: User | null
  isLoading: boolean

  login: (credentials: LoginRequest) => Promise<User>
  restoreSession: () => Promise<void>
  logout: () => Promise<void>
  clearSession: () => void
  setUser: (user: User) => void

  isAuthenticated: () => boolean
  isAdmin: () => boolean
  isAgent: () => boolean
  isVolunteer: () => boolean
}

let restoreSessionPromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: true,

  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const user = await authApi.login(credentials)
      set({ user, isLoading: false })
      return user
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  restoreSession: () => {
    if (restoreSessionPromise) {
      return restoreSessionPromise
    }

    set({ isLoading: true })
    restoreSessionPromise = authApi
      .restoreSession()
      .then((user) => set({ user }))
      .catch(() => {
        clearAccessToken()
        set({ user: null })
      })
      .finally(() => {
        set({ isLoading: false })
        restoreSessionPromise = null
      })

    return restoreSessionPromise
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // Clear local state even if the server is unreachable.
    } finally {
      get().clearSession()
    }
  },

  clearSession: () => {
    clearAccessToken()
    set({ user: null, isLoading: false })
  },

  setUser: (user) => set({ user }),

  isAuthenticated: () => get().user !== null,
  isAdmin: () => get().user?.role === "ADMIN",
  isAgent: () => get().user?.role === "AGENT",
  isVolunteer: () => get().user?.role === "VOLUNTEER",
}))

registerAuthExpiredHandler(() => {
  useAuthStore.getState().clearSession()
})
