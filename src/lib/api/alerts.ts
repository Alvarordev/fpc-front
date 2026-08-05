import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type {
  Alert,
  AlertEvent,
  AddAlertEventRequest,
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

  getByTicketNumber(ticketNumber: string): Promise<{ alert: Alert; events: AlertEvent[]; totalTimelineEvents: number }> {
    return apiGet(`/api/alerts/ticket/${ticketNumber}`);
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

  getEvents(id: string): Promise<AlertEvent[]> {
    return apiGet<AlertEvent[]>(`/api/alerts/${id}/events`);
  },

  addEvent(id: string, data: AddAlertEventRequest): Promise<AlertEvent> {
    return apiPost<AlertEvent>(`/api/alerts/${id}/events`, data);
  },

  generateAISummary(id: string): Promise<Alert> {
    return apiPost<Alert>(`/api/alerts/${id}/ai-summary`);
  },
};
