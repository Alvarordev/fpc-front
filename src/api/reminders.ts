import { readApiErrorMessage } from "./api-error"
import type { components } from "./schema"
import { api } from "./client"

export type CreateReminderInput = components["schemas"]["CreateReminderDto"]
export type UpdateReminderInput = components["schemas"]["UpdateReminderDto"]
export type CompleteReminderInput = components["schemas"]["CompleteReminderDto"]
export type Reminder = components["schemas"]["ReminderResponseDto"]
export type ReminderMessage = components["schemas"]["ReminderMessageResponseDto"]
export type ReminderKind = NonNullable<CreateReminderInput["kind"]>
export type ReminderChannel = NonNullable<CreateReminderInput["channel"]>
export type ReminderLead = NonNullable<CreateReminderInput["lead"]>
export type ReminderMedicalAppointmentSummary =
  components["schemas"]["ReminderMedicalAppointmentSummaryDto"]

export class RemindersApiError extends Error {
  readonly status: number

  constructor(status: number, body?: unknown) {
    super(readApiErrorMessage(body) ?? "No se pudo completar la solicitud de recordatorios")
    this.name = "RemindersApiError"
    this.status = status
  }
}

export const remindersApi = {
  async list(filters: { patientId?: string } = {}): Promise<Reminder[]> {
    const { data, error, response } = await api.GET("/reminders", {
      params: { query: filters },
    })

    if (!data) throw new RemindersApiError(response.status, error)
    return data
  },

  async create(input: CreateReminderInput): Promise<Reminder> {
    const { data, error, response } = await api.POST("/reminders", { body: input })

    if (!data) throw new RemindersApiError(response.status, error)
    return data
  },

  async update(id: string, input: UpdateReminderInput): Promise<Reminder> {
    const { data, error, response } = await api.PATCH("/reminders/{id}", {
      params: { path: { id } },
      body: input,
    })

    if (!data) throw new RemindersApiError(response.status, error)
    return data
  },

  async complete(
    id: string,
    input: CompleteReminderInput = {},
  ): Promise<Reminder> {
    const { data, error, response } = await api.PATCH("/reminders/{id}/complete", {
      params: { path: { id } },
      body: input,
    })

    if (!data) throw new RemindersApiError(response.status, error)
    return data
  },

  async dismiss(id: string): Promise<Reminder> {
    const { data, error, response } = await api.PATCH("/reminders/{id}/dismiss", {
      params: { path: { id } },
    })

    if (!data) throw new RemindersApiError(response.status, error)
    return data
  },

  async message(id: string): Promise<ReminderMessage> {
    const { data, error, response } = await api.GET("/reminders/{id}/message", {
      params: { path: { id } },
    })

    if (!data) throw new RemindersApiError(response.status, error)
    return data
  },

  /** Guarda el texto del correo del recordatorio; null vuelve al sugerido. */
  async setMessage(id: string, text: string | null): Promise<ReminderMessage> {
    const { data, error, response } = await api.PUT("/reminders/{id}/message", {
      params: { path: { id } },
      body: { text },
    })

    if (!data) throw new RemindersApiError(response.status, error)
    return data
  },

  async sendEmail(id: string): Promise<Reminder> {
    const { data, error, response } = await api.POST("/reminders/{id}/send-email", {
      params: { path: { id } },
    })

    if (!data) throw new RemindersApiError(response.status, error)
    return data
  },

  async markSent(id: string): Promise<Reminder> {
    const { data, error, response } = await api.POST("/reminders/{id}/mark-sent", {
      params: { path: { id } },
    })

    if (!data) throw new RemindersApiError(response.status, error)
    return data
  },
}
