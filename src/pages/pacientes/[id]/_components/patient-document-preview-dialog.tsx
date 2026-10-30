import { useEffect, useState } from "react"
import { Download, FileText, Loader2 } from "lucide-react"
import type { PatientDocument } from "@/api/patient-documents"
import { patientDocumentsApi } from "@/api/patient-documents"
import { Button } from "@/components/ds/button"
import { Modal } from "@/components/ds/modal"

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

export function PatientDocumentPreviewDialog({ patientId, document, onOpenChange, onDownload }: PatientDocumentPreviewDialogProps) {
  const [previewState, setPreviewState] = useState<PreviewState | null>(null)

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
        if (!cancelled) setPreviewState({ documentId: document.id, error: "No se pudo cargar la vista previa. Descárgalo para abrirlo." })
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [document, patientId])

  if (!document) return null
  const current = previewState?.documentId === document.id ? previewState : null
  const isImage = document.mediaType.startsWith("image/")

  return (
    <Modal
      open
      onClose={() => {
        setPreviewState(null)
        onOpenChange(false)
      }}
      icon={FileText}
      title={document.originalFileName}
      description={isImage ? "Imagen" : "Documento PDF"}
      footer={
        <Button icon={Download} onClick={() => onDownload(document)}>
          Descargar
        </Button>
      }
    >
      <div className="flex min-h-48 items-center justify-center overflow-auto rounded-[18px] bg-white p-2 ring-1 ring-zinc-200/70 sm:min-h-[55vh]">
        {!current ? (
          <p className="flex items-center gap-2 text-[13px] text-zinc-500">
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
            Cargando documento…
          </p>
        ) : current.error ? (
          <p className="text-[13px] text-red-700">{current.error}</p>
        ) : isImage ? (
          <img src={current.url} alt={document.originalFileName} className="max-h-[60vh] max-w-full object-contain" />
        ) : (
          <iframe src={current.url} title={document.originalFileName} className="h-[60vh] w-full rounded-[12px] border-0" />
        )}
      </div>
    </Modal>
  )
}
