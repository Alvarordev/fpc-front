import { useState } from "react"
import { HeartPulse, Pill } from "lucide-react"
import { QuestionForm } from "@/components/ds/question-form"
import { Button } from "@/components/ds/button"
import { Modal } from "@/components/ds/modal"
import { Item } from "@/components/ds/card"
import { RecordSection, RemoveButton } from "@/components/ds/record-section"
import { progress, type Values } from "@/components/ds/questions"
import { catalogLabel, useCatalog } from "@/hooks/use-catalog"
import { medicationGroups, medicationValues, toMedication } from "@/pages/pacientes/[id]/seguimientos/_components/ficha/treatment-config"
import type { AddTreatmentMedicationRequest } from "@/types"
import { createEnrollmentTreatmentDraft, useEnrollmentStore, type EnrollmentTreatmentDraft } from "../../../_store/enrollment-store"
import { SectionBlock } from "../section-block"
import { toTreatment, treatmentGroups, treatmentValues } from "./treatment-config"

type MedIndex = number | "new" | null

export function TreatmentsSection({ embedded = false }: { embedded?: boolean }) {
  const { draft, updateDraft } = useEnrollmentStore()
  const meta = draft.enrollmentMetadata
  const types = useCatalog("treatment_type")
  const diagnosisCatalog = useCatalog("cancer_diagnosis")
  const [editing, setEditing] = useState<EnrollmentTreatmentDraft | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [meds, setMeds] = useState<AddTreatmentMedicationRequest[]>([])
  const [medIndex, setMedIndex] = useState<MedIndex>(null)
  const [medError, setMedError] = useState<string | null>(null)
  const options = draft.diagnoses
    .filter((item) => item.diagnosis.trim())
    .map((item) => ({ value: item.draftId, label: catalogLabel(diagnosisCatalog.data ?? [], item.diagnosis) }))
  const groups = treatmentGroups(options)
  const values = editing ? treatmentValues(editing) : {}
  const [form, setForm] = useState<Values>({})
  const current = editing ? { ...values, ...form } : form
  const receiving = meta.currentlyReceivingTreatment
  const questionGroups = [
    {
      title: "Tratamiento actual",
      questions: [
        { id: "receiving", label: "Actualmente, ¿está recibiendo algún tratamiento médico?", type: "yesno" as const, required: true, wide: true },
        { id: "reason", label: "¿Cuál es el motivo?", type: "textarea" as const, required: true, showIf: (v: Values) => v.receiving === "no" },
      ],
    },
  ]
  const headerValues = {
    receiving: receiving === true ? "yes" : receiving === false ? "no" : null,
    reason: meta.notReceivingTreatmentReason ?? null,
  }

  function openNew() {
    const diagnosisRef = options[0]?.value ?? draft.diagnoses[0]?.draftId ?? ""
    const next = createEnrollmentTreatmentDraft(diagnosisRef)
    setEditing(next)
    setIsNew(true)
    setMeds([])
    setForm(treatmentValues(next))
    setMedIndex(null)
  }

  function open(treatment: EnrollmentTreatmentDraft) {
    setEditing(treatment)
    setIsNew(false)
    setMeds(treatment.medications ?? [])
    setForm(treatmentValues(treatment))
    setMedIndex(null)
  }

  function saveTreatment() {
    if (!editing) return
    const next = { ...toTreatment(current, editing), medications: meds }
    const without = draft.treatments.filter((item) => item.draftId !== next.draftId)
    updateDraft({ treatments: isNew ? [...without, next] : draft.treatments.map((item) => (item.draftId === next.draftId ? next : item)) })
    setEditing(null)
  }

  function saveMed(medValues: Values) {
    const medication = toMedication(medValues)
    if (typeof medication === "string") {
      setMedError(medication)
      return
    }
    const next = medication as AddTreatmentMedicationRequest
    setMeds((list) => (medIndex === "new" ? [...list, next] : list.map((item, index) => (index === medIndex ? next : item))))
    setMedIndex(null)
    setMedError(null)
  }

  return (
    <>
      <SectionBlock embedded={embedded} title="Tratamiento actual">
        <QuestionForm
          groups={questionGroups}
          values={headerValues}
          onChange={(id, value) => {
            if (id === "receiving") {
              const next = value === "yes"
              updateDraft({
                enrollmentMetadata: {
                  ...meta,
                  currentlyReceivingTreatment: value == null ? null : next,
                  notReceivingTreatmentReason: next ? null : meta.notReceivingTreatmentReason,
                },
              })
              return
            }
            updateDraft({ enrollmentMetadata: { ...meta, notReceivingTreatmentReason: value } })
          }}
        />
      </SectionBlock>
      {receiving !== false && (
        <SectionBlock embedded={embedded} title="Tratamientos">
          <RecordSection title="Tratamientos registrados" addLabel="Agregar tratamiento" onAdd={openNew} empty="No hay tratamientos registrados. Agrega uno si corresponde.">
            {draft.treatments.map((treatment) => (
              <Item
                key={treatment.draftId}
                title={catalogLabel(types.data ?? [], treatment.treatmentType) || "Tratamiento"}
                meta={`${treatment.medications?.length ?? 0} medicamento(s)`}
                onOpen={() => open(treatment)}
                actions={<RemoveButton label="Quitar tratamiento" onClick={() => updateDraft({ treatments: draft.treatments.filter((item) => item.draftId !== treatment.draftId) })} />}
              />
            ))}
          </RecordSection>
        </SectionBlock>
      )}
      {editing && (
        <Modal
          open
          icon={HeartPulse}
          title={isNew ? "Nuevo tratamiento" : "Tratamiento"}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Cancelar</Button>
              <Button variant="dark" disabled={progress(groups, current).missingRequired > 0} onClick={saveTreatment}>
                Guardar tratamiento
              </Button>
            </>
          }
        >
          {medIndex === null ? (
            <>
              <QuestionForm framed groups={groups} values={current} onChange={(id, value) => setForm((prev) => ({ ...prev, [id]: value }))} />
              <RecordSection title="Medicamentos" addLabel="Agregar medicamento" onAdd={() => setMedIndex("new")} empty="Sin medicamentos.">
                {meds.map((medication, index) => (
                  <Item
                    key={`${medication.name}-${index}`}
                    title={medication.name || "Medicamento"}
                    onOpen={() => setMedIndex(index)}
                    actions={<RemoveButton label={`Quitar ${medication.name}`} onClick={() => setMeds((list) => list.filter((_, currentIndex) => currentIndex !== index))} />}
                  />
                ))}
              </RecordSection>
            </>
          ) : (
            <MedicationDraft
              initial={medIndex === "new" ? {} : medicationValues((meds[medIndex] ?? { name: "" }) as Parameters<typeof medicationValues>[0])}
              error={medError}
              onCancel={() => setMedIndex(null)}
              onSave={saveMed}
            />
          )}
        </Modal>
      )}
    </>
  )
}

function MedicationDraft({
  initial,
  error,
  onCancel,
  onSave,
}: {
  initial: Values
  error: string | null
  onCancel: () => void
  onSave: (values: Values) => void
}) {
  const [values, setValues] = useState<Values>(initial)
  const missing = progress(medicationGroups, values).missingRequired
  return (
    <div className="space-y-3 rounded-[18px] bg-white p-4 ring-1 ring-zinc-200/70">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Pill className="size-4" /> Medicamento
      </div>
      <QuestionForm framed groups={medicationGroups} values={values} onChange={(id, value) => setValues((prev) => ({ ...prev, [id]: value }))} />
      {error && <p className="text-[13px] text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Volver</Button>
        <Button variant="dark" disabled={missing > 0} onClick={() => onSave(values)}>
          Guardar medicamento
        </Button>
      </div>
    </div>
  )
}
