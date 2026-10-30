import type { Values } from "@/components/ds/questions"
import type { EnrollmentDraft } from "../../../_store/enrollment-store"

export function datosValues(draft: EnrollmentDraft): Values {
  const meta = draft.enrollmentMetadata
  return {
    dataPolicy: meta.dataPolicyAccepted === true ? "yes" : meta.dataPolicyAccepted === false ? "no" : null,
    affiliation: meta.affiliationType ?? null,
  }
}

export function applyDatos(draft: EnrollmentDraft, id: string, value: string | null): Partial<EnrollmentDraft> {
  const meta = draft.enrollmentMetadata
  if (id === "dataPolicy") {
    return {
      enrollmentMetadata: {
        ...meta,
        dataPolicyAccepted: value === "yes" ? true : value === "no" ? false : undefined,
      },
    }
  }
  if (id === "affiliation") {
    return {
      enrollmentMetadata: {
        ...meta,
        affiliationType: value === "PATIENT" || value === "FAMILY" ? value : undefined,
      },
      patientData: {
        ...draft.patientData,
        role: value === "PATIENT" ? "PATIENT" : value === "FAMILY" ? "COMPANION" : draft.patientData.role,
      },
    }
  }
  return {}
}
