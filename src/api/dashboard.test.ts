import { afterEach, describe, expect, it, vi } from "vitest"

describe("dashboard API", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("requests the typed monthly dashboard in Lima time", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000")
    vi.stubGlobal("localStorage", { getItem: () => null, removeItem: () => undefined, setItem: () => undefined })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      meta: { period: "month", year: 2026, month: 8, timezone: "America/Lima", startsAt: "2026-08-01T05:00:00.000Z", endsAt: "2026-09-01T05:00:00.000Z" },
      summary: { enrollmentEvents: 0, cohortPatients: 0, activePatients: 0, inactivePatients: 0, deceasedPatients: 0, dropoutPatients: 0, sessions: 0, completedSessions: 0, completionRate: 0 },
      distributions: { gender: [], diagnoses: [], treatments: [], cancerStages: [] }, trend: [], hospitals: [], regions: [],
    }), { status: 200, headers: { "Content-Type": "application/json" } }))
    vi.stubGlobal("fetch", fetchMock)

    const { dashboardApi } = await import("./dashboard")
    await dashboardApi.get({ period: "month", year: 2026, month: 8, timezone: "America/Lima" })

    const request = fetchMock.mock.calls[0]?.[0] as Request
    expect(request.url).toBe("http://localhost:3000/dashboard?period=month&year=2026&month=8&timezone=America%2FLima")
  })
})
