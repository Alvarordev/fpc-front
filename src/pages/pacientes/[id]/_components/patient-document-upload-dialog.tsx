import { useEffect, useState } from "react"
import { FileUp, X } from "lucide-react"
import type { PatientDiagnosis, PatientTreatment } from "@/api/patients"
import {
  type CreatePatientDocumentInput,
  type PatientDocumentType,
} from "@/api/patient-documents"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const MAX_FILE_BYTES = 10 * 1024 * 1024

const DOCUMENT_TYPES: Array<{ value: PatientDocumentType; label: string }> = [
  { value: "OTHER", label: "Otro" },
  { value: "MEDICAL_REPORT", label: "Informe médico" },
  { value: "PRESCRIPTION", label: "Receta" },
]

const ACCEPTED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
])

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

export function PatientDocumentUploadDialog({
  open,
  onOpenChange,
  diagnoses,
  treatments,
  isPending,
  onSubmit,
  defaultDocumentType = "OTHER",
  lockedTreatmentId,
  hideTypeSelect = false,
}: PatientDocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [documentType, setDocumentType] =
    useState<PatientDocumentType>(defaultDocumentType)
  const [diagnosisId, setDiagnosisId] = useState("")
  const [treatmentId, setTreatmentId] = useState(lockedTreatmentId ?? "")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)

  useEffect(() => {
    if (!open) return
    setDocumentType(defaultDocumentType)
    setTreatmentId(lockedTreatmentId ?? "")
    setDiagnosisId("")
    setDescription("")
    setFile(null)
    setError(null)
    setFileInputKey((value) => value + 1)
  }, [open, defaultDocumentType, lockedTreatmentId])

  const diagnosisItems = diagnoses.map((diagnosis) => ({
    value: diagnosis.id,
    label: diagnosisLabel(diagnosis),
  }))
  const treatmentItems = treatments.map((treatment) => ({
    value: treatment.id,
    label: treatmentLabel(treatment),
  }))
  const lockedTreatment = lockedTreatmentId
    ? treatments.find((treatment) => treatment.id === lockedTreatmentId)
    : undefined

  function handleFileChange(nextFile: File | undefined) {
    setError(null)
    if (!nextFile) {
      setFile(null)
      return
    }

    const extension = extensionOf(nextFile.name)
    if (!ACCEPTED_EXTENSIONS.has(extension)) {
      setFile(null)
      setError("Selecciona un PDF, Word, JPG, PNG o WEBP.")
      return
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setFile(null)
      setError("El archivo no puede superar los 10 MB.")
      return
    }

    setFile(nextFile)
  }

  function handleTypeChange(value: string | null) {
    const nextType = (value ?? "OTHER") as PatientDocumentType
    setDocumentType(nextType)
    setDiagnosisId("")
    setTreatmentId(lockedTreatmentId ?? "")
    setError(null)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextDescription = description.trim()
    const resolvedTreatmentId = lockedTreatmentId || treatmentId

    if (!file) {
      setError("Selecciona un archivo para continuar.")
      return
    }
    if (documentType === "MEDICAL_REPORT" && !diagnosisId) {
      setError("Selecciona el diagnóstico relacionado.")
      return
    }
    if (documentType === "PRESCRIPTION" && !resolvedTreatmentId) {
      setError("Selecciona el tratamiento relacionado.")
      return
    }
    if (documentType === "OTHER" && !nextDescription) {
      setError("Agrega una descripción para este documento.")
      return
    }

    onSubmit({
      file,
      documentType,
      diagnosisId: documentType === "MEDICAL_REPORT" ? diagnosisId : undefined,
      treatmentId:
        documentType === "PRESCRIPTION" ? resolvedTreatmentId : undefined,
      description: nextDescription || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar documento</DialogTitle>
          <DialogDescription>
            Guarda el archivo en la ficha clínica del paciente. El límite es de
            10 MB.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="patient-document-file">Archivo</Label>
            <Input
              key={fileInputKey}
              id="patient-document-file"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
              disabled={isPending}
            />
            {file && (
              <div className="bg-muted/50 flex items-center gap-2 rounded-md px-3 py-2 text-xs">
                <FileUp className="text-primary size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="text-muted-foreground shrink-0">
                  {formatBytes(file.size)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setFile(null)
                    setFileInputKey((value) => value + 1)
                  }}
                  disabled={isPending}
                  aria-label="Quitar archivo"
                >
                  <X />
                </Button>
              </div>
            )}
          </div>

          {!hideTypeSelect && (
            <div className="space-y-2">
              <Label>Tipo documental</Label>
              <Select
                items={DOCUMENT_TYPES}
                value={documentType}
                onValueChange={handleTypeChange}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {documentType === "MEDICAL_REPORT" && (
            <div className="space-y-2">
              <Label>Diagnóstico relacionado</Label>
              <Select
                items={diagnosisItems}
                value={diagnosisId}
                onValueChange={(value) => setDiagnosisId(value ?? "")}
                disabled={isPending || diagnosisItems.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar diagnóstico" />
                </SelectTrigger>
                <SelectContent>
                  {diagnosisItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {diagnosisItems.length === 0 && (
                <p className="text-xs text-amber-700">
                  Este paciente aún no tiene diagnósticos registrados.
                </p>
              )}
            </div>
          )}

          {documentType === "PRESCRIPTION" && (
            <div className="space-y-2">
              <Label>Tratamiento relacionado</Label>
              {lockedTreatmentId ? (
                <Input
                  value={
                    lockedTreatment
                      ? treatmentLabel(lockedTreatment)
                      : "Tratamiento seleccionado"
                  }
                  disabled
                />
              ) : (
                <Select
                  items={treatmentItems}
                  value={treatmentId}
                  onValueChange={(value) => setTreatmentId(value ?? "")}
                  disabled={isPending || treatmentItems.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tratamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatmentItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!lockedTreatmentId && treatmentItems.length === 0 && (
                <p className="text-xs text-amber-700">
                  Este paciente aún no tiene tratamientos registrados.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="patient-document-description">
              Descripción{documentType === "OTHER" ? " *" : ""}
            </Label>
            <Textarea
              id="patient-document-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={
                documentType === "OTHER"
                  ? "Ej. resultado de laboratorio enviado por el paciente"
                  : "Descripción opcional"
              }
              maxLength={1000}
              rows={3}
              disabled={isPending}
            />
          </div>

          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Cargando..." : "Guardar documento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function diagnosisLabel(diagnosis: PatientDiagnosis): string {
  return [
    diagnosis.diagnosis,
    diagnosis.isCurrent ? "Actual" : "Histórico",
    diagnosis.diagnosisDate
      ? new Date(diagnosis.diagnosisDate).toLocaleDateString("es-PE")
      : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

function treatmentLabel(treatment: PatientTreatment): string {
  return [
    treatment.treatmentType,
    treatment.isCurrent ? "Actual" : "Histórico",
    treatment.startDate
      ? new Date(treatment.startDate).toLocaleDateString("es-PE")
      : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

function extensionOf(fileName: string): string {
  const index = fileName.lastIndexOf(".")
  return index >= 0 ? fileName.slice(index).toLowerCase() : ""
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}
