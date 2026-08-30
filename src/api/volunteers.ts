import type { components } from "./schema"
import { api } from "./client"

export type Volunteer = components["schemas"]["VolunteerResponseDto"]
export type VolunteerAvailability =
  components["schemas"]["VolunteerAvailabilityResponseDto"]
export type CreateVolunteerInput = components["schemas"]["CreateVolunteerDto"]
export type UpdateVolunteerInput = components["schemas"]["UpdateVolunteerDto"]
export type CreateAvailabilityInput =
  components["schemas"]["CreateVolunteerAvailabilityDto"]

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

  async listAvailability(
    volunteerId: string,
  ): Promise<VolunteerAvailability[]> {
    const { data, response } = await api.GET(
      "/volunteers/{volunteerId}/availability",
      {
        params: { path: { volunteerId } },
      },
    )

    if (!data) throw new VolunteersApiError(response.status)
    return data
  },

  async create(input: CreateVolunteerInput): Promise<Volunteer> {
    const { data, response } = await api.POST("/volunteers", { body: input })
    if (!data) throw new VolunteersApiError(response.status)
    return data
  },

  async update(id: string, input: UpdateVolunteerInput): Promise<Volunteer> {
    const { data, response } = await api.PATCH("/volunteers/{id}", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw new VolunteersApiError(response.status)
    return data
  },

  async createAvailability(
    volunteerId: string,
    input: CreateAvailabilityInput,
  ): Promise<VolunteerAvailability> {
    const { data, response } = await api.POST(
      "/volunteers/{volunteerId}/availability",
      { params: { path: { volunteerId } }, body: input },
    )
    if (!data) throw new VolunteersApiError(response.status)
    return data
  },

  async deleteAvailability(volunteerId: string, id: string): Promise<void> {
    const { response } = await api.DELETE(
      "/volunteers/{volunteerId}/availability/{id}",
      { params: { path: { volunteerId, id } } },
    )
    if (!response.ok) throw new VolunteersApiError(response.status)
  },
}
