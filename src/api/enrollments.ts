import type { components } from "./schema"
import { api } from "./client"

export type CreateEnrollmentInput = components["schemas"]["CreateEnrollmentDto"]
export type Enrollment = components["schemas"]["EnrollmentResponseDto"]
export type UpdateEnrollmentSurveyInput = components["schemas"]["UpdateEnrollmentSurveyDto"]

export class EnrollmentsApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo completar el enrolamiento")
    this.name = "EnrollmentsApiError"
    this.status = status
  }
}

export const enrollmentsApi = {
  async create(input: CreateEnrollmentInput): Promise<Enrollment> {
    const { data, response } = await api.POST("/enrollments", { body: input })
    if (!data) throw new EnrollmentsApiError(response.status)
    return data
  },

  async listByPatient(patientId: string): Promise<Enrollment[]> {
    const { data, response } = await api.GET("/enrollments/patient/{patientId}", {
      params: { path: { patientId } },
    })
    if (!data) throw new EnrollmentsApiError(response.status)
    return data
  },

  async updateSurvey(
    id: string,
    input: UpdateEnrollmentSurveyInput,
  ): Promise<Enrollment> {
    const { data, response } = await api.PATCH("/enrollments/{id}/survey", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw new EnrollmentsApiError(response.status)
    return data
  },
}
