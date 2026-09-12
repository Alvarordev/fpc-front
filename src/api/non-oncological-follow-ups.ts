import type { components } from "./schema"
import { api } from "./client"

export type NonOncologicalFollowUp =
  components["schemas"]["PatientNonOncologicalFollowUpResponseDto"]
export type CreateNonOncologicalFollowUpInput =
  components["schemas"]["CreatePatientNonOncologicalFollowUpDto"]
export type UpdateNonOncologicalFollowUpInput =
  components["schemas"]["UpdatePatientNonOncologicalFollowUpDto"]

export const nonOncologicalFollowUpsApi = {
  async list(patientId: string): Promise<NonOncologicalFollowUp[]> {
    const { data, response } = await api.GET(
      "/patients/{patientId}/non-oncological-follow-ups",
      { params: { path: { patientId } } },
    )
    if (!data) throw new Error(`No se pudo cargar el seguimiento (${response.status})`)
    return data
  },

  async create(
    patientId: string,
    input: CreateNonOncologicalFollowUpInput,
  ): Promise<NonOncologicalFollowUp> {
    const { data, response } = await api.POST(
      "/patients/{patientId}/non-oncological-follow-ups",
      { params: { path: { patientId } }, body: input },
    )
    if (!data) throw new Error(`No se pudo guardar el seguimiento (${response.status})`)
    return data
  },

  async update(
    patientId: string,
    id: string,
    input: UpdateNonOncologicalFollowUpInput,
  ): Promise<NonOncologicalFollowUp> {
    const { data, response } = await api.PATCH(
      "/patients/{patientId}/non-oncological-follow-ups/{id}",
      { params: { path: { patientId, id } }, body: input },
    )
    if (!data) throw new Error(`No se pudo actualizar el seguimiento (${response.status})`)
    return data
  },
}
