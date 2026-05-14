import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type {
  PsychooncologyAppointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  CompleteAppointmentRequest,
} from "@/types";

export const appointmentsApi = {
  list(params?: {
    patientId?: string;
    volunteerId?: string;
    upcoming?: boolean;
  }): Promise<PsychooncologyAppointment[]> {
    const query = new URLSearchParams();
    if (params?.patientId) query.set("patientId", params.patientId);
    if (params?.volunteerId) query.set("volunteerId", params.volunteerId);
    if (params?.upcoming !== undefined) query.set("upcoming", String(params.upcoming));
    const qs = query.toString();
    return apiGet<PsychooncologyAppointment[]>(
      `/api/psychooncology-appointments${qs ? `?${qs}` : ""}`,
    );
  },

  getById(id: string): Promise<PsychooncologyAppointment> {
    return apiGet<PsychooncologyAppointment>(`/api/psychooncology-appointments/${id}`);
  },

  create(data: CreateAppointmentRequest): Promise<PsychooncologyAppointment> {
    return apiPost<PsychooncologyAppointment>("/api/psychooncology-appointments", data);
  },

  update(
    id: string,
    data: UpdateAppointmentRequest,
  ): Promise<PsychooncologyAppointment> {
    return apiPut<PsychooncologyAppointment>(
      `/api/psychooncology-appointments/${id}`,
      data,
    );
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/api/psychooncology-appointments/${id}`);
  },

  complete(
    id: string,
    data: CompleteAppointmentRequest,
  ): Promise<PsychooncologyAppointment> {
    return apiPost<PsychooncologyAppointment>(
      `/api/psychooncology-appointments/${id}/complete`,
      data,
    );
  },

  cancel(id: string): Promise<PsychooncologyAppointment> {
    return apiPost<PsychooncologyAppointment>(
      `/api/psychooncology-appointments/${id}/cancel`,
    );
  },
};
