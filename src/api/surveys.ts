import { readApiErrorMessage } from "./api-error"
import type { components } from "./schema"
import { api } from "./client"

export type Survey = components["schemas"]["SurveyResponseDto"]
export type CreateSurveyInput = components["schemas"]["CreateSurveyDto"]
export type SurveyScript = components["schemas"]["SurveyScriptResponseDto"]
export type PendingThreeMonthSurvey =
  components["schemas"]["PendingThreeMonthSurveyDto"]
export type SurveyType = CreateSurveyInput["type"]
export type SurveyChannel = CreateSurveyInput["channel"]

export class SurveysApiError extends Error {
  readonly status: number

  constructor(status: number, body?: unknown) {
    super(readApiErrorMessage(body) ?? "No se pudo completar la solicitud de encuestas")
    this.name = "SurveysApiError"
    this.status = status
  }
}

export const surveysApi = {
  async list(
    filters: {
      patientId?: string
      type?: SurveyType
      psychooncologyAppointmentId?: string
    } = {},
  ): Promise<Survey[]> {
    const { data, error, response } = await api.GET("/surveys", {
      params: { query: filters },
    })

    if (!data) throw new SurveysApiError(response.status, error)
    return data
  },

  async create(input: CreateSurveyInput): Promise<Survey> {
    const { data, error, response } = await api.POST("/surveys", { body: input })

    if (!data) throw new SurveysApiError(response.status, error)
    return data
  },

  async script(query: {
    type: SurveyType
    patientId?: string
    variant?: "DIAGNOSED" | "SIGNS_AND_SYMPTOMS"
  }): Promise<SurveyScript> {
    const { data, error, response } = await api.GET("/surveys/script", {
      params: { query },
    })

    if (!data) throw new SurveysApiError(response.status, error)
    return data
  },

  async pendingThreeMonths(): Promise<PendingThreeMonthSurvey[]> {
    const { data, error, response } = await api.GET("/surveys/pending/three-months")

    if (!data) throw new SurveysApiError(response.status, error)
    return data
  },
}
