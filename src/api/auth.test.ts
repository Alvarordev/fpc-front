import { afterEach, describe, expect, it, vi } from "vitest"

function createStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

describe("authentication API", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("restores the access token from the refresh cookie and sends it to /users/me", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000")
    vi.stubGlobal("localStorage", createStorage())

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: "restored-access-token" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "admin-id",
            email: "admin@example.com",
            role: "ADMIN",
            isActive: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
    vi.stubGlobal("fetch", fetchMock)

    const { authApi } = await import("./auth")
    const user = await authApi.restoreSession()

    expect(user.email).toBe("admin@example.com")
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:3000/auth/refresh")
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      credentials: "include",
    })

    const userRequest = fetchMock.mock.calls[1]?.[0] as Request
    expect(userRequest.headers.get("Authorization")).toBe(
      "Bearer restored-access-token",
    )
  })

  it("reuses a single in-flight refresh request", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000")
    vi.stubGlobal("localStorage", createStorage())

    let resolveRefresh: ((value: Response) => void) | undefined
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveRefresh = resolve
        }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const { refreshAccessToken } = await import("@/lib/auth-session")
    const first = refreshAccessToken()
    const second = refreshAccessToken()

    expect(fetchMock).toHaveBeenCalledOnce()
    resolveRefresh?.(
      new Response(JSON.stringify({ accessToken: "shared-token" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await expect(first).resolves.toBe("shared-token")
    await expect(second).resolves.toBe("shared-token")
  })
})
