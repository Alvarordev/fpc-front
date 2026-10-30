import { apiErrorFromBody } from "./api-error"
import type { components, paths } from "./schema"
import { api } from "./client"

// Interés de los acompañantes en las charlas educativas (catálogo educational_talk).

export type TalkInterest = components["schemas"]["TalkInterestResponseDto"]
export type TalkInterestFilters = NonNullable<paths["/talk-interests"]["get"]["parameters"]["query"]>

export const talkInterestsApi = {
  async list(filters: TalkInterestFilters = {}): Promise<{ data: TalkInterest[]; total: number }> {
    const { data, error, response } = await api.GET("/talk-interests", { params: { query: filters } })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudieron obtener los interesados en charlas")
    return data
  },

  async listByPatient(patientId: string): Promise<TalkInterest[]> {
    const { data, error, response } = await api.GET("/patients/{id}/talk-interests", { params: { path: { id: patientId } } })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudieron obtener las charlas de interés")
    return data
  },

  async create(patientId: string, companionId: string, talk: string, followUpId?: string): Promise<TalkInterest> {
    const { data, error, response } = await api.POST("/patients/{id}/companions/{companionId}/talk-interests", {
      params: { path: { id: patientId, companionId } },
      body: { talk, followUpId },
    })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo registrar el interés en la charla")
    return data
  },

  async remove(patientId: string, interestId: string): Promise<void> {
    const { error, response } = await api.DELETE("/patients/{id}/talk-interests/{interestId}", {
      params: { path: { id: patientId, interestId } },
    })
    if (!response.ok) throw apiErrorFromBody(error, response.status, "No se pudo quitar el interés en la charla")
  },
}
