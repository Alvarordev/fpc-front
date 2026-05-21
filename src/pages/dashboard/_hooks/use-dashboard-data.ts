import { useQuery } from "@tanstack/react-query";
import { appointmentsApi, healthCentersApi } from "@/lib/api";
import { usePatients } from "@/pages/pacientes/_hooks/use-patients";
import type { HealthCenter, PsychooncologyAppointment } from "@/types";

export function useDashboardData() {
  const patientsQuery = usePatients();

  const appointmentsQuery = useQuery<PsychooncologyAppointment[]>({
    queryKey: ["dashboardAppointments"],
    queryFn: () => appointmentsApi.list(),
    staleTime: 60 * 1000,
  });

  const healthCentersQuery = useQuery<HealthCenter[]>({
    queryKey: ["dashboardHealthCenters"],
    queryFn: () => healthCentersApi.list(),
    staleTime: 60 * 1000,
  });

  return {
    patients: patientsQuery.data ?? [],
    appointments: appointmentsQuery.data ?? [],
    healthCenters: healthCentersQuery.data ?? [],
    isLoading:
      patientsQuery.isLoading ||
      appointmentsQuery.isLoading ||
      healthCentersQuery.isLoading,
    isError:
      patientsQuery.isError ||
      appointmentsQuery.isError ||
      healthCentersQuery.isError,
    error:
      patientsQuery.error ??
      appointmentsQuery.error ??
      healthCentersQuery.error ??
      null,
  };
}
