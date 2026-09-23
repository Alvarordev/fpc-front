import type { components } from "./schema"
import { api } from "./client"
import { apiErrorFromBody } from "./api-error"

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

const HISTORICAL_RECORD_ERROR = "No se pudo guardar el registro histórico"

async function requireData<T>(
  data: T | undefined,
  status: number,
  error: unknown,
): Promise<T> {
  if (!data) throw apiErrorFromBody(error, status, HISTORICAL_RECORD_ERROR)
  return data
}

export const historicalRecordsApi = {
  async createEnrollment(
    input: CreateHistoricalEnrollmentInput,
  ): Promise<HistoricalEnrollment> {
    const { data, error, response } = await api.POST(
      "/historical-records/enrollments",
      {
        body: input,
      },
    )
    return requireData(data, response.status, error)
  },

  async createFollowUp(
    input: CreateHistoricalFollowUpInput,
  ): Promise<HistoricalFollowUp> {
    const { data, error, response } = await api.POST(
      "/historical-records/follow-ups",
      {
        body: input,
      },
    )
    return requireData(data, response.status, error)
  },

  async updateFollowUp(
    id: string,
    input: UpdateHistoricalFollowUpInput,
  ): Promise<HistoricalFollowUp> {
    const { data, error, response } = await api.PATCH(
      "/historical-records/follow-ups/{id}",
      {
        params: { path: { id } },
        body: input,
      },
    )
    return requireData(data, response.status, error)
  },

  async createReminder(
    input: CreateHistoricalReminderInput,
  ): Promise<HistoricalReminder> {
    const { data, error, response } = await api.POST("/historical-records/reminders", {
      body: input,
    })
    return requireData(data, response.status, error)
  },

  async updateReminder(
    id: string,
    input: UpdateHistoricalReminderInput,
  ): Promise<HistoricalReminder> {
    const { data, error, response } = await api.PATCH(
      "/historical-records/reminders/{id}",
      {
        params: { path: { id } },
        body: input,
      },
    )
    return requireData(data, response.status, error)
  },

  async createMedicalAppointment(
    input: CreateHistoricalMedicalAppointmentInput,
  ): Promise<HistoricalMedicalAppointment> {
    const { data, error, response } = await api.POST(
      "/historical-records/medical-appointments",
      { body: input },
    )
    return requireData(data, response.status, error)
  },

  async createPsychooncologyAppointment(
    input: CreateHistoricalPsychooncologyAppointmentInput,
  ): Promise<HistoricalPsychooncologyAppointment> {
    const { data, error, response } = await api.POST(
      "/historical-records/psychooncology-appointments",
      { body: input },
    )
    return requireData(data, response.status, error)
  },

  async updatePsychooncologyAppointment(
    id: string,
    input: UpdateHistoricalPsychooncologyAppointmentInput,
  ): Promise<HistoricalPsychooncologyAppointment> {
    const { data, error, response } = await api.PATCH(
      "/historical-records/psychooncology-appointments/{id}",
      {
        params: { path: { id } },
        body: input,
      },
    )
    return requireData(data, response.status, error)
  },
}
