import { apiErrorFromBody } from "./api-error"
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
    const { data, error, response } = await api.GET("/health-centers", {
      params: { query: filters },
    })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudieron obtener los centros de salud")
    return data
  },

  async getById(id: string): Promise<HealthCenter> {
    const { data, error, response } = await api.GET("/health-centers/{id}", {
      params: { path: { id } },
    })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo obtener el centro de salud")
    return data
  },

  async create(input: CreateHealthCenterInput): Promise<HealthCenter> {
    const { data, error, response } = await api.POST("/health-centers", { body: input })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo crear el centro de salud")
    return data
  },

  async update(id: string, input: UpdateHealthCenterInput): Promise<HealthCenter> {
    const { data, error, response } = await api.PATCH("/health-centers/{id}", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo actualizar el centro de salud")
    return data
  },
}
