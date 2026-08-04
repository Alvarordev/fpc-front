import type { components } from "./schema"
import { api } from "./client"

export type CreateEnrollmentInput = components["schemas"]["CreateEnrollmentDto"]
export type Enrollment = components["schemas"]["EnrollmentResponseDto"]

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
}
