/**
 * API base URL.
 *
 * Development: always "" (same origin — Vite proxy handles routing).
 * Production: use VITE_API_URL if set, otherwise "" (for same-origin deploys).
 */
export const API_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL ?? "");

export const ACCESS_TOKEN_KEY = "fpc-access-token";
export const REFRESH_TOKEN_KEY = "fpc-refresh-token";
export const AUTH_USER_KEY = "fpc-auth-user";
