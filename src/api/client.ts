import createClient from "openapi-fetch"
import { expireAuthSession, getAccessToken } from "@/lib/auth-session"
import type { paths } from "./schema"

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL,
  fetch: (request) =>
    fetch(request, {
      credentials: "include",
    }),
})

api.use({
  onRequest({ request }) {
    const accessToken = getAccessToken()

    if (!accessToken) {
      return
    }

    const headers = new Headers(request.headers)
    headers.set("Authorization", `Bearer ${accessToken}`)

    return new Request(request, { headers })
  },
  onResponse({ request, response }) {
    // /auth/* handles its own error states (invalid credentials, failed refresh).
    if (
      response.status === 401 &&
      !new URL(request.url).pathname.startsWith("/auth/")
    ) {
      expireAuthSession()
    }

    return response
  },
})

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? ""
  const headers = new Headers(init.headers)
  const accessToken = getAccessToken()

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers,
  })

  if (response.status === 401 && !path.startsWith("/auth/")) {
    expireAuthSession()
  }

  return response
}
