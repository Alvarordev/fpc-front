import { useEffect, useState } from "react"
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { FileUp } from "lucide-react"
import { toast } from "sonner"
import { Chip } from "@/components/ds/badge"
import { Button, IconButton } from "@/components/ds/button"
import { Item } from "@/components/ds/card"
import { SegmentedProgress } from "@/components/ds/progress"
import { RecordSection, type PendingRecord } from "@/components/ds/record-section"
import { patientDocumentsApi } from "@/api/patient-documents"
import { patientsApi, type PatientDiagnosis, type PatientTreatment } from "@/api/patients"
import { catalogLabel, useCatalog } from "@/hooks/use-catalog"
import { normalizeDuration } from "@/types/duration"
import { PatientDocumentUploadDialog } from "../../../_components/patient-document-upload-dialog"
import { formatDate } from "../../../_lib/ficha-format"
import { draftDiagnosisOptionId, type TreatmentDraft } from "../clinical-drafts"
import { savedTreatmentValues, treatmentValues, type Medication } from "./treatment-config"
import { TreatmentModal, type TreatmentModalSpec } from "./treatment-modal"
import type { SheetTabProps } from "./sheet-types"

// Tratamientos: las líneas actuales (se actualizan con lo que cambió) y las
// nuevas en paralelo. La receta de una línea guardada se adjunta al momento.

type Props = SheetTabProps & {
  patientId: string
  diagnoses: PatientDiagnosis[]
  treatments: PatientTreatment[]
  onViewTreatment?: (treatment: PatientTreatment) => void
}

export function TratamientosTab({ drafts, onDraftsChange, patientId, diagnoses, treatments, onViewTreatment }: Props) {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<(TreatmentModalSpec & { index: number | null }) | null>(null)
  const [prescriptionFor, setPrescriptionFor] = useState<PatientTreatment | null>(null)
  const { data: cancers = [] } = useCatalog("cancer_diagnosis")
  const { data: types = [] } = useCatalog("treatment_type")
  const decisions = drafts.treatments ?? []
  const current = treatments.filter((t) => t.isCurrent)
  const typeName = (code: string) => catalogLabel(types, code)

  const diagnosisOptions = [
    ...(drafts.diagnoses ?? []).filter((d) => d.mode !== "EDIT").map((d) => ({ value: draftDiagnosisOptionId(d.draftId), label: `${catalogLabel(cancers, d.diagnosis)} (nuevo)` })),
    ...diagnoses.map((d) => ({ value: d.id, label: catalogLabel(cancers, d.diagnosis) })),
  ]

  const upload = useMutation({
    mutationFn: (input: Parameters<typeof patientDocumentsApi.create>[1]) => patientDocumentsApi.create(patientId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] })
      setPrescriptionFor(null)
      toast.success("Receta guardada")
    },
    onError: (error: Error) => toast.error("No se pudo guardar la receta", { description: error.message }),
  })

  const save = (next: TreatmentDraft[]) => onDraftsChange((prev) => ({ ...prev, treatments: next.length ? next : undefined }))

  async function update(t: PatientTreatment) {
    const index = decisions.findIndex((d) => d.seriesId === t.seriesId)
    if (index !== -1) return openDecision(index)
    const medications = await loadMedications(queryClient, t)
    setModal({ index: null, title: `Actualizar ${typeName(t.treatmentType).toLowerCase()}`, base: { mode: "REPLACE", seriesId: t.seriesId }, initial: savedTreatmentValues(t), medications })
  }

  function openDecision(index: number) {
    const d = decisions[index]
    setModal({ index, title: `Editar ${typeName(d.treatmentType).toLowerCase()}`, base: { mode: d.mode, seriesId: d.seriesId }, initial: treatmentValues(d), medications: d.medications ?? [] })
  }

  const pending: PendingRecord[] = decisions.map((d, i) => ({
    id: String(i),
    kind: d.mode === "REPLACE" ? "Actualización" : "Nuevo",
    title: typeName(d.treatmentType),
    detail: [d.completedSessions != null && d.scheduledSessions ? `sesión ${d.completedSessions} de ${d.scheduledSessions}` : null, d.changeReason, d.medications?.length ? `${d.medications.length} medicamentos` : null].filter(Boolean).join(", ") || (d.mode === "REPLACE" ? "Actualización" : "En paralelo"),
  }))

  return (
    <>
      <RecordSection
        title="Tratamientos actuales"
        description="Actualiza la línea que cambió (avance, situación, medicamentos) o agrega una en paralelo."
        addLabel="Agregar tratamiento"
        onAdd={() => setModal({ index: null, title: "Agregar tratamiento", base: { mode: "PARALLEL" }, initial: { referred: "no" }, medications: [] })}
        empty="Sin tratamientos activos."
        pending={pending}
        pendingLabel="Por guardar al completar"
        onRemovePending={(id) => save(decisions.filter((_, i) => String(i) !== id))}
        onOpenPending={(id) => openDecision(Number(id))}
      >
        {current.map((t) => {
          const updating = decisions.some((d) => d.seriesId === t.seriesId)
          return (
            <Item
              key={t.id}
              title={typeName(t.treatmentType)}
              tags={updating ? <Chip tone="blue">Con cambios</Chip> : undefined}
              meta={[t.startDate && `desde el ${formatDate(t.startDate)}`].filter(Boolean).join(", ") || undefined}
              body={t.scheduledSessions ? <SegmentedProgress done={t.completedSessions ?? 0} total={t.scheduledSessions} /> : undefined}
              onOpen={onViewTreatment ? () => onViewTreatment(t) : undefined}
              openLabel={`Ver ${typeName(t.treatmentType).toLowerCase()}`}
              actions={
                <>
                  <IconButton icon={FileUp} label="Adjuntar receta" onClick={() => setPrescriptionFor(t)} />
                  <Button onClick={() => void update(t)}>{updating ? "Editar cambios" : "Actualizar"}</Button>
                </>
              }
            />
          )
        })}
      </RecordSection>
      {modal && (
        <TreatmentModal
          spec={modal}
          diagnoses={diagnosisOptions}
          onClose={() => setModal(null)}
          onSave={(draft) => {
            save(modal.index === null ? [...decisions, draft] : decisions.map((d, i) => (i === modal.index ? draft : d)))
            setModal(null)
          }}
        />
      )}
      <PatientDocumentUploadDialog
        open={Boolean(prescriptionFor)}
        onOpenChange={(open) => !open && setPrescriptionFor(null)}
        diagnoses={diagnoses}
        treatments={treatments}
        isPending={upload.isPending}
        defaultDocumentType="PRESCRIPTION"
        lockedTreatmentId={prescriptionFor?.id}
        hideTypeSelect
        onSubmit={(input) => upload.mutate(input)}
      />
    </>
  )
}

