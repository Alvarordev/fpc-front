import createClient from "openapi-fetch"
import {
  expireAuthSession,
  getAccessToken,
  refreshAccessToken,
} from "@/lib/auth-session"
import type { paths } from "./schema"

export const AUTH_RETRY_HEADER = "X-Auth-Retry"

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL,
  fetch: (request) =>
    fetch(request, {
      credentials: "include",
    }),
})

function isAuthPath(pathOrUrl: string): boolean {
  try {
    return new URL(pathOrUrl, "http://local.invalid").pathname.includes(
      "/auth/",
    )
  } catch {
    return pathOrUrl.includes("/auth/")
  }
}

function withAccessToken(headers: Headers): Headers {
  const next = new Headers(headers)
  const accessToken = getAccessToken()

  if (accessToken) {
    next.set("Authorization", `Bearer ${accessToken}`)
  } else {
    next.delete("Authorization")
  }

  return next
}

async function recoverFromUnauthorized(
  request: Request,
): Promise<Response | null> {
  if (isAuthPath(request.url)) {
    return null
  }

  if (request.headers.get(AUTH_RETRY_HEADER) === "1") {
    expireAuthSession()
    return null
  }

  try {
    const failedAuthorization = request.headers.get("Authorization")
    const currentToken = getAccessToken()

    if (!currentToken || `Bearer ${currentToken}` === failedAuthorization) {
      await refreshAccessToken()
    }
  } catch {
    expireAuthSession()
    return null
  }

  const headers = withAccessToken(request.headers)
  headers.set(AUTH_RETRY_HEADER, "1")

  const retryResponse = await fetch(new Request(request, { headers }), {
    credentials: "include",
  })

  if (retryResponse.status === 401) {
    expireAuthSession()
  }

  return retryResponse
}

api.use({
  onRequest({ request }) {
    const accessToken = getAccessToken()

    if (!accessToken) {
      return
    }

    const headers = withAccessToken(request.headers)
    return new Request(request, { headers })
  },
  async onResponse({ request, response }) {
    if (response.status !== 401) {
      return response
    }

    const retried = await recoverFromUnauthorized(request)
    return retried ?? response
  },
})

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? ""
  const headers = withAccessToken(new Headers(init.headers))

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers,
  })

  if (response.status !== 401 || isAuthPath(path)) {
    return response
  }

  const retried = await recoverFromUnauthorized(
    new Request(`${baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers,
    }),
  )

  return retried ?? response
}
