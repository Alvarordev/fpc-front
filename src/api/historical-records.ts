import type { components } from "./schema"
import { api } from "./client"

export type CreateHistoricalEnrollmentInput =
  components["schemas"]["CreateHistoricalEnrollmentDto"]
export type CreateHistoricalFollowUpInput =
  components["schemas"]["CreateHistoricalFollowUpDto"]
export type UpdateHistoricalFollowUpInput =
  components["schemas"]["UpdateHistoricalFollowUpDto"]
export type CreateHistoricalReminderInput =
  components["schemas"]["CreateHistoricalReminderDto"]
export type UpdateHistoricalReminderInput =
  components["schemas"]["UpdateHistoricalReminderDto"]
export type CreateHistoricalMedicalAppointmentInput =
  components["schemas"]["CreateHistoricalMedicalAppointmentDto"]
export type CreateHistoricalPsychooncologyAppointmentInput =
  components["schemas"]["CreateHistoricalPsychooncologyAppointmentDto"]
export type UpdateHistoricalPsychooncologyAppointmentInput =
  components["schemas"]["UpdateHistoricalPsychooncologyAppointmentDto"]

export type HistoricalEnrollment =
  components["schemas"]["EnrollmentResponseDto"]
export type HistoricalFollowUp = components["schemas"]["FollowUpResponseDto"]
export type HistoricalReminder = components["schemas"]["ReminderResponseDto"]
export type HistoricalMedicalAppointment =
  components["schemas"]["PatientMedicalAppointmentResponseDto"]
export type HistoricalPsychooncologyAppointment =
  components["schemas"]["PsychooncologyAppointmentResponseDto"]

export class HistoricalRecordsApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo guardar el registro histórico")
    this.name = "HistoricalRecordsApiError"
    this.status = status
  }
}

async function requireData<T>(data: T | undefined, status: number): Promise<T> {
  if (!data) throw new HistoricalRecordsApiError(status)
  return data
}

export const historicalRecordsApi = {
  async createEnrollment(
    input: CreateHistoricalEnrollmentInput,
  ): Promise<HistoricalEnrollment> {
    const { data, response } = await api.POST(
      "/historical-records/enrollments",
      {
        body: input,
      },
    )
    return requireData(data, response.status)
  },

  async createFollowUp(
    input: CreateHistoricalFollowUpInput,
  ): Promise<HistoricalFollowUp> {
    const { data, response } = await api.POST(
      "/historical-records/follow-ups",
      {
        body: input,
      },
    )
    return requireData(data, response.status)
  },

  async updateFollowUp(
    id: string,
    input: UpdateHistoricalFollowUpInput,
  ): Promise<HistoricalFollowUp> {
    const { data, response } = await api.PATCH(
      "/historical-records/follow-ups/{id}",
      {
        params: { path: { id } },
        body: input,
      },
    )
    return requireData(data, response.status)
  },

  async createReminder(
    input: CreateHistoricalReminderInput,
  ): Promise<HistoricalReminder> {
    const { data, response } = await api.POST("/historical-records/reminders", {
      body: input,
    })
    return requireData(data, response.status)
  },

  async updateReminder(
    id: string,
    input: UpdateHistoricalReminderInput,
  ): Promise<HistoricalReminder> {
    const { data, response } = await api.PATCH(
      "/historical-records/reminders/{id}",
      {
        params: { path: { id } },
        body: input,
      },
    )
    return requireData(data, response.status)
  },

  async createMedicalAppointment(
    input: CreateHistoricalMedicalAppointmentInput,
  ): Promise<HistoricalMedicalAppointment> {
    const { data, response } = await api.POST(
      "/historical-records/medical-appointments",
      { body: input },
    )
    return requireData(data, response.status)
  },

  async createPsychooncologyAppointment(
    input: CreateHistoricalPsychooncologyAppointmentInput,
  ): Promise<HistoricalPsychooncologyAppointment> {
    const { data, response } = await api.POST(
      "/historical-records/psychooncology-appointments",
      { body: input },
    )
    return requireData(data, response.status)
  },

  async updatePsychooncologyAppointment(
    id: string,
    input: UpdateHistoricalPsychooncologyAppointmentInput,
  ): Promise<HistoricalPsychooncologyAppointment> {
    const { data, response } = await api.PATCH(
      "/historical-records/psychooncology-appointments/{id}",
      {
        params: { path: { id } },
        body: input,
      },
    )
    return requireData(data, response.status)
  },
}
