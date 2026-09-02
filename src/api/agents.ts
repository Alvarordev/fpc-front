import type { components } from "./schema"
import { api } from "./client"

export type Agent = components["schemas"]["AgentResponseDto"]
export type CreateAgentInput = components["schemas"]["CreateAgentDto"]
export type UpdateAgentInput = components["schemas"]["UpdateAgentDto"]

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

  async create(input: CreateAgentInput): Promise<Agent> {
    const { data, response } = await api.POST("/agents", { body: input })
    if (!data) throw new AgentsApiError(response.status)
    return data
  },

  async update(id: string, input: UpdateAgentInput): Promise<Agent> {
    const { data, response } = await api.PATCH("/agents/{id}", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw new AgentsApiError(response.status)
    return data
  },
}
