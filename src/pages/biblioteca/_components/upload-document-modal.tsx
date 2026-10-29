import { useRef, useState } from "react"
import { FileText, FolderOpen, Upload } from "lucide-react"
import { Button } from "@/components/ds/button"
import { Field, TextInput } from "@/components/ds/form"
import { Modal } from "@/components/ds/modal"
import { InlineAlert } from "@/components/ds/inline-alert"

export function UploadDocumentModal({
  open,
  onClose,
  onUpload,
  busy,
  error,
}: {
  open: boolean
  onClose: () => void
  onUpload: (input: { title: string; version: string; file: File }) => void
  busy: boolean
  error?: string
}) {
  const [file, setFile] = useState<File>()
  const [title, setTitle] = useState("")
  const [version, setVersion] = useState("1")
  const [fileError, setFileError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formId = "upload-knowledge-document"
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose()
      }}
      icon={FileText}
      title="Subir documento"
      description="Se guardará como borrador. Podrás publicarlo cuando esté listo para consultar."
      footer={
        <>
          <Button disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            form={formId}
            type="submit"
            variant="dark"
            icon={Upload}
            disabled={
              busy || !file || title.trim().length < 2 || !version.trim()
            }
          >
            {busy ? "Subiendo documento…" : "Subir documento"}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="space-y-5 rounded-[18px] bg-white p-4 ring-1 ring-zinc-200/70"
        onSubmit={(event) => {
          event.preventDefault()
          if (file && title.trim().length >= 2 && version.trim() && !busy)
            onUpload({ title: title.trim(), version: version.trim(), file })
        }}
      >
        <Field label="Archivo" hint="PDF o Word (.docx), hasta 10 MB.">
          {(id) => (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  icon={FolderOpen}
                  disabled={busy}
                  aria-controls={id}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar archivo
                </Button>
                <span
                  className="min-w-0 text-[13px] break-words text-zinc-500"
                  aria-live="polite"
                >
                  {file?.name ?? "Ningún archivo seleccionado"}
                </span>
              </div>
              <input
                ref={fileInputRef}
                id={id}
                type="file"
                accept=".pdf,.docx"
                disabled={busy}
                required
                className="sr-only"
                tabIndex={-1}
                onChange={(event) => {
                  const selected = event.target.files?.[0]
                  if (!selected) {
                    setFile(undefined)
                    return
                  }
                  if (
                    !/\.(pdf|docx)$/i.test(selected.name) ||
                    selected.size > 10_485_760 ||
                    !selected.size
                  ) {
                    setFile(undefined)
                    setFileError(
                      "Selecciona un PDF o Word (.docx) válido de hasta 10 MB.",
                    )
                    event.target.value = ""
                    return
                  }
                  setFileError("")
                  setFile(selected)
                  if (!title)
                    setTitle(
                      selected.name.replace(/\.[^.]+$/, "").slice(0, 200),
                    )
                }}
              />
            </>
          )}
        </Field>
        <Field
          label="Título"
          hint="El nombre que verán los agentes en las fuentes del chat."
        >
          {(id) => (
            <TextInput
              id={id}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={2}
              maxLength={200}
              disabled={busy}
              required
              placeholder="Por ejemplo: Manual de enrolamiento"
            />
          )}
        </Field>
        <Field label="Versión">
          {(id) => (
            <TextInput
              id={id}
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              maxLength={50}
              disabled={busy}
              required
              className="max-w-48"
              placeholder="Por ejemplo: 2026.1"
            />
          )}
        </Field>
        {(fileError || error) && (
          <div role="alert">
            <InlineAlert>{fileError || error}</InlineAlert>
          </div>
        )}
      </form>
    </Modal>
  )
}
