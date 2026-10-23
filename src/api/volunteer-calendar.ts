import type { components } from "./schema"
import { api } from "./client"

export type VolunteerCalendar = components["schemas"]["VolunteerCalendarResponseDto"]

export const volunteerCalendarApi = {
  async list(from: string, to: string): Promise<VolunteerCalendar> {
    const { data, response } = await api.GET("/volunteer-calendar", { params: { query: { from, to } } })
    if (!data) throw new Error(`No se pudo obtener el calendario de voluntarios (${response.status})`)
    return data
  },
}
