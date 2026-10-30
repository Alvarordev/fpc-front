import { apiErrorFromBody } from "./api-error"
import type { components, paths } from "./schema"
import { api } from "./client"

export type Alert = components["schemas"]["AlertResponseDto"]
export type CreateAlertInput = components["schemas"]["CreateAlertDto"]
export type UpdateAlertInput = components["schemas"]["UpdateAlertDto"]
export type AlertEvent = components["schemas"]["AlertEventResponseDto"]
export type CreateAlertEventInput = components["schemas"]["CreateAlertEventDto"]
export type AlertTicketLookup = components["schemas"]["AlertTicketLookupResponseDto"]
export type AlertListFilters = NonNullable<paths["/alerts"]["get"]["parameters"]["query"]>
export type DeriveAlertInput = components["schemas"]["DeriveAlertDto"]
export type LinkAlertReportInput = components["schemas"]["LinkAlertReportDto"]
export type AlertReport = components["schemas"]["AlertReportResponseDto"]
export type AlertAffectedPatients =
  components["schemas"]["AlertAffectedPatientsResponseDto"]
export type AlertNotifyPatients =
  components["schemas"]["AlertNotifyPatientsResponseDto"]

export const alertsApi = {
  async list(filters: AlertListFilters = {}): Promise<Alert[]> {
    const { data, error, response } = await api.GET("/alerts", { params: { query: filters } })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudieron obtener las alertas")
    return data
  },

  async getById(id: string): Promise<Alert> {
    const { data, error, response } = await api.GET("/alerts/{id}", { params: { path: { id } } })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo obtener la alerta")
    return data
  },

  async getByTicketNumber(ticketNumber: string): Promise<AlertTicketLookup> {
    const { data, error, response } = await api.GET("/alerts/ticket/{ticketNumber}", { params: { path: { ticketNumber } } })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo encontrar el ticket")
    return data
  },

  async create(input: CreateAlertInput): Promise<Alert> {
    const { data, error, response } = await api.POST("/alerts", { body: input })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo crear la alerta")
    return data
  },

  async update(id: string, input: UpdateAlertInput): Promise<Alert> {
    const { data, error, response } = await api.PATCH("/alerts/{id}", { params: { path: { id } }, body: input })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo actualizar la alerta")
    return data
  },

  async delete(id: string): Promise<void> {
    const { error, response } = await api.DELETE("/alerts/{id}", { params: { path: { id } } })
    if (!response.ok) throw apiErrorFromBody(error, response.status, "No se pudo eliminar la alerta")
  },

  async resolve(id: string, resolutionNotes: string): Promise<Alert> {
    const { data, error, response } = await api.PATCH("/alerts/{id}/resolve", {
      params: { path: { id } },
      body: { resolutionNotes },
    })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo resolver la alerta")
    return data
  },

  async getEvents(id: string): Promise<AlertEvent[]> {
    const { data, error, response } = await api.GET("/alerts/{id}/events", { params: { path: { id } } })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo obtener la línea de tiempo")
    return data
  },

  async addEvent(id: string, input: CreateAlertEventInput): Promise<AlertEvent> {
    const { data, error, response } = await api.POST("/alerts/{id}/events", { params: { path: { id } }, body: input })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo agregar el evento")
    return data
  },

  async generateAISummary(id: string): Promise<Alert> {
    const { data, error, response } = await api.POST("/alerts/{id}/ai-summary", { params: { path: { id } } })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo generar el resumen")
    return data
  },

  async derive(id: string, input: DeriveAlertInput): Promise<Alert> {
    const { data, error, response } = await api.PATCH("/alerts/{id}/derive", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo derivar la alerta")
    return data
  },

  async listReports(id: string): Promise<AlertReport[]> {
    const { data, error, response } = await api.GET("/alerts/{id}/reports", {
      params: { path: { id } },
    })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudieron obtener los reportes")
    return data
  },

  async linkReport(id: string, input: LinkAlertReportInput): Promise<AlertReport> {
    const { data, error, response } = await api.POST("/alerts/{id}/reports", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo vincular el reporte")
    return data
  },

  async affectedPatients(id: string): Promise<AlertAffectedPatients> {
    const { data, error, response } = await api.GET("/alerts/{id}/affected-patients", {
      params: { path: { id } },
    })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudieron obtener los pacientes afectados")
    return data
  },

  async notifyAffectedPatients(id: string): Promise<AlertNotifyPatients> {
    const { data, error, response } = await api.POST("/alerts/{id}/affected-patients/notify", {
      params: { path: { id } },
    })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo avisar a los pacientes")
    return data
  },
}
