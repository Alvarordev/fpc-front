import { apiErrorFromBody } from "./api-error"
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
    const { data, error, response } = await api.GET(
      "/patients/{patientId}/non-oncological-follow-ups",
      { params: { path: { patientId } } },
    )
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo cargar el seguimiento")
    return data
  },

  async create(
    patientId: string,
    input: CreateNonOncologicalFollowUpInput,
  ): Promise<NonOncologicalFollowUp> {
    const { data, error, response } = await api.POST(
      "/patients/{patientId}/non-oncological-follow-ups",
      { params: { path: { patientId } }, body: input },
    )
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo guardar el seguimiento")
    return data
  },

  async update(
    patientId: string,
    id: string,
    input: UpdateNonOncologicalFollowUpInput,
  ): Promise<NonOncologicalFollowUp> {
    const { data, error, response } = await api.PATCH(
      "/patients/{patientId}/non-oncological-follow-ups/{id}",
      { params: { path: { patientId, id } }, body: input },
    )
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo actualizar el seguimiento")
    return data
  },
}
