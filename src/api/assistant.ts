import { api } from "./client"
import { apiErrorFromBody } from "./api-error"
import type { components } from "./schema"

export type AssistantMessage =
  components["schemas"]["AssistantMessageResponseDto"]
export type AssistantSource = components["schemas"]["AssistantSourceDto"]
export type AssistantConversation =
  components["schemas"]["AssistantConversationResponseDto"]
export type AssistantConversationSummary =
  components["schemas"]["AssistantConversationSummaryDto"]
export type AssistantQuestion = components["schemas"]["AskAssistantDto"]

export const assistantApi = {
  async ask(body: AssistantQuestion) {
    const { data, error, response } = await api.POST("/assistant/messages", {
      body,
    })
    if (!data)
      throw apiErrorFromBody(
        error,
        response.status,
        response.status === 429
          ? "Has alcanzado el límite de consultas. Espera un minuto antes de volver a enviar."
          : "No se pudo enviar la pregunta. Revisa tu conexión y el historial antes de volver a enviarla.",
      )
    return data
  },
  async list(signal?: AbortSignal) {
    const { data, error, response } = await api.GET(
      "/assistant/conversations",
      { signal },
    )
    if (!data)
      throw apiErrorFromBody(
        error,
        response.status,
        "No se pudieron cargar tus conversaciones.",
      )
    return data
  },
  async get(id: string, signal?: AbortSignal) {
    const { data, error, response } = await api.GET(
      "/assistant/conversations/{id}",
      { params: { path: { id } }, signal },
    )
    if (!data)
      throw apiErrorFromBody(
        error,
        response.status,
        "No se pudo cargar la conversación.",
      )
    return data
  },
  async remove(id: string) {
    const { error, response } = await api.DELETE(
      "/assistant/conversations/{id}",
      { params: { path: { id } } },
    )
    if (!response.ok)
      throw apiErrorFromBody(
        error,
        response.status,
        "No se pudo eliminar la conversación.",
      )
  },
}
