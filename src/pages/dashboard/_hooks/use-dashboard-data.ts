import { useQuery } from "@tanstack/react-query";
import { alertsApi, appointmentsApi, contactsApi, healthCentersApi, volunteersApi } from "@/lib/api";
import { usePatients } from "@/pages/pacientes/_hooks/use-patients";
import type { Alert, Contact, HealthCenter, PsychooncologyAppointment, Volunteer } from "@/types";

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

  const alertsQuery = useQuery<Alert[]>({
    queryKey: ["dashboardAlerts"],
    queryFn: () => alertsApi.list({ status: "ACTIVE" }),
    staleTime: 30 * 1000,
  });

  const upcomingSessionsQuery = useQuery<PsychooncologyAppointment[]>({
    queryKey: ["dashboardUpcomingSessions"],
    queryFn: () => appointmentsApi.list({ upcoming: true }),
    staleTime: 30 * 1000,
  });

  const volunteersQuery = useQuery<Volunteer[]>({
    queryKey: ["dashboardVolunteers"],
    queryFn: () => volunteersApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const contactsQuery = useQuery<Contact[]>({
    queryKey: ["dashboardContacts"],
    queryFn: () => contactsApi.list(),
    staleTime: 30 * 1000,
  });

  const allLoading =
    patientsQuery.isLoading ||
    appointmentsQuery.isLoading ||
    healthCentersQuery.isLoading;
  const operationalLoading =
    alertsQuery.isLoading ||
    upcomingSessionsQuery.isLoading ||
    volunteersQuery.isLoading ||
    contactsQuery.isLoading;

  return {
    patients: patientsQuery.data ?? [],
    appointments: appointmentsQuery.data ?? [],
    healthCenters: healthCentersQuery.data ?? [],
    activeAlerts: alertsQuery.data ?? [],
    upcomingSessions: (upcomingSessionsQuery.data ?? []).filter(
      (s) => s.status === "SCHEDULED",
    ),
    volunteers: volunteersQuery.data ?? [],
    contacts: contactsQuery.data ?? [],
    isLoading: allLoading,
    isOperationalLoading: operationalLoading,
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
