import { afterEach, describe, expect, it, vi } from "vitest"

describe("follow-ups API", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("updates a closed follow-up status and notes", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000")
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => undefined,
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "follow-up-1",
          status: "COMPLETED",
          notes: "Respondió por WhatsApp y enviará la receta.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const { followUpsApi } = await import("./follow-ups")
    const result = await followUpsApi.update("follow-up-1", {
      status: "COMPLETED",
      notes: "Respondió por WhatsApp y enviará la receta.",
    })

    expect(result).toMatchObject({
      id: "follow-up-1",
      status: "COMPLETED",
    })
    const request = fetchMock.mock.calls[0]?.[0] as Request
    expect(request.url).toBe("http://localhost:3000/follow-ups/follow-up-1")
    expect(request.method).toBe("PATCH")
    expect(await request.json()).toEqual({
      status: "COMPLETED",
      notes: "Respondió por WhatsApp y enviará la receta.",
    })
  })
})
