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
}
