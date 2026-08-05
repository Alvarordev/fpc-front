import type { components } from "./schema"
import { api } from "./client"

export type Alert = components["schemas"]["AlertResponseDto"]
export type CreateAlertInput = components["schemas"]["CreateAlertDto"]

export const alertsApi = {
  async list(filters: { status?: "ACTIVE" | "RESOLVED"; healthCenterId?: string; createdById?: string } = {}): Promise<Alert[]> {
    const { data, response } = await api.GET("/alerts", { params: { query: filters } })
    if (!data) throw new Error(`No se pudieron obtener las alertas (${response.status})`)
    return data
  },

  async create(input: CreateAlertInput): Promise<Alert> {
    const { data, response } = await api.POST("/alerts", { body: input })
    if (!data) throw new Error(`No se pudo crear la alerta (${response.status})`)
    return data
  },

  async resolve(id: string): Promise<Alert> {
    const { data, response } = await api.PATCH("/alerts/{id}/resolve", { params: { path: { id } } })
    if (!data) throw new Error(`No se pudo resolver la alerta (${response.status})`)
    return data
  },
}
