import type { components } from "./schema"
import { api } from "./client"

export type PatientTimelineEvent =
  components["schemas"]["PatientTimelineResponseDto"]["data"][number]
export type PatientTimelineOutcome =
  components["schemas"]["PatientTimelineOutcomeDto"]
export type PatientTimeline =
  components["schemas"]["PatientTimelineResponseDto"]

export class PatientTimelineApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo obtener el historial de seguimiento")
    this.name = "PatientTimelineApiError"
    this.status = status
  }
}

export const patientTimelineApi = {
  async list(patientId: string): Promise<PatientTimeline> {
    const { data, response } = await api.GET("/patients/{id}/timeline", {
      params: { path: { id: patientId } },
    })

    if (!data) {
      throw new PatientTimelineApiError(response.status)
    }

    return data
  },
}
