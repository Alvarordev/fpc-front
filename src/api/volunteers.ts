import type { components } from "./schema"
import { api } from "./client"

export type Volunteer = components["schemas"]["VolunteerResponseDto"]
export type VolunteerAvailability = components["schemas"]["VolunteerAvailabilityResponseDto"]

export class VolunteersApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo obtener la disponibilidad de psicooncología")
    this.name = "VolunteersApiError"
    this.status = status
  }
}

export const volunteersApi = {
  async list(): Promise<Volunteer[]> {
    const { data, response } = await api.GET("/volunteers")

    if (!data) throw new VolunteersApiError(response.status)
    return data
  },

  async listAvailability(volunteerId: string): Promise<VolunteerAvailability[]> {
    const { data, response } = await api.GET("/volunteers/{volunteerId}/availability", {
      params: { path: { volunteerId } },
    })

    if (!data) throw new VolunteersApiError(response.status)
    return data
  },
}
