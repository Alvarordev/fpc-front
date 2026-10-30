import { useState } from "react"
import { Stethoscope } from "lucide-react"
import { toast } from "sonner"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Item } from "@/components/ds/card"
import { FormModal } from "@/components/ds/form-modal"
import { is, type Group, type Values } from "@/components/ds/questions"
import { RecordSection, type PendingRecord } from "@/components/ds/record-section"
import type { PatientDiagnosis } from "@/api/patients"
import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { catalogLabel, useCatalog } from "@/hooks/use-catalog"
import { normalizeDuration, toDurationInput } from "@/types/duration"
import { fixedWaitTimeRecallFrom, WAIT_TIME_RECALL_OPTIONS, type FixedWaitTimeRecall } from "@/types/wait-time-recall"
import { formatDate } from "../../../_lib/ficha-format"
import type { DiagnosisDecisionMode, DiagnosisDraft } from "../clinical-drafts"
import { compact, fromBool, fromDuration, text, toBool, toDuration } from "./answers"
import type { SheetTabProps } from "./sheet-types"

// Diagnóstico: los activos, su corrección (cambia solo lo mal registrado) y los
// nuevos, en paralelo o reemplazando a uno activo. Todo queda en borrador.

const detailQuestions: Group = {
  title: "Datos del diagnóstico",
  questions: [
    { id: "specialty", label: "Especialidad del diagnóstico", type: "select", catalog: "medical_specialty" },
    { id: "stage", label: "Etapa", type: "select", catalog: "cancer_stage" },
    { id: "firstSymptoms", label: "Fecha de los primeros síntomas", type: "date" },
    { id: "diagnosisDate", label: "Fecha de diagnóstico", type: "date" },
    { id: "center", label: "Establecimiento donde se diagnosticó", type: "select", catalog: HEALTH_CENTER, wide: true },
    { id: "symptom", label: "Síntoma que llevó a consulta", type: "text", placeholder: "Ej: bulto en el seno" },
    { id: "sepaReferral", label: "¿Diagnóstico con derivación activa de SEPA?", type: "yesno" },
    { id: "evolution", label: "Evolución de la enfermedad", type: "textarea", placeholder: "Cómo ha avanzado desde el diagnóstico" },
    { id: "report", label: "¿Tiene informe médico?", type: "yesno" },
  ],
}

const waitQuestions: Group = {
  title: "Tiempo de espera",
  description: "Si recuerda y dejas el tiempo vacío, se calcula con las fechas de síntomas y diagnóstico.",
  questions: [
    { id: "waitRecall", label: "¿Recuerda el tiempo de espera para el diagnóstico?", type: "select", options: WAIT_TIME_RECALL_OPTIONS, required: true },
    { id: "wait", label: "Tiempo de espera para el diagnóstico", type: "duration", units: ["DAY", "WEEK", "MONTH", "YEAR"], showIf: is("waitRecall", "REMEMBERS") },
  ],
}

function newGroups(replaceable: { value: string; label: string }[]): Group[] {
  return [
    {
      title: "Diagnóstico",
      questions: [
        { id: "diagnosis", label: "Diagnóstico", type: "select", catalog: "cancer_diagnosis", required: true, wide: true },
        ...(replaceable.length
          ? [
              {
                id: "mode",
                label: "¿Reemplaza a un diagnóstico actual?",
                type: "choice" as const,
                required: true,
                wide: true,
                options: [
                  { value: "PARALLEL", label: "No, es adicional" },
                  { value: "REPLACE", label: "Sí, reemplaza a uno" },
                ],
              },
              { id: "replaces", label: "Diagnóstico que reemplaza", type: "select" as const, options: replaceable, required: true, showIf: is("mode", "REPLACE"), hint: "Deja de estar activo y queda en el historial." },
            ]
          : []),
      ],
    },
    detailQuestions,
    waitQuestions,
  ]
}

const correctionGroups: Group[] = [
  {
    title: "Corrección",
    questions: [{ id: "reason", label: "Motivo de la corrección", type: "textarea", required: true, placeholder: "Ej: la etapa se cargó mal en el enrolamiento", hint: "Queda en el historial junto con los valores anteriores." }],
  },
  detailQuestions,
  waitQuestions,
]

