import type { components, paths } from "./schema"
import { api } from "./client"

export type HealthCenter = components["schemas"]["HealthCenterResponseDto"]
export type CreateHealthCenterInput = components["schemas"]["CreateHealthCenterDto"]
export type UpdateHealthCenterInput = components["schemas"]["UpdateHealthCenterDto"]
export type HealthCenterListFilters = NonNullable<
  paths["/health-centers"]["get"]["parameters"]["query"]
>

export const healthCentersApi = {
  async list(filters: HealthCenterListFilters = {}): Promise<HealthCenter[]> {
    const { data, response } = await api.GET("/health-centers", {
      params: { query: filters },
    })
    if (!data) throw new Error(`No se pudieron obtener los centros de salud (${response.status})`)
    return data
  },

  async getById(id: string): Promise<HealthCenter> {
    const { data, response } = await api.GET("/health-centers/{id}", {
      params: { path: { id } },
    })
    if (!data) throw new Error(`No se pudo obtener el centro de salud (${response.status})`)
    return data
  },

  async create(input: CreateHealthCenterInput): Promise<HealthCenter> {
    const { data, response } = await api.POST("/health-centers", { body: input })
    if (!data) throw new Error(`No se pudo crear el centro de salud (${response.status})`)
    return data
  },

  async update(id: string, input: UpdateHealthCenterInput): Promise<HealthCenter> {
    const { data, response } = await api.PATCH("/health-centers/{id}", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw new Error(`No se pudo actualizar el centro de salud (${response.status})`)
    return data
  },
}
