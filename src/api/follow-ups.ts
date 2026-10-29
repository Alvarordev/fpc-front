import { readApiErrorMessage } from "./api-error"
import type { components, operations } from "./schema"
import { api } from "./client"

export type CreateFollowUpInput = components["schemas"]["CreateFollowUpDto"]
export type CreateFollowUpsBatchInput =
  components["schemas"]["CreateFollowUpsBatchDto"]
export type UpdateFollowUpInput = components["schemas"]["UpdateFollowUpDto"]
export type CreateReminderInput = components["schemas"]["CreateReminderDto"]
export type FollowUp = components["schemas"]["FollowUpResponseDto"]
export type FollowUpFilters = NonNullable<
  operations["FollowUpsController_findAll"]["parameters"]["query"]
>
export type FollowUpAttempt = components["schemas"]["FollowUpAttemptResponseDto"]
export type CreateFollowUpAttemptInput =
  components["schemas"]["CreateFollowUpAttemptDto"]
export type CreateReenrollmentInput = components["schemas"]["CreateReenrollmentDto"]
export type Reenrollment = components["schemas"]["ReenrollmentResponseDto"]
export type RescheduleFollowUpInput =
  components["schemas"]["RescheduleFollowUpDto"]

export class FollowUpsApiError extends Error {
  readonly status: number

  constructor(status: number, body?: unknown) {
    super(readApiErrorMessage(body) ?? "No se pudo completar la solicitud de seguimiento")
    this.name = "FollowUpsApiError"
    this.status = status
  }
}

export const followUpsApi = {
  async list(filters: FollowUpFilters = {}): Promise<FollowUp[]> {
    const { data, error, response } = await api.GET("/follow-ups", {
      params: { query: filters },
    })

    if (!data) throw new FollowUpsApiError(response.status, error)
    return data
  },

  async create(input: CreateFollowUpInput): Promise<FollowUp> {
    const { data, error, response } = await api.POST("/follow-ups", { body: input })

    if (!data) {
      throw new FollowUpsApiError(response.status, error)
    }

    return data
  },

  async createBatch(input: CreateFollowUpsBatchInput): Promise<FollowUp[]> {
    const { data, error, response } = await api.POST("/follow-ups/batch", {
      body: input,
    })

    if (!data) {
      throw new FollowUpsApiError(response.status, error)
    }

    return data
  },

  async getById(id: string): Promise<FollowUp> {
    const { data, error, response } = await api.GET("/follow-ups/{id}", {
      params: { path: { id } },
    })

    if (!data) {
      throw new FollowUpsApiError(response.status, error)
    }

    return data
  },

  async update(id: string, input: UpdateFollowUpInput): Promise<FollowUp> {
    const { data, error, response } = await api.PATCH("/follow-ups/{id}", {
      params: { path: { id } },
      body: input,
    })

    if (!data) {
      throw new FollowUpsApiError(response.status, error)
    }

    return data
  },

  async scheduleNext(
    id: string,
    input: CreateFollowUpInput,
  ): Promise<FollowUp> {
    const { data, error, response } = await api.POST(
      "/follow-ups/{id}/schedule-next",
      {
        params: { path: { id } },
        body: input,
      },
    )

    if (!data) {
      throw new FollowUpsApiError(response.status, error)
    }

    return data
  },

  async recordAttempt(
    id: string,
    input: CreateFollowUpAttemptInput,
  ): Promise<FollowUpAttempt> {
    const { data, error, response } = await api.POST("/follow-ups/{id}/attempts", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw new FollowUpsApiError(response.status, error)
    return data
  },

  async reschedule(
    id: string,
    input: RescheduleFollowUpInput,
  ): Promise<FollowUp> {
    const { data, error, response } = await api.POST("/follow-ups/{id}/reschedule", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw new FollowUpsApiError(response.status, error)
    return data
  },

  async createReminder(id: string, input: CreateReminderInput) {
    const { data, error, response } = await api.POST("/follow-ups/{id}/reminders", {
      params: { path: { id } },
      body: input,
    })

    if (!data) {
      throw new FollowUpsApiError(response.status, error)
    }

    return data
  },

  /** Registra el reenrolamiento: actualiza los datos, reactiva al paciente y completa el seguimiento. */
  async createReenrollment(id: string, input: CreateReenrollmentInput): Promise<Reenrollment> {
    const { data, error, response } = await api.POST("/follow-ups/{id}/reenrollment", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw new FollowUpsApiError(response.status, error)
    return data
  },

  async getReenrollment(id: string): Promise<Reenrollment> {
    const { data, error, response } = await api.GET("/follow-ups/{id}/reenrollment", {
      params: { path: { id } },
    })
    if (!data) throw new FollowUpsApiError(response.status, error)
    return data
  },
}
