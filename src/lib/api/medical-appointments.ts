import { apiGet, apiPost, apiPut } from "@/lib/api-client";
import type {
  MedicalAppointmentResponse,
  CreateStandaloneAppointmentRequest,
  UpdateMedicalAppointmentRequest,
} from "@/types";

export const medicalAppointmentsApi = {
  list(): Promise<MedicalAppointmentResponse[]> {
    return apiGet<MedicalAppointmentResponse[]>("/api/medical-appointments");
  },

  create(
    data: CreateStandaloneAppointmentRequest
  ): Promise<MedicalAppointmentResponse> {
    return apiPost<MedicalAppointmentResponse>("/api/medical-appointments", data);
  },

  update(
    id: string,
    data: UpdateMedicalAppointmentRequest
  ): Promise<MedicalAppointmentResponse> {
    return apiPut<MedicalAppointmentResponse>(`/api/medical-appointments/${id}`, data);
  },
};
