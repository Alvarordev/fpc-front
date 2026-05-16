export const API_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL ?? "");

export const ACCESS_TOKEN_KEY = "fpc-access-token";
export const REFRESH_TOKEN_KEY = "fpc-refresh-token";
export const AUTH_USER_KEY = "fpc-auth-user";
