import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicalAppointmentsApi } from "@/lib/api";
import type {
  MedicalAppointmentResponse,
  CreateStandaloneAppointmentRequest,
  UpdateMedicalAppointmentRequest,
} from "@/types";

export function useMedicalAppointments() {
  return useQuery<MedicalAppointmentResponse[]>({
    queryKey: ["medical-appointments"],
    queryFn: () => medicalAppointmentsApi.list(),
    staleTime: 15 * 1000,
  });
}

export function useCreateMedicalAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStandaloneAppointmentRequest) =>
      medicalAppointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useUpdateMedicalAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMedicalAppointmentRequest;
    }) => medicalAppointmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
