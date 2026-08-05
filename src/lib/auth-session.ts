import { ACCESS_TOKEN_KEY } from "@/lib/constants"

const storage = typeof localStorage === "undefined" ? null : localStorage

let accessToken: string | null = storage?.getItem(ACCESS_TOKEN_KEY) ?? null
let authExpiredHandler: (() => void) | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function registerAuthExpiredHandler(handler: () => void): () => void {
  authExpiredHandler = handler

  return () => {
    if (authExpiredHandler === handler) {
      authExpiredHandler = null
    }
  }
}

export function setAccessToken(access: string): void {
  accessToken = access
  storage?.setItem(ACCESS_TOKEN_KEY, access)
}

export function clearAccessToken(): void {
  accessToken = null
  storage?.removeItem(ACCESS_TOKEN_KEY)
}

export function isAccessTokenExpired(
  token: string | null = accessToken,
): boolean {
  if (!token) return true

  try {
    const [, payload] = token.split(".")
    if (!payload) return false

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    )
    const decodedPayload = JSON.parse(atob(paddedPayload)) as { exp?: unknown }

    if (typeof decodedPayload.exp !== "number") return false

    return decodedPayload.exp * 1000 <= Date.now()
  } catch {
    return false
  }
}

export function expireAuthSession(): void {
  clearAccessToken()
  authExpiredHandler?.()
}
