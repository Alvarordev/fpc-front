import { useEffect, useState } from "react"
import { Download, FileText, Loader2 } from "lucide-react"
import type { PatientDocument } from "@/api/patient-documents"
import { patientDocumentsApi } from "@/api/patient-documents"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PatientDocumentPreviewDialogProps {
  patientId: string
  document: PatientDocument | null
  onOpenChange: (open: boolean) => void
  onDownload: (document: PatientDocument) => void
}

interface PreviewState {
  documentId: string
  url?: string
  error?: string
}

export function PatientDocumentPreviewDialog({
  patientId,
  document,
  onOpenChange,
  onDownload,
}: PatientDocumentPreviewDialogProps) {
  const [previewState, setPreviewState] = useState<PreviewState | null>(null)
  const open = Boolean(document)

  useEffect(() => {
    if (!document) return

    let cancelled = false
    let objectUrl: string | null = null

    patientDocumentsApi
      .content(patientId, document.id)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setPreviewState({ documentId: document.id, url: objectUrl })
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewState({
            documentId: document.id,
            error: "No se pudo cargar la previsualización.",
          })
        }
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [document, patientId])

  const currentPreview =
    document && previewState?.documentId === document.id ? previewState : null
  const previewUrl = currentPreview?.url ?? null
  const error = currentPreview?.error ?? null
  const isLoading = Boolean(document && !currentPreview)
  const isImage = document?.mediaType.startsWith("image/") ?? false

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setPreviewState(null)
          onOpenChange(false)
        }
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{document?.originalFileName ?? "Documento"}</DialogTitle>
          <DialogDescription>
            {isImage ? "Previsualización de imagen" : "Previsualización de PDF"}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/30 flex min-h-48 flex-1 items-center justify-center overflow-auto rounded-lg p-2 sm:min-h-[55vh]">
          {isLoading && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando documento...
            </div>
          )}
          {error && <p className="text-destructive text-sm">{error}</p>}
          {!isLoading && !error && previewUrl && isImage && (
            <img
              src={previewUrl}
              alt={document?.originalFileName ?? "Documento del paciente"}
              className="max-h-[65vh] max-w-full object-contain"
            />
          )}
          {!isLoading && !error && previewUrl && !isImage && (
            <iframe
              src={previewUrl}
              title={document?.originalFileName ?? "Documento PDF"}
              className="h-[65vh] w-full rounded border-0"
            />
          )}
          {!isLoading && !error && !previewUrl && (
            <FileText className="text-muted-foreground/40 size-12" />
          )}
        </div>

        <DialogFooter>
          {document && (
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={() => onDownload(document)}
            >
              <Download className="size-4" />
              Descargar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
