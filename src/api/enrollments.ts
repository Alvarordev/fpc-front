import type { components } from "./schema"
import { api } from "./client"
import { apiErrorFromBody } from "./api-error"

export type CreateEnrollmentInput = components["schemas"]["CreateEnrollmentDto"]
export type Enrollment = components["schemas"]["EnrollmentResponseDto"]
export type UpdateEnrollmentSurveyInput = components["schemas"]["UpdateEnrollmentSurveyDto"]

const ENROLLMENT_ERROR = "No se pudo completar el enrolamiento"

export const enrollmentsApi = {
  async create(input: CreateEnrollmentInput): Promise<Enrollment> {
    const { data, error, response } = await api.POST("/enrollments", { body: input })
    if (!data) throw apiErrorFromBody(error, response.status, ENROLLMENT_ERROR)
    return data
  },

  async listByPatient(patientId: string): Promise<Enrollment[]> {
    const { data, error, response } = await api.GET("/enrollments/patient/{patientId}", {
      params: { path: { patientId } },
    })
    if (!data) throw apiErrorFromBody(error, response.status, ENROLLMENT_ERROR)
    return data
  },

  async updateSurvey(
    id: string,
    input: UpdateEnrollmentSurveyInput,
  ): Promise<Enrollment> {
    const { data, error, response } = await api.PATCH("/enrollments/{id}/survey", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw apiErrorFromBody(error, response.status, ENROLLMENT_ERROR)
    return data
  },
}
