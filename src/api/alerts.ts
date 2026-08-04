import type { components } from "./schema"
import { api } from "./client"

export type Alert = components["schemas"]["AlertResponseDto"]

export const alertsApi = {
  async list(): Promise<Alert[]> {
    const { data, response } = await api.GET("/alerts")
    if (!data) throw new Error(`No se pudieron obtener las alertas (${response.status})`)
    return data
  },
}
