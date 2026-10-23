import type { components } from "./schema"
import { api } from "./client"

export type HealthCenter = components["schemas"]["HealthCenterResponseDto"]
export type CreateHealthCenterInput = components["schemas"]["CreateHealthCenterDto"]
export type UpdateHealthCenterInput = components["schemas"]["UpdateHealthCenterDto"]

export const healthCentersApi = {
  async list(filters: { department?: string; isActive?: boolean } = {}): Promise<HealthCenter[]> {
    const { data, response } = await api.GET("/health-centers", { params: { query: { ...filters, isActive: filters.isActive === undefined ? undefined : String(filters.isActive) as "true" | "false" } } })
    if (!data) throw new Error(`No se pudieron obtener los centros de salud (${response.status})`)
    return data
  },

  async create(input: CreateHealthCenterInput): Promise<HealthCenter> {
    const { data, response } = await api.POST("/health-centers", { body: input })
    if (!data) throw new Error(`No se pudo crear el centro de salud (${response.status})`)
    return data
  },

  async update(id: string, input: UpdateHealthCenterInput): Promise<HealthCenter> {
    const { data, response } = await api.PATCH("/health-centers/{id}", { params: { path: { id } }, body: input })
    if (!data) throw new Error(`No se pudo actualizar el centro de salud (${response.status})`)
    return data
  },
}
