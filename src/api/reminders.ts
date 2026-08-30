import type { components } from "./schema"
import { api } from "./client"

export type CreateReminderInput = components["schemas"]["CreateReminderDto"]
export type UpdateReminderInput = components["schemas"]["UpdateReminderDto"]
export type CompleteReminderInput = components["schemas"]["CompleteReminderDto"]
export type Reminder = components["schemas"]["ReminderResponseDto"]
export type ReminderKind = NonNullable<CreateReminderInput["kind"]>
export type ReminderMedicalAppointmentSummary =
  components["schemas"]["ReminderMedicalAppointmentSummaryDto"]

export class RemindersApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo completar la solicitud de recordatorios")
    this.name = "RemindersApiError"
    this.status = status
  }
}

export const remindersApi = {
  async list(filters: { patientId?: string } = {}): Promise<Reminder[]> {
    const { data, response } = await api.GET("/reminders", {
      params: { query: filters },
    })

    if (!data) throw new RemindersApiError(response.status)
    return data
  },

  async create(input: CreateReminderInput): Promise<Reminder> {
    const { data, response } = await api.POST("/reminders", { body: input })

    if (!data) throw new RemindersApiError(response.status)
    return data
  },

  async update(id: string, input: UpdateReminderInput): Promise<Reminder> {
    const { data, response } = await api.PATCH("/reminders/{id}", {
      params: { path: { id } },
      body: input,
    })

    if (!data) throw new RemindersApiError(response.status)
    return data
  },

  async complete(
    id: string,
    input: CompleteReminderInput = {},
  ): Promise<Reminder> {
    const { data, response } = await api.PATCH("/reminders/{id}/complete", {
      params: { path: { id } },
      body: input,
    })

    if (!data) throw new RemindersApiError(response.status)
    return data
  },

  async dismiss(id: string): Promise<Reminder> {
    const { data, response } = await api.PATCH("/reminders/{id}/dismiss", {
      params: { path: { id } },
    })

    if (!data) throw new RemindersApiError(response.status)
    return data
  },
}
