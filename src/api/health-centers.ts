import type { components } from "./schema"
import { api } from "./client"

export type HealthCenter = components["schemas"]["HealthCenterResponseDto"]
export type CreateHealthCenterInput = components["schemas"]["CreateHealthCenterDto"]

export const healthCentersApi = {
  async list(): Promise<HealthCenter[]> {
    const { data, response } = await api.GET("/health-centers")
    if (!data) throw new Error(`No se pudieron obtener los centros de salud (${response.status})`)
    return data
  },

  async create(input: CreateHealthCenterInput): Promise<HealthCenter> {
    const { data, response } = await api.POST("/health-centers", { body: input })
    if (!data) throw new Error(`No se pudo crear el centro de salud (${response.status})`)
    return data
  },
}
