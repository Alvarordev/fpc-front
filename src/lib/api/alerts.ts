import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type {
  Alert,
  AlertStatus,
  CreateAlertRequest,
  UpdateAlertRequest,
  ResolveAlertRequest,
} from "@/types";

export const alertsApi = {
  list(params?: {
    healthCenterId?: string;
    status?: AlertStatus;
    agentId?: string;
  }): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (params?.healthCenterId) query.set("healthCenterId", params.healthCenterId);
    if (params?.status) query.set("status", params.status);
    if (params?.agentId) query.set("agentId", params.agentId);
    const qs = query.toString();
    return apiGet<Alert[]>(`/api/alerts${qs ? `?${qs}` : ""}`);
  },

  getById(id: string): Promise<Alert> {
    return apiGet<Alert>(`/api/alerts/${id}`);
  },

  create(data: CreateAlertRequest): Promise<Alert> {
    return apiPost<Alert>("/api/alerts", data);
  },

  update(id: string, data: UpdateAlertRequest): Promise<Alert> {
    return apiPut<Alert>(`/api/alerts/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/api/alerts/${id}`);
  },

  resolve(id: string, data: ResolveAlertRequest): Promise<Alert> {
    return apiPost<Alert>(`/api/alerts/${id}/resolve`, data);
  },
};
