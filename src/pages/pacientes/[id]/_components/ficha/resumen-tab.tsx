import type { PatientDetailsResponse } from "@/api/patients"
import { useAuthStore } from "@/store/auth-store"
import { PatientCareJourneyBoard } from "../patient-care-journey-board"
import { PatientChangeLog } from "../patient-change-log"
import { PatientReferralsSection } from "../patient-referrals-section"
import { PatientSurveysSection } from "../patient-surveys-section"
import { ActivityCard, CaseSummaryCard } from "./resumen-activity"
import { ComorbiditiesCard, DiagnosesCard, TreatmentsCard } from "./resumen-clinical-cards"
import { ContactCard, InsuranceCard, OriginCard, PersonalDataCard, SocioCard } from "./resumen-data-cards"

// Resumen de la ficha: el caso, lo que pasó, quién es, su salud y su recorrido.

export function ResumenTab({ patient }: { patient: PatientDetailsResponse }) {
  // El historial completo de cambios de la ficha es solo para admin.
  const isAdmin = useAuthStore((state) => state.user?.role) === "ADMIN"
  return (
    <div className="space-y-4">
      <CaseSummaryCard patientId={patient.id} fallback={patient.summary} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <ActivityCard patientId={patient.id} />
        <PersonalDataCard patient={patient} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <DiagnosesCard patient={patient} />
        <TreatmentsCard patient={patient} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ComorbiditiesCard patient={patient} />
        <ContactCard patient={patient} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <OriginCard patient={patient} />
        <SocioCard patient={patient} />
        <InsuranceCard patient={patient} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <PatientReferralsSection patientId={patient.id} />
        <PatientSurveysSection patientId={patient.id} enabled={patient.status === "ENROLLED"} />
      </div>
      <PatientCareJourneyBoard patient={patient} />
      {isAdmin && <PatientChangeLog patientId={patient.id} />}
    </div>
  )
}
