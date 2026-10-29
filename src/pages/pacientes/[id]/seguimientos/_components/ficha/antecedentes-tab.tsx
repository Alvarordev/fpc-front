import { useState } from "react"
import { Accessibility, HeartPulse, Users, type LucideIcon } from "lucide-react"
import { Item } from "@/components/ds/card"
import { FormModal } from "@/components/ds/form-modal"
import { QuestionForm } from "@/components/ds/question-form"
import type { Group, Values } from "@/components/ds/questions"
import { RecordSection, type PendingRecord } from "@/components/ds/record-section"
import type { PatientHealthBackgroundAssessment } from "@/api/patients"
import type { HealthBackgroundAssessmentDraft } from "../clinical-drafts"
import { compact, fromBool, text, toBool, useAnswers } from "./answers"
import type { SheetTabProps } from "./sheet-types"

// Antecedentes: psiquiatría y las listas de comorbilidades, limitaciones y
// antecedentes familiares. Lo agregado se guarda como una evaluación nueva al
// completar el seguimiento; lo ya registrado se muestra de la última evaluación.

type Draft = HealthBackgroundAssessmentDraft
type ListKey = "activeComorbidities" | "limitations" | "familyCancerHistory"

const CAUSES = [
  { value: "DIAGNOSIS", label: "Diagnóstico" },
  { value: "TREATMENT", label: "Tratamiento" },
  { value: "NATURAL_CONDITION", label: "Condición natural" },
]
const causeLabel = (value: string | null | undefined) => CAUSES.find((c) => c.value === value)?.label ?? ""

const psychiatryGroups: Group[] = [{ title: "Salud mental", questions: [{ id: "psychiatry", label: "¿Tiene antecedentes de psiquiatría?", type: "yesno" }] }]

type ListSpec<K extends ListKey> = {
  key: K
  title: string
  addLabel: string
  empty: string
  icon: LucideIcon
  groups: Group[]
  toItem: (v: Values) => NonNullable<Draft[K]>[number]
  summary: (item: NonNullable<Draft[K]>[number]) => { title: string; detail: string }
}

const comorbidities: ListSpec<"activeComorbidities"> = {
  key: "activeComorbidities",
  title: "Comorbilidades activas",
  addLabel: "Agregar comorbilidad",
  empty: "Sin comorbilidades registradas.",
  icon: HeartPulse,
  groups: [
    {
      title: "Comorbilidad",
      questions: [
        { id: "condition", label: "Condición", type: "text", required: true, placeholder: "Ej: hipertensión", wide: true },
        { id: "treatment", label: "Tratamiento", type: "text", placeholder: "Tratamiento actual" },
        { id: "specialty", label: "Especialidad de seguimiento", type: "text", placeholder: "Ej: cardiología" },
      ],
    },
  ],
  toItem: (v) => ({ conditionName: v.condition!.trim(), treatmentDescription: text(v.treatment), followUpSpecialty: text(v.specialty) }),
  summary: (c) => ({ title: c.conditionName, detail: [c.treatmentDescription, c.followUpSpecialty && `control en ${c.followUpSpecialty}`].filter(Boolean).join(", ") }),
}

const limitations: ListSpec<"limitations"> = {
  key: "limitations",
  title: "Limitaciones",
  addLabel: "Agregar limitación",
  empty: "Sin limitaciones registradas.",
  icon: Accessibility,
  groups: [
    {
      title: "Limitación",
      questions: [
        { id: "description", label: "Descripción", type: "textarea", required: true, placeholder: "Describe la limitación" },
        { id: "cause", label: "Causa", type: "choice", options: CAUSES, required: true },
      ],
    },
  ],
  toItem: (v) => ({ description: v.description!.trim(), cause: v.cause as NonNullable<Draft["limitations"]>[number]["cause"] }),
  summary: (l) => ({ title: l.description, detail: causeLabel(l.cause) }),
}

const familyHistory: ListSpec<"familyCancerHistory"> = {
  key: "familyCancerHistory",
  title: "Antecedentes familiares de cáncer",
  addLabel: "Agregar antecedente",
  empty: "Sin antecedentes familiares registrados.",
  icon: Users,
  groups: [
    {
      title: "Antecedente familiar",
      questions: [
        { id: "relationship", label: "Parentesco", type: "text", required: true, placeholder: "Ej: madre" },
        { id: "cancer", label: "Tipo de cáncer", type: "text", placeholder: "Ej: cáncer de mama" },
      ],
    },
  ],
  toItem: (v) => ({ relationship: v.relationship!.trim(), cancerType: text(v.cancer) }),
  summary: (f) => ({ title: f.cancerType ?? "Cáncer sin especificar", detail: f.relationship }),
}

const LISTS = [comorbidities, limitations, familyHistory] as const

type Props = SheetTabProps & { assessments: PatientHealthBackgroundAssessment[] }

export function AntecedentesTab({ drafts, onDraftsChange, assessments }: Props) {
  const [adding, setAdding] = useState<ListKey | null>(null)
  const latest = [...assessments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const draft = drafts.healthBackground

  function update(patch: Partial<Draft>) {
    onDraftsChange((prev) => {
      const next = { ...prev.healthBackground, ...patch }
      for (const key of ["activeComorbidities", "limitations", "familyCancerHistory"] as const) if (!next[key]?.length) delete next[key]
      return { ...prev, healthBackground: next }
    })
  }

  const { values, answer } = useAnswers(
    () => compact({ psychiatry: fromBool(draft?.hasPsychiatry ?? latest?.hasPsychiatry ?? undefined) }),
    (v) => update({ hasPsychiatry: toBool(v.psychiatry) }),
  )
  const spec = LISTS.find((l) => l.key === adding)

  return (
    <div className="space-y-6">
      <QuestionForm groups={psychiatryGroups} values={values} onChange={answer} />
      {LISTS.map((list) => {
        const items = (draft?.[list.key] ?? []) as NonNullable<Draft[typeof list.key]>
        const pending: PendingRecord[] = items.map((item, i) => ({ id: String(i), kind: "Nuevo", ...(list.summary as (x: typeof item) => { title: string; detail: string })(item) }))
        const existing = (latest?.[list.key] ?? []) as typeof items
        return (
          <RecordSection
            key={list.key}
            title={list.title}
            addLabel={list.addLabel}
            onAdd={() => setAdding(list.key)}
            empty={list.empty}
            pending={pending}
            pendingLabel="Por guardar al completar"
            onRemovePending={(id) => update({ [list.key]: items.filter((_, i) => String(i) !== id) })}
          >
            {existing.map((item, i) => {
              const s = (list.summary as (x: typeof item) => { title: string; detail: string })(item)
              return <Item key={i} title={s.title} meta={s.detail || undefined} />
            })}
          </RecordSection>
        )
      })}
      {spec && (
        <FormModal
          icon={spec.icon}
          title={spec.addLabel}
          groups={spec.groups}
          submitLabel="Agregar a la ficha"
          footnote="Se guardará al completar el seguimiento"
          onClose={() => setAdding(null)}
          onSubmit={(v) => {
            const items = (draft?.[spec.key] ?? []) as unknown[]
            update({ [spec.key]: [...items, (spec.toItem as (v: Values) => unknown)(v)] })
            setAdding(null)
          }}
        />
      )}
    </div>
  )
}
