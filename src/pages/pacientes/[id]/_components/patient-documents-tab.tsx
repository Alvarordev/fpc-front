import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Archive,
  Download,
  Eye,
  FileImage,
  FileText,
  FileUp,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import type { PatientDiagnosis, PatientTreatment } from "@/api/patients"
import {
  patientDocumentsApi,
  type PatientDocument,
  type PatientDocumentType,
} from "@/api/patient-documents"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthStore } from "@/store/auth-store"
import { usePatientDocuments } from "../_hooks/use-patient-documents"
import { PatientDocumentPreviewDialog } from "./patient-document-preview-dialog"
import { PatientDocumentUploadDialog } from "./patient-document-upload-dialog"

const DOCUMENT_TYPE_LABELS: Record<PatientDocumentType, string> = {
  MEDICAL_REPORT: "Informe médico",
  PRESCRIPTION: "Receta",
  OTHER: "Otro",
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
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                <FileUp className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Documentos clínicos</h2>
                <p className="text-muted-foreground mt-1 max-w-xl text-xs leading-relaxed">
                  Informes, recetas y otros archivos del paciente en un espacio
                  privado y asociado a su historial.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={showArchived ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setShowArchived((value) => !value)}
              >
                <RotateCcw className="size-3.5" />
                {showArchived ? "Ocultar archivados" : "Ver archivados"}
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                onClick={openUpload}
              >
                <Plus className="size-4" />
                Agregar archivo
              </Button>
            </div>
          </div>

          {documentsQuery.isLoading ? (
            <div className="text-muted-foreground flex h-36 items-center justify-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando documentos...
            </div>
          ) : documentsQuery.isError ? (
            <div className="flex h-36 flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-medium">
                No se pudieron cargar los documentos.
              </p>
              <p className="text-muted-foreground text-xs">
                Revisa tu conexión e intenta nuevamente.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void documentsQuery.refetch()}
              >
                Reintentar
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <div className="border-border flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-5 text-center">
              <FileText className="text-muted-foreground/35 size-9" />
              <p className="text-sm font-medium">
                {showArchived
                  ? "Sin documentos archivados"
                  : "Aún no hay documentos"}
              </p>
              <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
                {showArchived
                  ? "Los archivos archivados aparecerán aquí para consulta de auditoría."
                  : "Agrega informes médicos, recetas u otros archivos relevantes para la atención."}
              </p>
              {!showArchived && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-1.5"
                  onClick={openUpload}
                >
                  <Plus className="size-3.5" />
                  Agregar primer archivo
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>
                  {documentsQuery.data?.total ?? documents.length} documento
                  {(documentsQuery.data?.total ?? documents.length) === 1
                    ? ""
                    : "s"}
                </span>
                <span>Máximo 10 MB por archivo</span>
              </div>
              {documents.map((document) => (
                <PatientDocumentRow
                  key={document.id}
                  document={document}
                  association={associationLabel(
                    document,
                    diagnoses,
                    treatments,
                  )}
                  isDownloading={downloadingId === document.id}
                  onPreview={setPreviewDocument}
                  onDownload={downloadDocument}
                  onArchive={setArchiveDocument}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

  return (
    <article className="border-border flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
      <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
        {document.mediaType.startsWith("image/") ? (
          <FileImage className="size-4" />
        ) : (
          <FileText className="size-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className="truncate text-sm font-medium"
            title={document.originalFileName}
          >
            {document.originalFileName}
          </p>
          <Badge
            variant={isArchived ? "outline" : "secondary"}
            className="text-[10px]"
          >
            {isArchived
              ? "Archivado"
              : DOCUMENT_TYPE_LABELS[document.documentType]}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1 truncate text-xs">
          {association ?? document.description ?? "Documento del paciente"}
        </p>
        <p className="text-muted-foreground/75 mt-1 text-[11px]">
          {formatBytes(document.sizeBytes)} · {formatDate(document.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
        {!isArchived && isPreviewable && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Previsualizar documento"
            aria-label="Previsualizar documento"
            onClick={() => onPreview(document)}
          >
            <Eye className="size-4" />
          </Button>
        )}
        {!isArchived && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Descargar documento"
            aria-label="Descargar documento"
            onClick={() => onDownload(document)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
          </Button>
        )}
        {!isArchived && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            title="Archivar documento"
            aria-label="Archivar documento"
            onClick={() => onArchive(document)}
          >
            <Archive className="size-4" />
          </Button>
        )}
      </div>
    </article>
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
  return (
    <Dialog open={Boolean(document)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archivar documento</DialogTitle>
          <DialogDescription>
            El archivo dejará de aparecer en el listado normal y ya no podrá
            descargarse. Se conservará su registro de auditoría.
          </DialogDescription>
        </DialogHeader>
        <p className="bg-muted/50 rounded-lg px-3 py-2 text-sm break-words">
          {document?.originalFileName}
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Archivando..." : "Archivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function associationLabel(
  document: PatientDocument,
  diagnoses: PatientDiagnosis[],
  treatments: PatientTreatment[],
): string | null {
  if (document.diagnosisId) {
    const diagnosis = diagnoses.find((item) => item.id === document.diagnosisId)
    return diagnosis
      ? `Diagnóstico: ${diagnosis.diagnosis}`
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
