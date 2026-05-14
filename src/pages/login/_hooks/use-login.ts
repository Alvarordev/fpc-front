import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import type { LoginRequest } from "@/types";

export function useLogin() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
  });
}
