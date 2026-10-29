import { Save, X } from "lucide-react"
import type { FollowUp } from "@/api/follow-ups"
import type { PatientTimelineEvent } from "@/api/patient-timeline"
import type { PatientDetailsResponse, PatientDiagnosis, PatientTreatment } from "@/api/patients"
import { Button } from "@/components/ds/button"
import { Card, GroupLabel } from "@/components/ds/card"
import { DataList } from "@/components/ds/data"
import { Field, SelectField, TextArea } from "@/components/ds/form"
import { catalogLabel, useCatalog } from "@/hooks/use-catalog"
import { followUpPurposeLabels } from "@/lib/follow-up-labels"
import { FollowUpOutcomes } from "../../_components/follow-up-outcomes"
import { capitalize, formatDate } from "../../_lib/ficha-format"
import { FollowUpAttemptsPanel } from "./follow-up-attempts-panel"
import { CatalogValue } from "@/components/catalog-select"

// Seguimiento cerrado: qué se registró, lo que conversaron (editable), los
// intentos y la situación del paciente con lo que viene.

export type ClosedStatus = "COMPLETED" | "NO_ANSWER" | "CANCELLED"

const STATUS_OPTIONS: { value: ClosedStatus; label: string }[] = [
  { value: "COMPLETED", label: "Completado" },
  { value: "NO_ANSWER", label: "No contestó" },
  { value: "CANCELLED", label: "Cancelado" },
]

type Editing = { status: ClosedStatus; onStatus: (s: ClosedStatus) => void; onCancel: () => void; onSave: () => void; saving: boolean }

type Props = {
  followUp: FollowUp
  patient: PatientDetailsResponse | undefined
  timeline: PatientTimelineEvent[] | undefined
  notes: string
  onNotesChange: (value: string) => void
  /** Presente mientras se edita el seguimiento cerrado. */
  editing: Editing | null
  canAct: boolean
  onViewDiagnosis: (d: PatientDiagnosis) => void
  onViewTreatment: (t: PatientTreatment) => void
}

export function FollowUpClosedView({ followUp, patient, timeline, notes, onNotesChange, editing, canAct, onViewDiagnosis, onViewTreatment }: Props) {
  const event = timeline?.find((e): e is Extract<PatientTimelineEvent, { kind: "FOLLOW_UP" }> => e.kind === "FOLLOW_UP" && e.followUpId === followUp.id)
  return (
    <>
      {event?.outcomes.length ? (
        <Card title="Qué se registró" description="Lo que se guardó al completar este seguimiento">
          <FollowUpOutcomes outcomes={event.outcomes} diagnoses={patient?.diagnoses} treatments={patient?.treatments} onViewDiagnosis={onViewDiagnosis} onViewTreatment={onViewTreatment} />
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Lo que conversaron"
          action={
            editing ? (
              <div className="flex gap-2">
                <Button icon={X} onClick={editing.onCancel} disabled={editing.saving}>
                  Cancelar
                </Button>
                <Button variant="dark" icon={Save} onClick={editing.onSave} disabled={editing.saving}>
                  {editing.saving ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            ) : undefined
          }
        >
          {editing ? (
            <div className="space-y-4">
              <Field label="Estado">{(id) => <SelectField id={id} value={editing.status} onChange={editing.onStatus} options={STATUS_OPTIONS} />}</Field>
              <Field label="Nota">{(id) => <TextArea id={id} rows={5} value={notes} onChange={(e) => onNotesChange(e.target.value)} />}</Field>
            </div>
          ) : notes ? (
            <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-700">{notes}</p>
          ) : (
            <p className="text-[13px] text-zinc-500">No se registró nota.</p>
          )}
        </Card>
        <FollowUpAttemptsPanel followUp={followUp} canRegister={canAct} registering={false} />
      </div>
      {patient && <GlanceCard patient={patient} timeline={timeline} />}
    </>
  )
}

const UPCOMING_LABELS: Partial<Record<PatientTimelineEvent["kind"], string>> = { REMINDER: "Recordatorio", PSYCHOONCOLOGY_APPOINTMENT: "Sesión de psicooncología" }

/** Situación del paciente de un vistazo y lo que tiene agendado. */
function GlanceCard({ patient, timeline }: { patient: PatientDetailsResponse; timeline: PatientTimelineEvent[] | undefined }) {
  const { data: cancers = [] } = useCatalog("cancer_diagnosis")
  const { data: stages = [] } = useCatalog("cancer_stage")
  const { data: types = [] } = useCatalog("treatment_type")
  const { data: insurances = [] } = useCatalog("insurance_type")
  const diagnoses = patient.diagnoses.filter((d) => d.isCurrent)
  const treatments = patient.treatments.filter((t) => t.isCurrent)
  const insurance = patient.insurance.find((i) => i.isCurrent)
  const now = new Date().toISOString()
  const upcoming = (timeline ?? [])
    .filter((e) => e.occurredAt > now)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .slice(0, 4)
    .map((e) => ({ id: e.id, date: e.occurredAt, text: e.kind === "FOLLOW_UP" ? (followUpPurposeLabels[e.purpose] ?? "Seguimiento") : (UPCOMING_LABELS[e.kind] ?? "Pendiente") }))

  return (
    <Card title="De un vistazo">
      <DataList
        labelWidth={120}
        items={[
          ["Situación de salud", patient.details?.healthSubcategory ? <CatalogValue kind="patient_health_subcategory" code={patient.details.healthSubcategory} /> : patient.details?.healthPhase ? <CatalogValue kind="patient_health_phase" code={patient.details.healthPhase} /> : "Sin clasificar"],
          ["Diagnóstico", diagnoses.length ? diagnoses.map((d) => `${catalogLabel(cancers, d.diagnosis)}${d.cancerStage ? `, ${catalogLabel(stages, d.cancerStage).toLowerCase()}` : ""}`).join("; ") : "Sin diagnóstico activo"],
          ["Tratamiento", treatments.length ? treatments.map((t) => `${catalogLabel(types, t.treatmentType)}${t.scheduledSessions ? `, sesión ${t.completedSessions ?? 0} de ${t.scheduledSessions}` : ""}`).join("; ") : "Sin tratamiento activo"],
          ["Seguro", insurance ? catalogLabel(insurances, insurance.insuranceType) : "Sin seguro registrado"],
        ]}
      />
      <GroupLabel>Lo que viene</GroupLabel>
      {upcoming.length ? (
        <ul className="mt-1 space-y-2 px-1 text-[13px]">
          {upcoming.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3">
              <span className="font-medium">{u.text}</span>
              <span className="shrink-0 text-zinc-500 tabular-nums">{capitalize(formatDate(u.date) ?? "")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-1 py-2 text-[13px] text-zinc-500">Nada agendado.</p>
      )}
    </Card>
  )
}
