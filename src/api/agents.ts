import type { components } from "./schema"
import { api } from "./client"

export type Agent = components["schemas"]["AgentResponseDto"]

export class AgentsApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo obtener la lista de agentes")
    this.name = "AgentsApiError"
    this.status = status
  }
}

export const agentsApi = {
  async list(): Promise<Agent[]> {
    const { data, response } = await api.GET("/agents")

    if (!data) {
      throw new AgentsApiError(response.status)
    }

    return data
  },
}
