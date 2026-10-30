import { readApiErrorMessage } from "./api-error"
import type { components, operations } from "./schema"
import { api } from "./client"

export type CreatePsychooncologyAppointmentInput = components["schemas"]["CreatePsychooncologyAppointmentDto"]
export type UpdatePsychooncologyAppointmentInput = components["schemas"]["UpdatePsychooncologyAppointmentDto"]
export type ReschedulePsychooncologyAppointmentInput = components["schemas"]["ReschedulePsychooncologyAppointmentDto"]
export type PsychooncologyAppointment = components["schemas"]["PsychooncologyAppointmentResponseDto"]
export type PsychooncologyAppointmentFilters = NonNullable<operations["PsychooncologyAppointmentsController_findAll"]["parameters"]["query"]>
export type AppointmentReminder = components["schemas"]["AppointmentReminderResponseDto"]
export type UnmanagedNoShows = components["schemas"]["UnmanagedNoShowsResponseDto"]

export class PsychooncologyAppointmentsApiError extends Error {
  readonly status: number

  constructor(status: number, body?: unknown) {
    super(readApiErrorMessage(body) ?? "No se pudo completar la solicitud de psicooncología")
    this.name = "PsychooncologyAppointmentsApiError"
    this.status = status
  }
}

export const psychooncologyAppointmentsApi = {
  async list(filters: PsychooncologyAppointmentFilters = {}): Promise<PsychooncologyAppointment[]> {
    const { data, error, response } = await api.GET("/psychooncology-appointments", {
      params: { query: filters },
    })

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status, error)
    return data
  },

  async create(input: CreatePsychooncologyAppointmentInput): Promise<PsychooncologyAppointment> {
    const { data, error, response } = await api.POST("/psychooncology-appointments", { body: input })

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status, error)
    return data
  },

  async update(id: string, input: UpdatePsychooncologyAppointmentInput): Promise<PsychooncologyAppointment> {
    const { data, error, response } = await api.PATCH("/psychooncology-appointments/{id}", {
      params: { path: { id } },
      body: input,
    })

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status, error)
    return data
  },

  async reschedule(
    id: string,
    input: ReschedulePsychooncologyAppointmentInput,
  ): Promise<PsychooncologyAppointment> {
    const { data, error, response } = await api.POST(
      "/psychooncology-appointments/{id}/reschedule",
      { params: { path: { id } }, body: input },
    )

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status, error)
    return data
  },

  async cancel(id: string): Promise<PsychooncologyAppointment> {
    const { data, error, response } = await api.PATCH("/psychooncology-appointments/{id}/cancel", {
      params: { path: { id } },
    })

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status, error)
    return data
  },

  async needsReassignment(): Promise<PsychooncologyAppointment[]> {
    const { data, error, response } = await api.GET("/psychooncology-appointments/needs-reassignment")

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status, error)
    return data
  },

  async unmanagedNoShows(patientId: string): Promise<UnmanagedNoShows> {
    const { data, error, response } = await api.GET(
      "/psychooncology-appointments/patients/{patientId}/unmanaged-no-shows",
      { params: { path: { patientId } } },
    )

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status, error)
    return data
  },

  async reminder(id: string): Promise<AppointmentReminder> {
    const { data, error, response } = await api.GET("/psychooncology-appointments/{id}/reminder", {
      params: { path: { id } },
    })

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status, error)
    return data
  },

  /** Guarda el texto del recordatorio de la sesión; null vuelve al sugerido. */
  async setReminderMessage(id: string, text: string | null): Promise<AppointmentReminder> {
    const { data, error, response } = await api.PUT("/psychooncology-appointments/{id}/reminder/message", {
      params: { path: { id } },
      body: { text },
    })

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status, error)
    return data
  },

  async markReminderSent(id: string): Promise<AppointmentReminder> {
    const { data, error, response } = await api.PATCH(
      "/psychooncology-appointments/{id}/reminder/sent",
      { params: { path: { id } } },
    )

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status, error)
    return data
  },

  async markNoShowManaged(id: string): Promise<PsychooncologyAppointment> {
    const { data, error, response } = await api.PATCH(
      "/psychooncology-appointments/{id}/no-show-managed",
      { params: { path: { id } } },
    )

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status, error)
    return data
  },
}
