import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Archive,
  Download,
  Eye,
  FileImage,
  FileText,
  Loader2,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import type { PatientDiagnosis, PatientTreatment } from "@/api/patients"
import {
  patientDocumentsApi,
  type PatientDocument,
  type PatientDocumentType,
} from "@/api/patient-documents"
import { Chip } from "@/components/ds/badge"
import { AddButton, Button as DsButton, IconButton } from "@/components/ds/button"
import { Card as DsCard, Item } from "@/components/ds/card"
import { EmptyState } from "@/components/ds/empty-state"
import { Modal } from "@/components/ds/modal"
import { useAuthStore } from "@/store/auth-store"
import type { CatalogItem } from "@/api/catalogs"
import { catalogLabel, useCatalog } from "@/hooks/use-catalog"
import { usePatientDocuments } from "../_hooks/use-patient-documents"
import { PatientDocumentPreviewDialog } from "./patient-document-preview-dialog"
import { PatientDocumentUploadDialog } from "./patient-document-upload-dialog"

const DOCUMENT_TYPE_LABELS: Record<PatientDocumentType, string> = {
  MEDICAL_REPORT: "Informe médico",
  CLINICAL_HISTORY: "Historia clínica",
  PRESCRIPTION: "Receta médica",
  APPOINTMENT_SCHEDULE: "Programación de Cita",
  MEDICAL_ORDER:
    "Orden médica (laboratorio, imágenes, biopsia, anatomía patológica, etc.)",
  EXAM_RESULTS: "Resultados de exámenes",
  REFERRAL_OR_COUNTERREFERRAL: "Referencia o contrarreferencia",
  IDENTITY_DOCUMENT: "Documento de identidad",
  CONADIS_DISABILITY_DOCUMENT:
    "Documento de discapacidad (certificado/carné CONADIS)",
  OTHER: "Otros",
}

interface PatientDocumentsTabProps {
  patientId: string
  diagnoses: PatientDiagnosis[]
  treatments: PatientTreatment[]
}

