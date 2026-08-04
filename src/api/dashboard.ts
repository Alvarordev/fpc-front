import type { components, operations } from "./schema"
import { api } from "./client"

export type Dashboard = components["schemas"]["DashboardResponseDto"]
export type DashboardQuery = NonNullable<operations["DashboardController_getDashboard"]["parameters"]["query"]>

export const dashboardApi = {
  async get(query: DashboardQuery): Promise<Dashboard> {
    const { data, response } = await api.GET("/dashboard", { params: { query } })
    if (!data) throw new Error(`No se pudo obtener el dashboard (${response.status})`)
    return data
  },
}
