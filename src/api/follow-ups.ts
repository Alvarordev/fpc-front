import type { components, operations } from "./schema"
import { api } from "./client"

export type CreateFollowUpInput = components["schemas"]["CreateFollowUpDto"]
export type UpdateFollowUpInput = components["schemas"]["UpdateFollowUpDto"]
export type CreateReminderInput = components["schemas"]["CreateReminderDto"]
export type FollowUp = components["schemas"]["FollowUpResponseDto"]
export type FollowUpFilters = NonNullable<operations["FollowUpsController_findAll"]["parameters"]["query"]>

export class FollowUpsApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo completar la solicitud de seguimiento")
    this.name = "FollowUpsApiError"
    this.status = status
  }
}

export const followUpsApi = {
  async list(filters: FollowUpFilters = {}): Promise<FollowUp[]> {
    const { data, response } = await api.GET("/follow-ups", {
      params: { query: filters },
    })

    if (!data) throw new FollowUpsApiError(response.status)
    return data
  },

  async create(input: CreateFollowUpInput): Promise<FollowUp> {
    const { data, response } = await api.POST("/follow-ups", { body: input })

    if (!data) {
      throw new FollowUpsApiError(response.status)
    }

    return data
  },

  async getById(id: string): Promise<FollowUp> {
    const { data, response } = await api.GET("/follow-ups/{id}", {
      params: { path: { id } },
    })

    if (!data) {
      throw new FollowUpsApiError(response.status)
    }

    return data
  },

  async update(id: string, input: UpdateFollowUpInput): Promise<FollowUp> {
    const { data, response } = await api.PATCH("/follow-ups/{id}", {
      params: { path: { id } },
      body: input,
    })

    if (!data) {
      throw new FollowUpsApiError(response.status)
    }

    return data
  },

  async scheduleNext(id: string, input: CreateFollowUpInput): Promise<FollowUp> {
    const { data, response } = await api.POST("/follow-ups/{id}/schedule-next", {
      params: { path: { id } },
      body: input,
    })

    if (!data) {
      throw new FollowUpsApiError(response.status)
    }

    return data
  },

  async createReminder(id: string, input: CreateReminderInput) {
    const { data, response } = await api.POST("/follow-ups/{id}/reminders", {
      params: { path: { id } },
      body: input,
    })

    if (!data) {
      throw new FollowUpsApiError(response.status)
    }

    return data
  },
}
