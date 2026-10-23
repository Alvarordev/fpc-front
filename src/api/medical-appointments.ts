import type { components, paths } from "./schema"
import { api } from "./client"

export type MedicalAppointment = components["schemas"]["MedicalAppointmentResponseDto"]
export type CreateMedicalAppointmentInput = components["schemas"]["CreateMedicalAppointmentDto"]
export type UpdateMedicalAppointmentInput = components["schemas"]["UpdateMedicalAppointmentDto"]
export type MedicalAppointmentListFilters = NonNullable<
  paths["/medical-appointments"]["get"]["parameters"]["query"]
>

export const medicalAppointmentsApi = {
  async list(filters: MedicalAppointmentListFilters = {}): Promise<MedicalAppointment[]> {
    const { data, response } = await api.GET("/medical-appointments", { params: { query: filters } })
    if (!data) throw new Error(`No se pudieron obtener las citas médicas (${response.status})`)
    return data.data
  },

  async create(input: CreateMedicalAppointmentInput): Promise<MedicalAppointment> {
    const { data, response } = await api.POST("/medical-appointments", { body: input })
    if (!data) throw new Error(`No se pudo agendar la cita médica (${response.status})`)
    return data
  },

  async update(id: string, input: UpdateMedicalAppointmentInput): Promise<MedicalAppointment> {
    const { data, response } = await api.PATCH("/medical-appointments/{id}", { params: { path: { id } }, body: input })
    if (!data) throw new Error(`No se pudo actualizar la cita médica (${response.status})`)
    return data
  },
}
