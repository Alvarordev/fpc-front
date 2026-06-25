import { API_URL, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/constants";

let accessToken: string | null = localStorage.getItem(ACCESS_TOKEN_KEY);
let authExpiredHandler: (() => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function registerAuthExpiredHandler(handler: () => void): () => void {
  authExpiredHandler = handler;

  return () => {
    if (authExpiredHandler === handler) {
      authExpiredHandler = null;
    }
  };
}

export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  accessToken = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAccessTokenExpired(token: string | null = accessToken): boolean {
  if (!token) return true;

  try {
    const [, payload] = token.split(".");
    if (!payload) return false;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const decodedPayload = JSON.parse(atob(paddedPayload)) as { exp?: unknown };

    if (typeof decodedPayload.exp !== "number") return false;

    return decodedPayload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

function expireAuthSession(): void {
  clearTokens();
  authExpiredHandler?.();
}

// ============================================================
// Token refresh
// ============================================================

// Intentionally disabled for now: when the access token expires, the user must
// be logged out instead of silently refreshing the session.

// ============================================================
// Base fetch wrapper
// ============================================================

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean; // default: true (requires JWT)
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (auth && isAccessTokenExpired()) {
    expireAuthSession();
    throw new ApiError(401, { message: "Session expired" });
  }

  if (auth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    ...rest,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, fetchOptions);

  if (auth && res.status === 401) {
    expireAuthSession();
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorBody);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ============================================================
// ApiError
// ============================================================

export class ApiError extends Error {
  readonly status: number;
  readonly body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    const message =
      typeof body?.message === "string"
        ? body.message
        : `Request failed with status ${status}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// ============================================================
// Convenience HTTP methods
// ============================================================

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "POST", body });
}

export function apiPut<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "PUT", body });
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return apiFetch<T>(path, { ...options, method: "PATCH", body });
}

export function apiDelete(path: string, options?: RequestOptions): Promise<void> {
  return apiFetch<void>(path, { ...options, method: "DELETE" });
}
