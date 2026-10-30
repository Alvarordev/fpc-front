import type { components, paths } from "./schema"
import { api, apiFetch } from "./client"

export type SupportTicket = components["schemas"]["SupportTicketResponseDto"]
export type SupportTicketType = SupportTicket["type"]
export type SupportTicketStatus = SupportTicket["status"]
export type SupportTicketAttachment = SupportTicket["attachments"][number]
export type SupportTicketMessage = SupportTicket["messages"][number]
export type SupportTicketFilters = NonNullable<
  paths["/support-tickets"]["get"]["parameters"]["query"]
>
export type UpdateSupportTicketInput =
  components["schemas"]["UpdateSupportTicketDto"]

export interface CreateSupportTicketInput {
  type: SupportTicketType
  title: string
  description: string
  pagePath?: string
  images: File[]
}

export const supportTicketsApi = {
  async list(filters: SupportTicketFilters = {}): Promise<SupportTicket[]> {
    const { data, response } = await api.GET("/support-tickets", {
      params: { query: filters },
    })
    if (!data) {
      throw new Error(
        `No se pudieron obtener los tickets (HTTP ${response.status})`,
      )
    }
    return data
  },

  async create(input: CreateSupportTicketInput): Promise<SupportTicket> {
    const formData = new FormData()
    formData.append("type", input.type)
    formData.append("title", input.title)
    formData.append("description", input.description)
    if (input.pagePath) formData.append("pagePath", input.pagePath)
    for (const image of input.images) formData.append("images", image)

    const response = await apiFetch("/support-tickets", {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      if (response.status === 413) {
        throw new Error("Alguna imagen supera los 10 MB.")
      }
      if (response.status === 415) {
        throw new Error("Solo se aceptan imágenes JPG, PNG o WEBP.")
      }
      throw new Error("No se pudo enviar el ticket. Inténtalo de nuevo.")
    }
    return (await response.json()) as SupportTicket
  },

  async update(
    id: string,
    input: UpdateSupportTicketInput,
  ): Promise<SupportTicket> {
    const { data } = await api.PATCH("/support-tickets/{id}", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw new Error("No se pudo cambiar el estado")
    return data
  },

  async addMessage(
    id: string,
    input: { body: string; images: File[] },
  ): Promise<SupportTicket> {
    const formData = new FormData()
    if (input.body) formData.append("body", input.body)
    for (const image of input.images) formData.append("images", image)

    const response = await apiFetch(
      `/support-tickets/${encodeURIComponent(id)}/messages`,
      { method: "POST", body: formData },
    )
    if (!response.ok) {
      if (response.status === 413) {
        throw new Error("Alguna imagen supera los 10 MB.")
      }
      throw new Error("No se pudo enviar la respuesta. Inténtalo de nuevo.")
    }
    return (await response.json()) as SupportTicket
  },

  async markSeen(id: string): Promise<SupportTicket> {
    const { data } = await api.POST("/support-tickets/{id}/seen", {
      params: { path: { id } },
    })
    if (!data) throw new Error("No se pudo marcar el ticket como visto")
    return data
  },

  async attachmentContent(
    ticketId: string,
    attachmentId: string,
  ): Promise<Blob> {
    const response = await apiFetch(
      `/support-tickets/${encodeURIComponent(ticketId)}/attachments/${encodeURIComponent(attachmentId)}/content`,
    )
    if (!response.ok) throw new Error("No se pudo cargar la imagen")
    return response.blob()
  },
}
