import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { alertsApi, type Alert } from "@/api/alerts"
import { patientTimelineApi } from "@/api/patient-timeline"
import type { PatientDetailsResponse } from "@/api/patients"

function collectPatientHealthCenterIds(patient: PatientDetailsResponse): Set<string> {
  const ids = new Set<string>()

  for (const dx of patient.diagnoses) {
    if (dx.healthCenterId) ids.add(dx.healthCenterId)
  }
  for (const tx of patient.treatments) {
    if (tx.healthCenterId) ids.add(tx.healthCenterId)
  }
  for (const appt of patient.medicalAppointments) {
    if (appt.healthCenterId) ids.add(appt.healthCenterId)
  }

  return ids
}

/**
 * Fetches alerts relevant to a patient by matching:
 * 1. The alert's healthCenterId matches a hospital the patient has attended
 *    (via diagnoses, treatments, or medical appointments)
 * 2. The alert's followUpId belongs to one of this patient's follow-ups
 *
 * There is no patientId filter on the alerts endpoint, so this replicates
 * client-side what main did with contacts (now follow-ups).
 * Only ACTIVE (non-resolved) alerts are considered.
 */
export function usePatientAlerts(patient: PatientDetailsResponse | undefined) {
  const patientHospitalIds = useMemo(
    () => (patient ? collectPatientHealthCenterIds(patient) : new Set<string>()),
    [patient],
  )

  const { data: timeline, isLoading: isTimelineLoading } = useQuery({
    queryKey: ["patient-timeline", patient?.id],
    queryFn: () => patientTimelineApi.list(patient!.id),
    enabled: Boolean(patient),
  })

  const patientFollowUpIds = useMemo(() => {
    const ids = new Set<string>()
    for (const event of timeline?.data ?? []) {
      if (event.kind === "FOLLOW_UP") ids.add(event.followUpId)
    }
    return ids
  }, [timeline])

  const { data: allAlerts = [], isLoading: isAlertsLoading } = useQuery({
    queryKey: ["alerts", "active"],
    queryFn: () => alertsApi.list({ status: "ACTIVE" }),
    staleTime: 30 * 1000,
    enabled: Boolean(patient),
  })

  const matchedAlerts = useMemo(() => {
    if (!patient || patientHospitalIds.size === 0 || patientFollowUpIds.size === 0) {
      return []
    }

    return allAlerts.filter(
      (alert): alert is Alert =>
        patientHospitalIds.has(alert.healthCenterId) &&
        patientFollowUpIds.has(alert.followUpId),
    )
  }, [allAlerts, patient, patientHospitalIds, patientFollowUpIds])

  return { alerts: matchedAlerts, isLoading: isTimelineLoading || isAlertsLoading }
}
