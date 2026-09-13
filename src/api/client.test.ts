import { afterEach, describe, expect, it, vi } from "vitest"

describe("typed API client", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("sends credentials on a typed health request", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000")
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => undefined,
    })

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          info: { database: { status: "up" } },
          error: {},
          details: { database: { status: "up" } },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const { api } = await import("./client")
    const result = await api.GET("/health")

    expect(result.data?.status).toBe("ok")
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      credentials: "include",
    })
  })

  it("adds the bearer token to multipart and binary requests", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000")
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => undefined,
    })
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("content", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { setAccessToken } = await import("@/lib/auth-session")
    const { apiFetch } = await import("./client")
    setAccessToken("test-token")
    await apiFetch("/patients/patient-1/documents/document-1/content")

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/patients/patient-1/documents/document-1/content",
      expect.objectContaining({
        credentials: "include",
        headers: expect.any(Headers),
      }),
    )
    const requestInit = fetchMock.mock.calls[0]?.[1]
    const headers = requestInit?.headers as Headers
    expect(headers.get("Authorization")).toBe("Bearer test-token")
  })

  it("refreshes the access token and retries a 401 request", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000")
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      removeItem: vi.fn(),
      setItem: vi.fn(),
    })

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: "fresh-token" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "ok",
            info: { database: { status: "up" } },
            error: {},
            details: { database: { status: "up" } },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
    vi.stubGlobal("fetch", fetchMock)

    const { setAccessToken, getAccessToken } = await import("@/lib/auth-session")
    const { api } = await import("./client")
    setAccessToken("expired-token")

    const result = await api.GET("/health")

    expect(result.data?.status).toBe("ok")
    expect(getAccessToken()).toBe("fresh-token")
    expect(fetchMock).toHaveBeenCalledTimes(3)

    const retryRequest = fetchMock.mock.calls[2]?.[0] as Request
    expect(retryRequest.headers.get("Authorization")).toBe("Bearer fresh-token")
    expect(retryRequest.headers.get("X-Auth-Retry")).toBe("1")
  })

  it("expires the session when refresh fails after a 401", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000")
    const removeItem = vi.fn()
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      removeItem,
      setItem: vi.fn(),
    })

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("content", { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
    vi.stubGlobal("fetch", fetchMock)

    const { setAccessToken, getAccessToken } = await import("@/lib/auth-session")
    const { apiFetch } = await import("./client")
    setAccessToken("expired-token")

    const response = await apiFetch(
      "/patients/patient-1/documents/document-1/content",
    )

    expect(response.status).toBe(401)
    expect(getAccessToken()).toBeNull()
    expect(removeItem).toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
