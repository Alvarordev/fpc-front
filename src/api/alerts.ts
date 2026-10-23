import type { components, paths } from "./schema"
import { api } from "./client"

export type Alert = components["schemas"]["AlertResponseDto"]
export type CreateAlertInput = components["schemas"]["CreateAlertDto"]
export type UpdateAlertInput = components["schemas"]["UpdateAlertDto"]
export type AlertEvent = components["schemas"]["AlertEventResponseDto"]
export type CreateAlertEventInput = components["schemas"]["CreateAlertEventDto"]
export type AlertTicketLookup = components["schemas"]["AlertTicketLookupResponseDto"]
export type AlertListFilters = NonNullable<paths["/alerts"]["get"]["parameters"]["query"]>

export const alertsApi = {
  async list(filters: AlertListFilters = {}): Promise<Alert[]> {
    const { data, response } = await api.GET("/alerts", { params: { query: filters } })
    if (!data) throw new Error(`No se pudieron obtener las alertas (${response.status})`)
    return data
  },

  async getById(id: string): Promise<Alert> {
    const { data, response } = await api.GET("/alerts/{id}", { params: { path: { id } } })
    if (!data) throw new Error(`No se pudo obtener la alerta (${response.status})`)
    return data
  },

  async getByTicketNumber(ticketNumber: string): Promise<AlertTicketLookup> {
    const { data, response } = await api.GET("/alerts/ticket/{ticketNumber}", { params: { path: { ticketNumber } } })
    if (!data) throw new Error(`No se pudo encontrar el ticket (${response.status})`)
    return data
  },

  async create(input: CreateAlertInput): Promise<Alert> {
    const { data, response } = await api.POST("/alerts", { body: input })
    if (!data) throw new Error(`No se pudo crear la alerta (${response.status})`)
    return data
  },

  async update(id: string, input: UpdateAlertInput): Promise<Alert> {
    const { data, response } = await api.PATCH("/alerts/{id}", { params: { path: { id } }, body: input })
    if (!data) throw new Error(`No se pudo actualizar la alerta (${response.status})`)
    return data
  },

  async delete(id: string): Promise<void> {
    const { response } = await api.DELETE("/alerts/{id}", { params: { path: { id } } })
    if (!response.ok) throw new Error(`No se pudo eliminar la alerta (${response.status})`)
  },

  async resolve(id: string): Promise<Alert> {
    const { data, response } = await api.PATCH("/alerts/{id}/resolve", { params: { path: { id } } })
    if (!data) throw new Error(`No se pudo resolver la alerta (${response.status})`)
    return data
  },

  async getEvents(id: string): Promise<AlertEvent[]> {
    const { data, response } = await api.GET("/alerts/{id}/events", { params: { path: { id } } })
    if (!data) throw new Error(`No se pudo obtener la línea de tiempo (${response.status})`)
    return data
  },

  async addEvent(id: string, input: CreateAlertEventInput): Promise<AlertEvent> {
    const { data, response } = await api.POST("/alerts/{id}/events", { params: { path: { id } }, body: input })
    if (!data) throw new Error(`No se pudo agregar el evento (${response.status})`)
    return data
  },

  async generateAISummary(id: string): Promise<Alert> {
    const { data, response } = await api.POST("/alerts/{id}/ai-summary", { params: { path: { id } } })
    if (!data) throw new Error(`No se pudo generar el resumen (${response.status})`)
    return data
  },
}
