import { apiPost } from "@/lib/api-client";
import type { LoginRequest, LoginResponse, RefreshRequest } from "@/types";
import { setTokens } from "@/lib/api-client";

export const authApi = {
  /**
   * POST /auth/login — Public
   * Authenticate and receive JWT tokens.
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await apiPost<LoginResponse>("/auth/login", data, {
      auth: false,
    });
    setTokens(res.accessToken, res.refreshToken);
    return res;
  },

  /**
   * POST /auth/refresh — Public
   * Refresh an expired access token.
   */
  async refresh(data: RefreshRequest): Promise<LoginResponse> {
    const res = await apiPost<LoginResponse>("/auth/refresh", data, {
      auth: false,
    });
    setTokens(res.accessToken, res.refreshToken);
    return res;
  },
};
