import { useState } from "react"
import { Pill, Syringe } from "lucide-react"
import { toast } from "sonner"
import { AddButton, Button } from "@/components/ds/button"
import { GroupLabel, Item } from "@/components/ds/card"
import { FormModal } from "@/components/ds/form-modal"
import { Modal } from "@/components/ds/modal"
import { QuestionForm } from "@/components/ds/question-form"
import { progress, type Option, type Values } from "@/components/ds/questions"
import { RemoveButton } from "@/components/ds/record-section"
import type { TreatmentDraft } from "../clinical-drafts"
import { DOSE_UNITS, medicationGroups, medicationValues, toMedication, toTreatment, treatmentGroups, type Medication } from "./treatment-config"

// Modal de un tratamiento: sus preguntas y la lista de medicamentos, que se
// agregan o editan en un modal propio.

export type TreatmentModalSpec = {
  title: string
  base: Pick<TreatmentDraft, "mode" | "seriesId">
  initial: Values
  medications: Medication[]
}

const doseText = (m: Medication) => [m.doseAmount && `${m.doseAmount} ${DOSE_UNITS.find((u) => u.value === m.doseUnit)?.label ?? ""}`.trim(), m.doseDescription].filter(Boolean).join(", ")

export function TreatmentModal({ spec, diagnoses, onClose, onSave }: { spec: TreatmentModalSpec; diagnoses: Option[]; onClose: () => void; onSave: (draft: TreatmentDraft) => void }) {
  const [values, setValues] = useState<Values>(spec.initial)
  const [medications, setMedications] = useState<Medication[]>(spec.medications)
  const [editing, setEditing] = useState<{ index: number | null; initial: Values } | null>(null)
  const replacing = spec.base.mode === "REPLACE"
  const groups = treatmentGroups(diagnoses, replacing)
  const { missingRequired } = progress(groups, values)

  function submit() {
    const result = toTreatment(values, spec.base, medications)
    if (typeof result === "string") return toast.error(result)
    onSave(result)
  }

  return (
    <Modal
      open
      onClose={onClose}
      icon={Syringe}
      title={spec.title}
      description={replacing ? "Actualiza lo que cambió desde el último registro" : "Una línea de tratamiento nueva, en paralelo a las actuales"}
      footer={
        <>
          <span className="mr-auto self-center text-[13px] text-zinc-500">
            {missingRequired ? (missingRequired === 1 ? "Falta 1 dato obligatorio" : `Faltan ${missingRequired} datos obligatorios`) : "Se guardará al completar el seguimiento"}
          </span>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="dark" disabled={missingRequired > 0} onClick={submit}>
            {replacing ? "Guardar actualización" : "Agregar a la ficha"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <QuestionForm framed groups={groups} values={values} onChange={(id, v) => setValues((prev) => ({ ...prev, [id]: v }))} />
        <section className="space-y-2 rounded-[18px] bg-white p-4 ring-1 ring-zinc-200/70">
          <div className="flex items-center gap-3">
            <h4 className="flex-1 text-sm font-semibold">Medicamentos</h4>
            <AddButton onClick={() => setEditing({ index: null, initial: { active: "yes" } })}>Agregar medicamento</AddButton>
          </div>
          {medications.length ? (
            <>
              <GroupLabel>{replacing ? "Los que toma ahora" : "Por agregar"}</GroupLabel>
              {medications.map((m, i) => (
                <Item
                  key={`${m.name}-${i}`}
                  title={m.name}
                  meta={[doseText(m), m.isActive === false ? "ya no lo toma" : null].filter(Boolean).join(", ") || undefined}
                  onOpen={() => setEditing({ index: i, initial: medicationValues(m) })}
                  openLabel={`Editar ${m.name}`}
                  actions={<RemoveButton label={`Quitar ${m.name}`} onClick={() => setMedications((prev) => prev.filter((_, x) => x !== i))} />}
                />
              ))}
            </>
          ) : (
            <p className="text-[13px] text-zinc-500">Sin medicamentos registrados para este tratamiento.</p>
          )}
        </section>
      </div>
      {editing && (
        <FormModal
          icon={Pill}
          title={editing.index === null ? "Agregar medicamento" : "Editar medicamento"}
          groups={medicationGroups}
          initial={editing.initial}
          submitLabel={editing.index === null ? "Agregar" : "Guardar cambios"}
          onClose={() => setEditing(null)}
          onSubmit={(v) => {
            const m = toMedication(v)
            if (typeof m === "string") return toast.error(m)
            setMedications((prev) => (editing.index === null ? [...prev, m] : prev.map((x, i) => (i === editing.index ? m : x))))
            setEditing(null)
          }}
        />
      )}
    </Modal>
  )
}
