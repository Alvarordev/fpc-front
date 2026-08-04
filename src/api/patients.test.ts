import { afterEach, describe, expect, it, vi } from "vitest"

describe("patients API", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("requests the typed patient catalogue with filters", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000")
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => undefined,
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [],
          total: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const { patientsApi } = await import("./patients")
    const result = await patientsApi.list({ search: "Ana", limit: 20 })

    expect(result).toEqual({ data: [], total: 0 })
    const request = fetchMock.mock.calls[0]?.[0] as Request
    expect(request.url).toBe("http://localhost:3000/patients?search=Ana&limit=20")
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: "include" })
  })
})
