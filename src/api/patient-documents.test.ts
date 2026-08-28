import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  apiFetch: vi.fn(),
}))

vi.mock("./client", () => ({
  api: {
    GET: mocks.get,
    POST: mocks.post,
    PATCH: mocks.patch,
  },
  apiFetch: mocks.apiFetch,
}))

describe("patient documents API", () => {
  afterEach(() => vi.resetAllMocks())

  it("sends document metadata and the selected file as multipart form data", async () => {
    const response = {
      id: "document-1",
      documentType: "OTHER",
      originalFileName: "resultado.pdf",
    }
    const file = new File(["%PDF-1.7"], "resultado.pdf", {
      type: "application/pdf",
    })
    mocks.apiFetch.mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const { patientDocumentsApi } = await import("./patient-documents")
    await patientDocumentsApi.create("patient-1", {
      file,
      documentType: "OTHER",
      description: "Resultado de laboratorio",
    })

    const [, init] = mocks.apiFetch.mock.calls[0] as [string, RequestInit]
    const body = init.body as FormData
    expect(mocks.apiFetch).toHaveBeenCalledWith(
      "/patients/patient-1/documents",
      expect.objectContaining({ method: "POST" }),
    )
    expect(body.get("file")).toBe(file)
    expect(body.get("documentType")).toBe("OTHER")
    expect(body.get("description")).toBe("Resultado de laboratorio")
  })

  it("uses the typed client for list and archive operations", async () => {
    const page = { data: [], total: 0, limit: 50, offset: 0 }
    const archived = { id: "document-1", status: "ARCHIVED" }
    mocks.get.mockResolvedValue({ data: page, response: { status: 200 } })
    mocks.patch.mockResolvedValue({
      data: archived,
      response: { status: 200 },
    })

    const { patientDocumentsApi } = await import("./patient-documents")
    await expect(
      patientDocumentsApi.list("patient-1", { includeArchived: true }),
    ).resolves.toBe(page)
    await expect(
      patientDocumentsApi.archive("patient-1", "document-1"),
    ).resolves.toBe(archived)

    expect(mocks.get).toHaveBeenCalledWith(
      "/patients/{patientId}/documents",
      expect.objectContaining({
        params: {
          path: { patientId: "patient-1" },
          query: { includeArchived: true },
        },
      }),
    )
    expect(mocks.patch).toHaveBeenCalledWith(
      "/patients/{patientId}/documents/{documentId}/archive",
      {
        params: { path: { patientId: "patient-1", documentId: "document-1" } },
      },
    )
  })
})
