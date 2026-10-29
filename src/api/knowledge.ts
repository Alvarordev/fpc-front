import { api, apiFetch } from "./client"
import { apiErrorFromBody } from "./api-error"
import type { components } from "./schema"

export type KnowledgeDocument =
  components["schemas"]["KnowledgeDocumentResponseDto"]
export type KnowledgeStatus = KnowledgeDocument["status"]

export const knowledgeApi = {
  async list(
    query: {
      search?: string
      status?: KnowledgeStatus
      limit?: number
      offset?: number
    },
    signal?: AbortSignal,
  ) {
    const { data, error, response } = await api.GET("/knowledge/documents", {
      params: { query },
      signal,
    })
    if (!data)
      throw apiErrorFromBody(
        error,
        response.status,
        "No se pudo cargar la biblioteca del programa.",
      )
    return data
  },
  async status(signal?: AbortSignal) {
    const { data, error, response } = await api.GET("/knowledge/status", {
      signal,
    })
    if (!data)
      throw apiErrorFromBody(
        error,
        response.status,
        "No se pudo consultar el estado de la biblioteca.",
      )
    return data
  },
  async upload(input: { title: string; version: string; file: File }) {
    const body = new FormData()
    body.append("title", input.title)
    body.append("version", input.version)
    body.append("file", input.file)
    const response = await apiFetch("/knowledge/documents", {
      method: "POST",
      body,
    })
    if (!response.ok)
      throw apiErrorFromBody(
        await response.json().catch(() => null),
        response.status,
        "No se pudo subir el documento.",
      )
    return (await response.json()) as KnowledgeDocument
  },
  async publish(id: string) {
    const { data, error, response } = await api.POST(
      "/knowledge/documents/{id}/publish",
      { params: { path: { id } } },
    )
    if (!data)
      throw apiErrorFromBody(
        error,
        response.status,
        "No se pudo publicar el documento.",
      )
    return data
  },
  async archive(id: string) {
    const { data, error, response } = await api.POST(
      "/knowledge/documents/{id}/archive",
      { params: { path: { id } } },
    )
    if (!data)
      throw apiErrorFromBody(
        error,
        response.status,
        "No se pudo retirar el documento.",
      )
    return data
  },
  async retry(id: string) {
    const { data, error, response } = await api.POST(
      "/knowledge/documents/{id}/retry",
      { params: { path: { id } } },
    )
    if (!data)
      throw apiErrorFromBody(
        error,
        response.status,
        "No se pudo reintentar la preparación.",
      )
    return data
  },
  async remove(id: string) {
    const { error, response } = await api.DELETE("/knowledge/documents/{id}", {
      params: { path: { id } },
    })
    if (!response.ok)
      throw apiErrorFromBody(
        error,
        response.status,
        "No se pudo eliminar el documento.",
      )
  },
  async content(id: string) {
    const response = await apiFetch(
      `/knowledge/documents/${encodeURIComponent(id)}/content`,
    )
    if (!response.ok)
      throw apiErrorFromBody(
        await response.json().catch(() => null),
        response.status,
        "No se pudo abrir el documento. Puede que ya no esté disponible.",
      )
    return response.blob()
  },
}

export async function openKnowledgeDocument(
  id: string,
  fileName: string,
  page?: number | null,
) {
  const blob = await knowledgeApi.content(id)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = page ? `${url}#page=${page}` : url
  anchor.download = fileName
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