function fromDiagnosis(d: PatientDiagnosis): Values {
  const recall = fixedWaitTimeRecallFrom(d.waitTimeForDiagnosis)
  return compact({
    diagnosis: d.diagnosis,
    specialty: d.diagnosisSpecialty,
    stage: d.cancerStage,
    firstSymptoms: d.firstSymptomsDate,
    diagnosisDate: d.diagnosisDate,
    center: d.healthCenterId,
    symptom: d.symptomLeadingToCheckup,
    sepaReferral: fromBool(d.isSepaActiveReferral),
    evolution: d.diseaseEvolution,
    report: fromBool(d.hasMedicalReport ?? false),
    waitRecall: recall ?? "REMEMBERS",
    // Solo el tiempo informado se precarga; el calculado se vuelve a calcular.
    wait: !recall && d.waitTimeSource === "REPORTED" ? fromDuration(normalizeDuration(d.waitTimeForDiagnosis)) : null,
  })
}

function fromDraft(d: DiagnosisDraft): Values {
  return compact({
    diagnosis: d.diagnosis,
    mode: d.mode === "EDIT" ? undefined : d.mode,
    replaces: d.replacementDiagnosisId,
    reason: d.changeReason,
    specialty: d.diagnosisSpecialty,
    stage: d.cancerStage,
    firstSymptoms: d.firstSymptomsDate,
    diagnosisDate: d.diagnosisDate,
    center: d.healthCenterId,
    symptom: d.symptomLeadingToCheckup,
    sepaReferral: fromBool(d.isSepaActiveReferral),
    evolution: d.diseaseEvolution,
    report: fromBool(d.hasMedicalReport),
    waitRecall: d.remembersWaitTimeForDiagnosis === false ? (d.waitTimeRecall ?? "DOES_NOT_REMEMBER") : "REMEMBERS",
    wait: d.waitTimeForDiagnosisManuallyEdited ? fromDuration(d.waitTimeForDiagnosis) : null,
  })
}

function toDraft(v: Values, base: { draftId: string; editedDiagnosisId?: string }): DiagnosisDraft | string {
  const remembers = v.waitRecall === "REMEMBERS"
  const wait = remembers ? toDuration(v.wait) : undefined
  if (wait && !toDurationInput(wait)) return "Completa correctamente el tiempo de espera"
  if (v.firstSymptoms && v.diagnosisDate && v.diagnosisDate < v.firstSymptoms) return "La fecha de diagnóstico no puede ser anterior a los primeros síntomas"
  const mode: DiagnosisDraft["mode"] = base.editedDiagnosisId ? "EDIT" : ((v.mode ?? "PARALLEL") as DiagnosisDecisionMode)
  return {
    draftId: base.draftId,
    mode,
    diagnosis: v.diagnosis!,
    diagnosisSpecialty: text(v.specialty),
    isSepaActiveReferral: toBool(v.sepaReferral),
    cancerStage: (v.stage ?? undefined) as DiagnosisDraft["cancerStage"],
    diagnosisDate: v.diagnosisDate ?? undefined,
    firstSymptomsDate: v.firstSymptoms ?? undefined,
    healthCenterId: v.center ?? undefined,
    symptomLeadingToCheckup: text(v.symptom),
    diseaseEvolution: text(v.evolution),
    waitTimeForDiagnosis: wait,
    waitTimeForDiagnosisManuallyEdited: Boolean(wait),
    remembersWaitTimeForDiagnosis: remembers,
    waitTimeRecall: remembers ? undefined : (v.waitRecall as FixedWaitTimeRecall),
    hasMedicalReport: toBool(v.report) ?? false,
    ...(mode === "EDIT" ? { editedDiagnosisId: base.editedDiagnosisId, changeReason: text(v.reason) } : mode === "REPLACE" ? { replacementDiagnosisId: v.replaces ?? undefined } : {}),
  }
}

const newDraftId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

type Editing = { draftId: string; editedDiagnosisId?: string; title: string; initial: Values }

type Props = SheetTabProps & {
  current: PatientDiagnosis[]
  /** Corregir en el sitio no se ofrece en la carga histórica. */
  allowCorrections: boolean
  onViewDiagnosis?: (diagnosis: PatientDiagnosis) => void
}

