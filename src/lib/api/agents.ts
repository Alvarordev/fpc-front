import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type { Agent, CreateAgentRequest, UpdateAgentRequest } from "@/types";

export const agentsApi = {
  list(): Promise<Agent[]> {
    return apiGet<Agent[]>("/agents");
  },

  getById(id: string): Promise<Agent> {
    return apiGet<Agent>(`/agents/${id}`);
  },

  create(data: CreateAgentRequest): Promise<Agent> {
    return apiPost<Agent>("/agents", data);
  },

  update(id: string, data: UpdateAgentRequest): Promise<Agent> {
    return apiPut<Agent>(`/agents/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/agents/${id}`);
  },
};