export function PatientDocumentsTab({
  patientId,
  diagnoses,
  treatments,
}: PatientDocumentsTabProps) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadKey, setUploadKey] = useState(0)
  const [showArchived, setShowArchived] = useState(false)
  const [previewDocument, setPreviewDocument] =
    useState<PatientDocument | null>(null)
  const [archiveDocument, setArchiveDocument] =
    useState<PatientDocument | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const { data: cancerDiagnoses = [] } = useCatalog("cancer_diagnosis")
  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"
  const documentsQuery = usePatientDocuments(
    patientId,
    { includeArchived: showArchived },
    canManage,
  )
  const uploadMutation = useMutation({
    mutationFn: (input: Parameters<typeof patientDocumentsApi.create>[1]) =>
      patientDocumentsApi.create(patientId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patient-documents", patientId],
      })
      setUploadOpen(false)
      toast.success("Documento guardado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo guardar el documento", {
        description: error.message,
      }),
  })
  const archiveMutation = useMutation({
    mutationFn: (documentId: string) =>
      patientDocumentsApi.archive(patientId, documentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patient-documents", patientId],
      })
      setArchiveDocument(null)
      toast.success("Documento archivado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo archivar el documento", {
        description: error.message,
      }),
  })

  async function downloadDocument(document: PatientDocument) {
    setDownloadingId(document.id)
    try {
      const blob = await patientDocumentsApi.content(patientId, document.id)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = document.originalFileName
      link.rel = "noopener"
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (error) {
      toast.error("No se pudo descargar el documento", {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const documents = documentsQuery.data?.data ?? []

  function openUpload() {
    setUploadKey((value) => value + 1)
    setUploadOpen(true)
  }

  if (!canManage) return null

  return (
    <div className="space-y-4">
      <DsCard
        title="Documentos clínicos"
        description="Informes, recetas y otros archivos del paciente. Máximo 10 MB por archivo."
        action={
          <div className="flex gap-2">
            <DsButton icon={RotateCcw} onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? "Ocultar archivados" : "Ver archivados"}
            </DsButton>
            <AddButton onClick={openUpload}>Subir documento</AddButton>
          </div>
        }
      >
        {documentsQuery.isLoading ? (
          <p className="flex items-center gap-2 text-[13px] text-zinc-500">
            <Loader2 className="size-4 animate-spin" />
            Cargando documentos...
          </p>
        ) : documentsQuery.isError ? (
          <div className="flex items-center gap-3">
            <p className="text-[13px] text-red-700">No se pudieron cargar los documentos.</p>
            <DsButton onClick={() => void documentsQuery.refetch()}>Reintentar</DsButton>
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            title={showArchived ? "Sin documentos archivados" : "Aún no hay documentos"}
            body={showArchived ? "Los archivos archivados aparecen aquí para auditoría." : "Sube informes médicos, recetas u otros archivos relevantes para la atención."}
            action={showArchived ? undefined : "Subir documento"}
            onAction={openUpload}
          />
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {documents.map((document) => (
              <PatientDocumentRow
                key={document.id}
                document={document}
                association={associationLabel(document, diagnoses, treatments, cancerDiagnoses)}
                isDownloading={downloadingId === document.id}
                onPreview={setPreviewDocument}
                onDownload={downloadDocument}
                onArchive={setArchiveDocument}
              />
            ))}
          </div>
        )}
      </DsCard>

      <PatientDocumentUploadDialog
        key={uploadKey}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        diagnoses={diagnoses}
        treatments={treatments}
        isPending={uploadMutation.isPending}
        onSubmit={(input) => uploadMutation.mutate(input)}
      />
      <PatientDocumentPreviewDialog
        patientId={patientId}
        document={previewDocument}
        onOpenChange={() => setPreviewDocument(null)}
        onDownload={downloadDocument}
      />
      <PatientDocumentArchiveDialog
        document={archiveDocument}
        isPending={archiveMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setArchiveDocument(null)
        }}
        onConfirm={() => {
          if (archiveDocument) archiveMutation.mutate(archiveDocument.id)
        }}
      />
    </div>
  )
}

function PatientDocumentRow({
  document,
  association,
  isDownloading,
  onPreview,
  onDownload,
  onArchive,
}: {
  document: PatientDocument
  association: string | null
  isDownloading: boolean
  onPreview: (document: PatientDocument) => void
  onDownload: (document: PatientDocument) => void
  onArchive: (document: PatientDocument) => void
}) {
  const isPreviewable =
    document.mediaType === "application/pdf" ||
    document.mediaType.startsWith("image/")
  const isArchived = document.status === "ARCHIVED"

  const isImage = document.mediaType.startsWith("image/")
  return (
    <Item
      leading={
        <span className={isImage ? "flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-sky-50 text-sky-600 ring-1 ring-sky-100" : "flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-red-50 text-red-600 ring-1 ring-red-100"}>
          {isImage ? <FileImage className="size-5" /> : <FileText className="size-5" />}
        </span>
      }
      title={<span title={document.originalFileName}>{document.originalFileName}</span>}
      tags={<Chip tone={isArchived ? "gray" : "blue"}>{isArchived ? "Archivado" : DOCUMENT_TYPE_LABELS[document.documentType]}</Chip>}
      meta={association ?? document.description ?? "Documento del paciente"}
      body={<span className="text-zinc-500">{formatBytes(document.sizeBytes)}, {formatDate(document.createdAt)}</span>}
      actions={
        isArchived ? undefined : (
          <>
            {isPreviewable && <IconButton icon={Eye} label="Previsualizar documento" onClick={() => onPreview(document)} />}
            <IconButton icon={isDownloading ? Loader2 : Download} label="Descargar documento" disabled={isDownloading} onClick={() => onDownload(document)} />
            <IconButton icon={Archive} label="Archivar documento" onClick={() => onArchive(document)} />
          </>
        )
      }
    />
  )
}

function PatientDocumentArchiveDialog({
  document,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  document: PatientDocument | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  if (!document) return null
  return (
    <Modal
      open
      onClose={() => !isPending && onOpenChange(false)}
      icon={Archive}
      title="Archivar documento"
      description="Deja de aparecer en el listado y ya no se puede descargar. Se conserva su registro de auditoría."
      footer={
        <>
          <DsButton onClick={() => onOpenChange(false)} disabled={isPending}>
            Volver
          </DsButton>
          <DsButton variant="dark" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Archivando..." : "Archivar"}
          </DsButton>
        </>
      }
    >
      <p className="px-1 text-sm break-words text-zinc-700">{document.originalFileName}</p>
    </Modal>
  )
}

function associationLabel(
  document: PatientDocument,
  diagnoses: PatientDiagnosis[],
  treatments: PatientTreatment[],
  cancerDiagnosisItems: CatalogItem[],
): string | null {
  if (document.diagnosisId) {
    const diagnosis = diagnoses.find((item) => item.id === document.diagnosisId)
    return diagnosis
      ? `Diagnóstico: ${catalogLabel(cancerDiagnosisItems, diagnosis.diagnosis)}`
      : "Diagnóstico relacionado"
  }
  if (document.treatmentId) {
    const treatment = treatments.find(
      (item) => item.id === document.treatmentId,
    )
    return treatment
      ? `Tratamiento: ${treatment.treatmentType}`
      : "Tratamiento relacionado"
  }
  return null
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}
