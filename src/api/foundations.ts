import type { components } from "./schema"
import { api } from "./client"

export type Foundation = components["schemas"]["FoundationResponseDto"]
export type CreateFoundationInput = components["schemas"]["CreateFoundationDto"]

export class FoundationsApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo completar la solicitud de fundación")
    this.name = "FoundationsApiError"
    this.status = status
  }
}

export const foundationsApi = {
  async list(): Promise<Foundation[]> {
    const { data, response } = await api.GET("/foundations")

    if (!data) {
      throw new FoundationsApiError(response.status)
    }

    return data
  },

  async create(input: CreateFoundationInput): Promise<Foundation> {
    const { data, response } = await api.POST("/foundations", { body: input })
    if (!data) throw new FoundationsApiError(response.status)
    return data
  },
}
