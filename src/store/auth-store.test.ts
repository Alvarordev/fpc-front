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
    removeItem: (key) => {
      values.delete(key)
    },
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

describe("auth store session restore", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("refreshes silently without fetching /users/me when a user is already present", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000")
    vi.stubGlobal("localStorage", createStorage())

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "silent-token" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const { useAuthStore } = await import("./auth-store")
    const { getAccessToken } = await import("@/lib/auth-session")

    useAuthStore.setState({
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      },
      isLoading: false,
    })

    const loadingDuringRefresh: boolean[] = []
    const unsubscribe = useAuthStore.subscribe((state) => {
      loadingDuringRefresh.push(state.isLoading)
    })

    await useAuthStore.getState().restoreSession()
    unsubscribe()

    expect(useAuthStore.getState().isLoading).toBe(false)
    expect(useAuthStore.getState().user?.email).toBe("admin@example.com")
    expect(getAccessToken()).toBe("silent-token")
    expect(loadingDuringRefresh.every((value) => value === false)).toBe(true)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:3000/auth/refresh",
    )
  })

  it("clears the session when boot refresh has no cookie", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000")
    vi.stubGlobal("localStorage", createStorage())

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal("fetch", fetchMock)

    const { useAuthStore } = await import("./auth-store")
    const { getAccessToken, setAccessToken } = await import("@/lib/auth-session")
    setAccessToken("stale-token")

    await useAuthStore.getState().restoreSession()

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isLoading).toBe(false)
    expect(getAccessToken()).toBeNull()
  })
})