export function DiagnosticoTab({ drafts, onDraftsChange, current, allowCorrections, onViewDiagnosis }: Props) {
  const [editing, setEditing] = useState<Editing | null>(null)
  const { data: cancers = [] } = useCatalog("cancer_diagnosis")
  const { data: stages = [] } = useCatalog("cancer_stage")
  const decisions = drafts.diagnoses ?? []
  const name = (code: string | null | undefined) => catalogLabel(cancers, code)
  const stage = (code: string | null | undefined) => (code ? catalogLabel(stages, code) : "Etapa sin dato")

  const save = (next: DiagnosisDraft[]) => onDraftsChange((prev) => ({ ...prev, diagnoses: next.length ? next : undefined }))
  const others = decisions.filter((d) => d.draftId !== editing?.draftId)
  const replaceable = current
    .filter((d) => !others.some((o) => o.replacementDiagnosisId === d.id || o.editedDiagnosisId === d.id))
    .map((d) => ({ value: d.id, label: `${name(d.diagnosis)}, ${stage(d.cancerStage).toLowerCase()}` }))

  function correct(d: PatientDiagnosis) {
    const pending = decisions.find((x) => x.editedDiagnosisId === d.id)
    setEditing(pending ? { draftId: pending.draftId, editedDiagnosisId: d.id, title: `Corregir ${name(d.diagnosis).toLowerCase()}`, initial: fromDraft(pending) } : { draftId: newDraftId(), editedDiagnosisId: d.id, title: `Corregir ${name(d.diagnosis).toLowerCase()}`, initial: fromDiagnosis(d) })
  }

  const pending: PendingRecord[] = decisions.map((d) => {
    const replaced = current.find((c) => c.id === d.replacementDiagnosisId)
    return {
      id: d.draftId,
      kind: d.mode === "EDIT" ? "Corrección" : "Nuevo",
      title: name(d.diagnosis),
      detail: d.mode === "EDIT" ? (d.changeReason ?? "") : d.mode === "REPLACE" ? `Reemplaza a ${replaced ? name(replaced.diagnosis).toLowerCase() : "un diagnóstico"}` : "En paralelo a los actuales",
    }
  })

  return (
    <>
      <RecordSection
        title="Diagnósticos activos"
        description="Un paciente puede tener varios a la vez. Corrige lo mal registrado o agrega uno nuevo."
        addLabel="Agregar diagnóstico"
        onAdd={() => setEditing({ draftId: newDraftId(), title: "Agregar diagnóstico", initial: { waitRecall: "REMEMBERS", report: "no" } })}
        empty="Sin diagnósticos activos."
        pending={pending}
        pendingLabel="Por guardar al completar"
        onRemovePending={(id) => save(decisions.filter((d) => d.draftId !== id))}
        onOpenPending={(id) => {
          const d = decisions.find((x) => x.draftId === id)
          if (d) setEditing({ draftId: d.draftId, editedDiagnosisId: d.editedDiagnosisId, title: `Editar ${name(d.diagnosis).toLowerCase()}`, initial: fromDraft(d) })
        }}
      >
        {current.map((d) => {
          const replacing = decisions.some((x) => x.replacementDiagnosisId === d.id)
          return (
            <Item
              key={d.id}
              title={name(d.diagnosis)}
              tags={
                <>
                  <Chip tone="violet">{stage(d.cancerStage)}</Chip>
                  {replacing && <Chip tone="amber">Se reemplaza</Chip>}
                </>
              }
              meta={d.diagnosisDate ? `Desde el ${formatDate(d.diagnosisDate)}` : undefined}
              onOpen={onViewDiagnosis ? () => onViewDiagnosis(d) : undefined}
              openLabel={`Ver ${name(d.diagnosis).toLowerCase()}`}
              actions={
                allowCorrections && !replacing ? (
                  <Button onClick={() => correct(d)}>Corregir</Button>
                ) : undefined
              }
            />
          )
        })}
      </RecordSection>
      {editing && (
        <FormModal
          icon={Stethoscope}
          title={editing.title}
          description={editing.editedDiagnosisId ? "Cambia solo lo que se registró mal. Si el diagnóstico cambió, agrega uno nuevo que lo reemplace." : undefined}
          groups={editing.editedDiagnosisId ? correctionGroups : newGroups(replaceable)}
          initial={editing.initial}
          submitLabel={editing.editedDiagnosisId ? "Guardar corrección" : "Agregar a la ficha"}
          footnote="Se guardará al completar el seguimiento"
          onClose={() => setEditing(null)}
          onSubmit={(v) => {
            const result = toDraft(v, editing)
            if (typeof result === "string") {
              toast.error(result)
              return
            }
            const exists = decisions.some((d) => d.draftId === editing.draftId)
            save(exists ? decisions.map((d) => (d.draftId === editing.draftId ? result : d)) : [...decisions, result])
            setEditing(null)
          }}
        />
      )}
    </>
  )
}