/** Medicamentos guardados de una versión, para precargar su actualización. */
async function loadMedications(queryClient: QueryClient, t: PatientTreatment): Promise<Medication[]> {
  try {
    const saved = await queryClient.fetchQuery({ queryKey: ["treatment-medications", t.patientId, t.id], queryFn: () => patientsApi.listTreatmentMedications(t.patientId, t.id), staleTime: 30_000 })
    return saved.map((m) => ({
      name: m.name,
      doseAmount: m.doseAmount ?? undefined,
      doseUnit: m.doseUnit ?? undefined,
      doseDescription: m.doseDescription ?? undefined,
      route: m.route ?? undefined,
      frequency: normalizeDuration(m.frequency) as Medication["frequency"],
      startDate: m.startDate ?? undefined,
      endDate: m.endDate ?? undefined,
      isActive: m.isActive,
      notes: m.notes ?? undefined,
    }))
  } catch {
    toast.error("No se pudieron cargar los medicamentos de este tratamiento")
    return []
  }
}

/**
 * Corrección desde un seguimiento ya cerrado: guarda al momento una versión
 * nueva de la línea, precargada con la actual y ligada a ese seguimiento.
 */
export function TreatmentCorrectionModal({ treatment, diagnoses, pending, onClose, onSubmit }: { treatment: PatientTreatment; diagnoses: PatientDiagnosis[]; pending: boolean; onClose: () => void; onSubmit: (draft: TreatmentDraft) => void }) {
  const queryClient = useQueryClient()
  const { data: cancers = [] } = useCatalog("cancer_diagnosis")
  const { data: types = [] } = useCatalog("treatment_type")
  const [medications, setMedications] = useState<Medication[] | null>(null)
  useEffect(() => {
    let alive = true
    void loadMedications(queryClient, treatment).then((list) => alive && setMedications(list))
    return () => {
      alive = false
    }
  }, [queryClient, treatment])
  if (!medications) return null
  return (
    <TreatmentModal
      spec={{ title: `Corregir ${catalogLabel(types, treatment.treatmentType).toLowerCase()}`, base: { mode: "REPLACE", seriesId: treatment.seriesId }, initial: savedTreatmentValues(treatment), medications }}
      diagnoses={diagnoses.map((d) => ({ value: d.id, label: catalogLabel(cancers, d.diagnosis) }))}
      footnote="Queda como una versión nueva, registrada en este seguimiento"
      submitLabel="Guardar corrección"
      pending={pending}
      onClose={onClose}
      onSave={onSubmit}
    />
  )
}
