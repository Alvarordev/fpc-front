import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  medicalAppointmentsApi,
  type MedicalAppointment,
  type CreateMedicalAppointmentInput,
  type UpdateMedicalAppointmentInput,
} from "@/api/medical-appointments";

export function useMedicalAppointments() {
  return useQuery<MedicalAppointment[]>({
    queryKey: ["medical-appointments"],
    queryFn: () => medicalAppointmentsApi.list(),
    staleTime: 15 * 1000,
  });
}

export function useCreateMedicalAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicalAppointmentInput) =>
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
      data: UpdateMedicalAppointmentInput;
    }) => medicalAppointmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
