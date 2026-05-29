import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { alertsApi } from "@/lib/api";
import type { Alert, Patient } from "@/types";

/**
 * Collects all unique healthCenterIds from a patient's diagnoses,
 * treatments, and medical appointments.
 */
function collectPatientHealthCenterIds(patient: Patient): Set<string> {
  const ids = new Set<string>();

  for (const dx of patient.diagnoses ?? []) {
    if (dx.healthCenterId) ids.add(dx.healthCenterId);
  }
  for (const tx of patient.treatments ?? []) {
    if (tx.healthCenterId) ids.add(tx.healthCenterId);
  }
  for (const appt of patient.medicalAppointments ?? []) {
    if (appt.healthCenterId) ids.add(appt.healthCenterId);
  }

  return ids;
}

/**
 * Fetches alerts relevant to a patient by matching:
 * 1. The alert's healthCenterId matches a hospital the patient has attended
 *    (via diagnoses, treatments, or medical appointments)
 * 2. The alert's contactId belongs to this patient's contacts
 *
 * Only ACTIVE (non-resolved) alerts are considered.
 */
export function usePatientAlerts(patient: Patient | undefined) {
  const patientHospitalIds = useMemo(
    () => (patient ? collectPatientHealthCenterIds(patient) : new Set<string>()),
    [patient],
  );

  const patientContactIds = useMemo(
    () => new Set((patient?.contacts ?? []).map((c) => c.id)),
    [patient],
  );

  const { data: allAlerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["alerts", "active"],
    queryFn: () => alertsApi.list({ status: "ACTIVE" }),
    staleTime: 30 * 1000,
    enabled: Boolean(patient),
  });

  const matchedAlerts = useMemo(() => {
    if (!patient || patientHospitalIds.size === 0 || patientContactIds.size === 0) {
      return [];
    }

    return allAlerts.filter(
      (alert) =>
        patientHospitalIds.has(alert.healthCenterId) &&
        patientContactIds.has(alert.contactId),
    );
  }, [allAlerts, patient, patientHospitalIds, patientContactIds]);

  return { alerts: matchedAlerts, isLoading };
}
