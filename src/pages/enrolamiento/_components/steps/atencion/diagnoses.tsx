import { useState } from "react"
import { Stethoscope } from "lucide-react"
import { toast } from "sonner"
import { FormModal } from "@/components/ds/form-modal"
import { Item } from "@/components/ds/card"
import { RecordSection, RemoveButton } from "@/components/ds/record-section"
import { catalogLabel, useCatalog } from "@/hooks/use-catalog"
import { createEnrollmentDiagnosisDraft, useEnrollmentStore, type EnrollmentDiagnosisDraft } from "../../../_store/enrollment-store"
import { SectionBlock } from "../section-block"
import { diagnosisGroups, diagnosisValues, toDiagnosis } from "./diagnosis-config"

export function DiagnosesSection({ embedded = false, historical = false }: { embedded?: boolean; historical?: boolean }) {
  const { draft, updateDraft } = useEnrollmentStore()
  const [editing, setEditing] = useState<EnrollmentDiagnosisDraft | null>(null)
  const [isNew, setIsNew] = useState(false)
  const diagnoses = useCatalog("cancer_diagnosis")
  const stages = useCatalog("cancer_stage")
  const visible = draft.diagnoses.filter((item) => item.diagnosis.trim())

  function openNew() {
    const onlyBlank = draft.diagnoses.length === 1 && !draft.diagnoses[0].diagnosis.trim()
    setEditing(onlyBlank ? draft.diagnoses[0] : createEnrollmentDiagnosisDraft())
    setIsNew(!onlyBlank)
  }

  function save(values: Record<string, string | null>) {
    if (!editing) return
    const next = toDiagnosis(values, editing, historical)
    const rest = draft.diagnoses.filter((item) => item.draftId !== next.draftId && item.diagnosis.trim())
    updateDraft({ diagnoses: isNew ? [...rest, next] : draft.diagnoses.map((item) => (item.draftId === next.draftId ? next : item)) })
    setEditing(null)
  }

  function remove(id: string) {
    const diagnosis = draft.diagnoses.find((item) => item.draftId === id)
    if (!diagnosis) return
    if (draft.diagnoses.length === 1) return
    if (draft.treatments.some((treatment) => treatment.diagnosisRef === id)) {
      toast.error("Quita primero los tratamientos de este diagnóstico")
      return
    }
    updateDraft({ diagnoses: draft.diagnoses.filter((item) => item.draftId !== id) })
  }

  return (
    <SectionBlock embedded={embedded} title="Diagnóstico oncológico" description="Registra uno o varios diagnósticos. Cada tratamiento se asociará a uno de ellos.">
      <RecordSection title="Diagnósticos registrados" addLabel="Agregar diagnóstico" onAdd={openNew} empty="Todavía no hay un diagnóstico.">
        {visible.map((item) => (
          <Item
            key={item.draftId}
            title={catalogLabel(diagnoses.data ?? [], item.diagnosis)}
            meta={[item.cancerStage ? catalogLabel(stages.data ?? [], item.cancerStage) : "", item.diagnosisDate ?? ""].filter(Boolean).join(" · ")}
            onOpen={() => {
              setEditing(item)
              setIsNew(false)
            }}
            actions={draft.diagnoses.length > 1 ? <RemoveButton label={`Quitar ${item.diagnosis}`} onClick={() => remove(item.draftId)} /> : undefined}
          />
        ))}
      </RecordSection>
      {editing && (
        <FormModal
          icon={Stethoscope}
          title={isNew ? "Nuevo diagnóstico" : "Diagnóstico"}
          groups={diagnosisGroups(historical)}
          initial={diagnosisValues(editing, historical)}
          submitLabel="Guardar diagnóstico"
          onClose={() => setEditing(null)}
          onSubmit={save}
        />
      )}
    </SectionBlock>
  )
}
