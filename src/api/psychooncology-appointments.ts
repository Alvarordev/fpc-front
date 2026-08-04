import type { components } from "./schema"
import { api } from "./client"

export type CreatePsychooncologyAppointmentInput = components["schemas"]["CreatePsychooncologyAppointmentDto"]
export type UpdatePsychooncologyAppointmentInput = components["schemas"]["UpdatePsychooncologyAppointmentDto"]
export type PsychooncologyAppointment = components["schemas"]["PsychooncologyAppointmentResponseDto"]

export class PsychooncologyAppointmentsApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo completar la solicitud de psicooncología")
    this.name = "PsychooncologyAppointmentsApiError"
    this.status = status
  }
}

export const psychooncologyAppointmentsApi = {
  async list(): Promise<PsychooncologyAppointment[]> {
    const { data, response } = await api.GET("/psychooncology-appointments")

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status)
    return data
  },

  async create(input: CreatePsychooncologyAppointmentInput): Promise<PsychooncologyAppointment> {
    const { data, response } = await api.POST("/psychooncology-appointments", { body: input })

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status)
    return data
  },

  async update(id: string, input: UpdatePsychooncologyAppointmentInput): Promise<PsychooncologyAppointment> {
    const { data, response } = await api.PATCH("/psychooncology-appointments/{id}", {
      params: { path: { id } },
      body: input,
    })

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status)
    return data
  },

  async cancel(id: string): Promise<PsychooncologyAppointment> {
    const { data, response } = await api.PATCH("/psychooncology-appointments/{id}/cancel", {
      params: { path: { id } },
    })

    if (!data) throw new PsychooncologyAppointmentsApiError(response.status)
    return data
  },
}
