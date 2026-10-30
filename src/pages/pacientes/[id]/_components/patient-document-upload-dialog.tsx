import { useState } from "react"
import { FileUp } from "lucide-react"
import type { PatientDiagnosis, PatientTreatment } from "@/api/patients"
import type { CreatePatientDocumentInput, PatientDocumentType } from "@/api/patient-documents"
import type { CatalogItem } from "@/api/catalogs"
import { Button } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { Field, FileField } from "@/components/ds/form"
import { Modal } from "@/components/ds/modal"
import { QuestionForm } from "@/components/ds/question-form"
import { is, progress, type Group, type Values } from "@/components/ds/questions"
import { catalogLabel, useCatalog } from "@/hooks/use-catalog"
import { formatDate } from "../_lib/ficha-format"

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"

const DOCUMENT_TYPES: Array<{ value: PatientDocumentType; label: string }> = [
  { value: "MEDICAL_REPORT", label: "Informe médico" },
  { value: "CLINICAL_HISTORY", label: "Historia clínica" },
  { value: "PRESCRIPTION", label: "Receta médica" },
  { value: "APPOINTMENT_SCHEDULE", label: "Programación de cita" },
  { value: "MEDICAL_ORDER", label: "Orden médica (laboratorio, imágenes, biopsia, anatomía patológica, etc.)" },
  { value: "EXAM_RESULTS", label: "Resultados de exámenes" },
  { value: "REFERRAL_OR_COUNTERREFERRAL", label: "Referencia o contrarreferencia" },
  { value: "IDENTITY_DOCUMENT", label: "Documento de identidad" },
  { value: "CONADIS_DISABILITY_DOCUMENT", label: "Documento de discapacidad (certificado o carné CONADIS)" },
  { value: "OTHER", label: "Otro" },
]

interface PatientDocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  diagnoses: PatientDiagnosis[]
  treatments: PatientTreatment[]
  isPending: boolean
  onSubmit: (input: CreatePatientDocumentInput) => void
  defaultDocumentType?: PatientDocumentType
  lockedTreatmentId?: string
  hideTypeSelect?: boolean
}

export function PatientDocumentUploadDialog(props: PatientDocumentUploadDialogProps) {
  if (!props.open) return null
  return <UploadModal {...props} />
}

function UploadModal({ onOpenChange, diagnoses, treatments, isPending, onSubmit, defaultDocumentType = "OTHER", lockedTreatmentId, hideTypeSelect = false }: PatientDocumentUploadDialogProps) {
  const { data: cancers = [] } = useCatalog("cancer_diagnosis")
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [values, setValues] = useState<Values>({ type: defaultDocumentType, treatment: lockedTreatmentId ?? null })

  const lockedTreatment = treatments.find((t) => t.id === lockedTreatmentId)
  const groups: Group[] = [
    {
      title: "Documento",
      questions: [
        ...(hideTypeSelect ? [] : [{ id: "type", label: "Tipo de documento", type: "select" as const, required: true, wide: true, options: DOCUMENT_TYPES }]),
        {
          id: "diagnosis",
          label: "Diagnóstico relacionado",
          type: "select",
          required: true,
          wide: true,
          options: diagnoses.map((d) => ({ value: d.id, label: diagnosisLabel(d, cancers) })),
          hint: diagnoses.length ? undefined : "Este paciente aún no tiene diagnósticos registrados.",
          showIf: is("type", "MEDICAL_REPORT"),
        },
        {
          id: "treatment",
          label: "Tratamiento relacionado",
          type: "select",
          required: true,
          wide: true,
          options: treatments.map((t) => ({ value: t.id, label: treatmentLabel(t) })),
          hint: treatments.length ? undefined : "Este paciente aún no tiene tratamientos registrados.",
          showIf: (v) => is("type", "PRESCRIPTION")(v) && !lockedTreatmentId,
        },
        {
          id: "description",
          label: "Descripción",
          type: "textarea",
          required: true,
          placeholder: "Ej: resultado de laboratorio enviado por el paciente",
          showIf: is("type", "OTHER"),
        },
        { id: "description", label: "Descripción", type: "textarea", placeholder: "Opcional", showIf: (v) => v.type !== "OTHER" },
      ],
    },
  ]
  const missing = progress(groups, values).missingRequired + (file ? 0 : 1)

  function pick(next: File | null) {
    setFileError(null)
    if (!next) return setFile(null)
    const ext = next.name.slice(next.name.lastIndexOf(".")).toLowerCase()
    if (!ACCEPT.split(",").includes(ext)) return setFileError("Elige un PDF, Word, JPG, PNG o WEBP.")
    if (next.size > MAX_FILE_BYTES) return setFileError("El archivo pesa más de 10 MB.")
    setFile(next)
  }

  function submit() {
    if (!file) return
    const type = values.type as PatientDocumentType
    onSubmit({
      file,
      documentType: type,
      diagnosisId: type === "MEDICAL_REPORT" ? (values.diagnosis ?? undefined) : undefined,
      treatmentId: type === "PRESCRIPTION" ? (lockedTreatmentId ?? values.treatment ?? undefined) : undefined,
      description: values.description?.trim() || undefined,
    })
  }

  const close = () => !isPending && onOpenChange(false)
  return (
    <Modal
      open
      onClose={close}
      icon={FileUp}
      title={hideTypeSelect && defaultDocumentType === "PRESCRIPTION" ? "Adjuntar receta" : "Agregar documento"}
      description={lockedTreatment ? `Tratamiento: ${treatmentLabel(lockedTreatment)}` : "Queda en la ficha del paciente"}
      footer={
        <>
          <span className="mr-auto self-center text-[13px] text-zinc-500">{missing ? (missing === 1 ? "Falta 1 dato obligatorio" : `Faltan ${missing} datos obligatorios`) : "PDF, Word o imagen, hasta 10 MB"}</span>
          <Button onClick={close} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="dark" onClick={submit} disabled={missing > 0 || isPending}>
            {isPending ? "Subiendo…" : "Guardar documento"}
          </Button>
        </>
      }
    >
      <Panel>
        <Field label="Archivo *" hint={fileError ?? undefined}>
          {(id) => <FileField id={id} file={file} onChange={pick} accept={ACCEPT} disabled={isPending} />}
        </Field>
      </Panel>
      <QuestionForm framed groups={groups} values={values} onChange={(id, v) => setValues((prev) => ({ ...prev, [id]: v }))} />
    </Modal>
  )
}

function diagnosisLabel(d: PatientDiagnosis, cancers: CatalogItem[]) {
  return [catalogLabel(cancers, d.diagnosis), d.isCurrent ? "actual" : "histórico", formatDate(d.diagnosisDate)].filter(Boolean).join(", ")
}

function treatmentLabel(t: PatientTreatment) {
  return [t.treatmentType, t.isCurrent ? "actual" : "histórico", formatDate(t.startDate)].filter(Boolean).join(", ")
}
