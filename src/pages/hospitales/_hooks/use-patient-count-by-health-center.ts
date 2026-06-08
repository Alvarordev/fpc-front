import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "@/lib/api/patients";

/**
 * Fetches all patients and builds a Map<healthCenterId, count>.
 *
 * A patient is considered associated with a health center if any of their
 * diagnoses, treatments, or medical appointments reference that center.
 */
export function usePatientCountByHealthCenter() {
  return useQuery({
    queryKey: ["patientCountByHealthCenter"],
    queryFn: async () => {
      const patients = await patientsApi.list();

      const countByCenter = new Map<string, number>();

      for (const p of patients) {
        const seenCenters = new Set<string>();

        for (const d of p.diagnoses ?? []) {
          if (d.healthCenterId) seenCenters.add(d.healthCenterId);
        }
        for (const t of p.treatments ?? []) {
          if (t.healthCenterId) seenCenters.add(t.healthCenterId);
        }
        for (const a of p.medicalAppointments ?? []) {
          if (a.healthCenterId) seenCenters.add(a.healthCenterId);
        }

        for (const centerId of seenCenters) {
          countByCenter.set(centerId, (countByCenter.get(centerId) ?? 0) + 1);
        }
      }

      return countByCenter;
    },
    staleTime: 120 * 1000,
  });
}
