import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { SlidingTabs } from "@/components/ds/sliding-tabs"
import { enrollmentsApi } from "@/api/enrollments"
import { patientsApi, type PatientDiagnosis, type PatientTreatment } from "@/api/patients"
import { cn } from "@/lib/utils"
import { usePatient } from "../../../_hooks/use-patient"
import { usePatientAddresses, usePatientSocialNotes } from "../../../_hooks/use-patient-records"
import { AntecedentesTab } from "./antecedentes-tab"
import { ContactoTab } from "./contacto-tab"
import { DatosTab } from "./datos-tab"
import { DiagnosticoTab } from "./diagnostico-tab"
import { DireccionesTab } from "./direcciones-tab"
import { SeguroTab } from "./seguro-tab"
import { SintomasTab } from "./sintomas-tab"
import { SocialTab } from "./social-tab"
import { TratamientosTab } from "./tratamientos-tab"
import { SHEET_TABS, type SheetTabId } from "./sheet-tabs"
import type { SheetTabProps } from "./sheet-types"

// Ficha clínica del seguimiento: nueve pestañas con las preguntas que el agente
// hace. Las respuestas quedan en el borrador y se guardan al completar; las
// pestañas con cambios se marcan. Todas quedan montadas para no perder lo escrito.


export type ClinicalSheetProps = SheetTabProps & {
  patientId: string
  /** Obligatorio en el seguimiento; en la carga histórica puede no existir todavía. */
  followUpId?: string
  onViewDiagnosis?: (diagnosis: PatientDiagnosis) => void
  onViewTreatment?: (treatment: PatientTreatment) => void
  /** La carga histórica deja el contacto en borrador y no ofrece correcciones. */
  variant?: "operational" | "historical"
}

export function ClinicalSheet({ patientId, followUpId = "", drafts, onDraftsChange, onViewDiagnosis, onViewTreatment, variant = "operational" }: ClinicalSheetProps) {
  const historical = variant === "historical"
  const [tab, setTab] = useState<SheetTabId>("datos")
  const { data: patient } = usePatient(patientId)
  const { data: enrollments } = useQuery({ queryKey: ["patient-enrollments", patientId], queryFn: () => enrollmentsApi.listByPatient(patientId), enabled: Boolean(patientId), staleTime: 30_000 })
  const status = useQuery({ queryKey: ["patient-diagnostic-status-current", patientId], queryFn: () => patientsApi.getCurrentDiagnosticStatus(patientId) })
  const { data: companions = [] } = useQuery({ queryKey: ["patient-companions", patientId], queryFn: () => patientsApi.companions(patientId), enabled: Boolean(patientId), staleTime: 30_000 })
  const { data: addresses = [] } = usePatientAddresses(patientId)
  const { data: socialNotes = [] } = usePatientSocialNotes(patientId)

  if (!patient || enrollments === undefined || status.isLoading) return <p className="py-6 text-center text-[13px] text-zinc-500">Cargando la ficha…</p>

  const latest = enrollments[0]
  const primaryCareQuestions = !latest || (latest.currentlyAttendingConsultations === false && latest.currentlyReceivingTreatment === false)
  const current = status.data
  const locked = patient.details?.healthPhase === "CANCER_DIAGNOSIS" && !current && !drafts.diagnosticStatus
  const enrollmentReport = patient.symptomReports.filter((r) => r.enrollmentId !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const tabProps = { drafts, onDraftsChange }

  const panels: Record<SheetTabId, React.ReactNode> = {
    datos: <DatosTab {...tabProps} details={patient.details} hasDiagnosis={patient.diagnoses.some((d) => d.isCurrent)} />,
    sintomas: (
      <SintomasTab
        {...tabProps}
        enrollmentReport={enrollmentReport}
        primaryCareQuestions={primaryCareQuestions}
        current={current}
        locked={locked}
        ruledOutEventId={drafts.diagnosticStatus ? null : current?.status === "RULED_OUT" ? current.id : null}
      />
    ),
    diagnostico: <DiagnosticoTab {...tabProps} current={patient.diagnoses.filter((d) => d.isCurrent)} allowCorrections={!historical} onViewDiagnosis={onViewDiagnosis} />,
    tratamiento: <TratamientosTab {...tabProps} patientId={patientId} diagnoses={patient.diagnoses} treatments={patient.treatments} onViewTreatment={onViewTreatment} />,
    antecedentes: <AntecedentesTab {...tabProps} assessments={patient.healthBackgroundAssessments} />,
    contacto: <ContactoTab key={companions.map((l) => l.id).join()} {...tabProps} patient={patient} companions={companions} followUpId={followUpId} historical={historical} />,
    direcciones: <DireccionesTab {...tabProps} addresses={addresses} />,
    seguro: <SeguroTab {...tabProps} currentInsurance={patient.insurance.find((i) => i.isCurrent)} currentSis={patient.sisAffiliations[0]} />,
    social: <SocialTab {...tabProps} details={patient.details} existingNotes={socialNotes} />,
  }

  return (
    <div className="space-y-5">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <SlidingTabs label="Secciones de la ficha clínica" value={tab} onChange={setTab} options={SHEET_TABS.map((t) => ({ id: t.id, label: t.label, marked: t.changed(drafts) }))} />
      </div>
      {SHEET_TABS.map((t) => (
        <div key={t.id} hidden={tab !== t.id} className={cn(tab === t.id && "animate-in fade-in-0 duration-200 motion-reduce:animate-none")}>
          {panels[t.id]}
        </div>
      ))}
    </div>
  )
}
