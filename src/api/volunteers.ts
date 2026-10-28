import type { components } from "./schema"
import { api } from "./client"

export type Volunteer = components["schemas"]["VolunteerResponseDto"]
export type VolunteerAvailability =
  components["schemas"]["VolunteerAvailabilityResponseDto"]
export type OperationalVolunteerAvailability = Omit<
  VolunteerAvailability,
  "startTime" | "endTime"
> & {
  startTime: string
  endTime: string
}
export type CreateVolunteerInput = components["schemas"]["CreateVolunteerDto"]
export type UpdateVolunteerInput = components["schemas"]["UpdateVolunteerDto"]
export type CreateAvailabilityInput =
  components["schemas"]["CreateVolunteerAvailabilityDto"]
export type CreateRecurringAvailabilityInput =
  components["schemas"]["CreateRecurringAvailabilityDto"]
export type RecurringAvailability =
  components["schemas"]["RecurringAvailabilityResponseDto"]
export type RemoveRecurrence =
  components["schemas"]["RemoveRecurrenceResponseDto"]

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

  async me(): Promise<Volunteer> {
    const { data, response } = await api.GET("/volunteers/me")

    if (!data) throw new VolunteersApiError(response.status)
    return data
  },

  async listAvailability(
    volunteerId: string,
  ): Promise<OperationalVolunteerAvailability[]> {
    const { data, response } = await api.GET(
      "/volunteers/{volunteerId}/availability",
      {
        params: { path: { volunteerId } },
      },
    )

    if (!data) throw new VolunteersApiError(response.status)
    return data.filter(
      (slot): slot is OperationalVolunteerAvailability =>
        !slot.isHistorical && slot.startTime !== null && slot.endTime !== null,
    )
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

  async createRecurringAvailability(
    volunteerId: string,
    input: CreateRecurringAvailabilityInput,
  ): Promise<RecurringAvailability> {
    const { data, response } = await api.POST(
      "/volunteers/{volunteerId}/availability/recurring",
      { params: { path: { volunteerId } }, body: input },
    )
    if (!data) throw new VolunteersApiError(response.status)
    return data
  },

  async deleteRecurrence(
    volunteerId: string,
    recurrenceId: string,
  ): Promise<RemoveRecurrence> {
    const { data, response } = await api.DELETE(
      "/volunteers/{volunteerId}/availability/recurrences/{recurrenceId}",
      { params: { path: { volunteerId, recurrenceId } } },
    )
    if (!data) throw new VolunteersApiError(response.status)
    return data
  },
}
