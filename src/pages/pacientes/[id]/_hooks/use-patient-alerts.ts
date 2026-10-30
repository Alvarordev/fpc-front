import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { alertsApi, type Alert } from "@/api/alerts"
import type { PatientDetailsResponse } from "@/api/patients"

/**
 * Open alerts for a patient: REPORTED or IN_REVIEW.
 * The list endpoint filters by patientId.
 */
export function usePatientAlerts(patient: PatientDetailsResponse | undefined) {
  const { data: allAlerts = [], isLoading } = useQuery({
    queryKey: ["alerts", "patient", patient?.id],
    queryFn: () => alertsApi.list({ patientId: patient!.id }),
    staleTime: 30 * 1000,
    enabled: Boolean(patient),
  })

  const alerts = useMemo(
    () => allAlerts.filter((alert): alert is Alert => alert.status !== "RESOLVED"),
    [allAlerts],
  )

  return { alerts, isLoading }
}
