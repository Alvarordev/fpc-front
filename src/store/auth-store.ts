import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/api/auth";
import { clearTokens, registerAuthExpiredHandler } from "@/lib/api-client";
import { AUTH_USER_KEY } from "@/lib/constants";
import type { User, LoginRequest } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;

  // Computed
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isAgent: () => boolean;
  isVolunteer: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(credentials);
          // tokens are already stored by authApi.login → setTokens()
          set({ user: res.user, isLoading: false });
          return res.user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        clearTokens();
        set({ user: null });
      },

      setUser: (user) => set({ user }),

      isAuthenticated: () => get().user !== null,
      isAdmin: () => get().user?.role === "ADMIN",
      isAgent: () => get().user?.role === "AGENT",
      isVolunteer: () => get().user?.role === "VOLUNTEER",
    }),
    {
      name: AUTH_USER_KEY,
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

registerAuthExpiredHandler(() => {
  useAuthStore.getState().logout();
});
