import createClient from "openapi-fetch"
import { getAccessToken } from "@/lib/api-client"
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
})
