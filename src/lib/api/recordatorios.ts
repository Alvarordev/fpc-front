import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type {
  Reminder,
  CreateReminderRequest,
  UpdateReminderRequest,
} from "@/types";

export const recordatoriosApi = {
  list(patientId: string): Promise<Reminder[]> {
    return apiGet<Reminder[]>(`/api/recordatorios?patientId=${patientId}`);
  },

  getById(id: string): Promise<Reminder> {
    return apiGet<Reminder>(`/api/recordatorios/${id}`);
  },

  create(data: CreateReminderRequest): Promise<Reminder> {
    return apiPost<Reminder>("/api/recordatorios", data);
  },

  update(id: string, data: UpdateReminderRequest): Promise<Reminder> {
    return apiPut<Reminder>(`/api/recordatorios/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/api/recordatorios/${id}`);
  },

  complete(id: string): Promise<Reminder> {
    return apiPost<Reminder>(`/api/recordatorios/${id}/complete`);
  },

  cancel(id: string): Promise<Reminder> {
    return apiPost<Reminder>(`/api/recordatorios/${id}/cancel`);
  },
};
