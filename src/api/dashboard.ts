import type { components, operations } from "./schema"
import { api } from "./client"

export type Dashboard = components["schemas"]["DashboardResponseDto"]
export type DashboardQuery = NonNullable<
  operations["DashboardController_getDashboard"]["parameters"]["query"]
>
export type DashboardIndicatorQuery = NonNullable<
  operations["DashboardController_getDemographics"]["parameters"]["query"]
>
export type DashboardDemographics =
  components["schemas"]["DashboardDemographicsResponseDto"]
export type DashboardEpidemiology =
  components["schemas"]["DashboardEpidemiologyResponseDto"]
export type DashboardManagement =
  components["schemas"]["DashboardManagementResponseDto"]
export type DashboardProductivity =
  components["schemas"]["DashboardProductivityResponseDto"]
export type DashboardAdherence =
  components["schemas"]["DashboardAdherenceResponseDto"]
export type DashboardAbandonment =
  components["schemas"]["DashboardAbandonmentResponseDto"]

export const dashboardApi = {
  async get(query: DashboardQuery): Promise<Dashboard> {
    const { data, response } = await api.GET("/dashboard", {
      params: { query },
    })
    if (!data)
      throw new Error(`No se pudo obtener el dashboard (${response.status})`)
    return data
  },
}

export const dashboardIndicatorsApi = {
  async getDemographics(
    query: DashboardIndicatorQuery,
  ): Promise<DashboardDemographics> {
    const { data, response } = await api.GET(
      "/dashboard/indicators/demographics",
      { params: { query } },
    )
    if (!data)
      throw new Error(
        `No se pudo obtener los indicadores demográficos (${response.status})`,
      )
    return data
  },

  async getEpidemiology(
    query: DashboardIndicatorQuery,
  ): Promise<DashboardEpidemiology> {
    const { data, response } = await api.GET(
      "/dashboard/indicators/epidemiology",
      { params: { query } },
    )
    if (!data)
      throw new Error(
        `No se pudo obtener los indicadores epidemiológicos (${response.status})`,
      )
    return data
  },

  async getManagement(
    query: DashboardIndicatorQuery,
  ): Promise<DashboardManagement> {
    const { data, response } = await api.GET(
      "/dashboard/indicators/management",
      { params: { query } },
    )
    if (!data)
      throw new Error(
        `No se pudo obtener los indicadores de gestión (${response.status})`,
      )
    return data
  },

  async getProductivity(
    query: DashboardIndicatorQuery,
  ): Promise<DashboardProductivity> {
    const { data, response } = await api.GET(
      "/dashboard/indicators/productivity",
      { params: { query } },
    )
    if (!data)
      throw new Error(
        `No se pudo obtener los indicadores de productividad (${response.status})`,
      )
    return data
  },

  async getAdherence(
    query: DashboardIndicatorQuery,
  ): Promise<DashboardAdherence> {
    const { data, response } = await api.GET(
      "/dashboard/indicators/adherence",
      { params: { query } },
    )
    if (!data)
      throw new Error(
        `No se pudo obtener los indicadores de adherencia (${response.status})`,
      )
    return data
  },

  async getAbandonment(
    query: DashboardIndicatorQuery,
  ): Promise<DashboardAbandonment> {
    const { data, response } = await api.GET(
      "/dashboard/indicators/abandonment",
      { params: { query } },
    )
    if (!data)
      throw new Error(
        `No se pudo obtener los indicadores de abandono (${response.status})`,
      )
    return data
  },
}
