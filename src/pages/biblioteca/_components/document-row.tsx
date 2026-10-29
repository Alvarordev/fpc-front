import { Download, FileText, RotateCcw, Trash2 } from "lucide-react"
import { Button, IconButton } from "@/components/ds/button"
import { Status } from "@/components/ds/badge"
import type { Tone } from "@/components/ds/tone"
import type { KnowledgeDocument } from "@/api/knowledge"

export type DocumentAction = "publish" | "archive" | "retry" | "remove"

export function DocumentRow({
  document: doc,
  busy,
  onAction,
  onDownload,
}: {
  document: KnowledgeDocument
  busy: boolean
  onAction: (action: DocumentAction, doc: KnowledgeDocument) => void
  onDownload: (doc: KnowledgeDocument) => void
}) {
  const indexing = ["PENDING", "PROCESSING"].includes(doc.indexStatus)
  const state: { label: string; tone: Tone } =
    doc.status === "PUBLISHED"
      ? { label: "Publicado", tone: "green" }
      : doc.status === "ARCHIVED"
        ? { label: "Retirado", tone: "gray" }
        : doc.indexStatus === "FAILED"
          ? { label: "No se pudo preparar", tone: "red" }
          : indexing
            ? { label: "En preparación", tone: "blue" }
            : { label: "Borrador listo", tone: "amber" }
  return (
    <li className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start">
      <FileText className="mt-1 hidden size-5 shrink-0 text-zinc-500 sm:block" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="text-sm font-medium break-words text-zinc-900">
            {doc.title}
          </h2>
          <Status tone={state.tone}>{state.label}</Status>
        </div>
        <p className="mt-1.5 text-[13px] break-words text-zinc-500">
          Versión {doc.version} · {doc.originalName} ·{" "}
          {doc.size < 1_048_576
            ? `${Math.max(1, Math.round(doc.size / 1024))} KB`
            : `${(doc.size / 1_048_576).toLocaleString("es-PE", { maximumFractionDigits: 1 })} MB`}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Subido el{" "}
          {new Date(doc.createdAt).toLocaleDateString("es-PE", {
            timeZone: "America/Lima",
          })}
          {doc.publishedAt &&
            ` · Publicado el ${new Date(doc.publishedAt).toLocaleDateString("es-PE", { timeZone: "America/Lima" })}`}
        </p>
        {doc.indexError && (
          <p className="mt-2 text-[13px] leading-relaxed text-red-700">
            {doc.indexError}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <IconButton
          icon={Download}
          label={`Descargar ${doc.title}`}
          disabled={busy}
          onClick={() => onDownload(doc)}
        />
        {doc.status === "PUBLISHED" ? (
          <Button disabled={busy} onClick={() => onAction("archive", doc)}>
            Retirar
          </Button>
        ) : doc.indexStatus === "READY" ? (
          <Button
            variant="dark"
            disabled={busy}
            onClick={() => onAction("publish", doc)}
          >
            Publicar
          </Button>
        ) : doc.indexStatus === "FAILED" ? (
          <Button
            icon={RotateCcw}
            disabled={busy}
            onClick={() => onAction("retry", doc)}
          >
            Reintentar
          </Button>
        ) : null}
        {doc.status !== "PUBLISHED" && !indexing && (
          <IconButton
            icon={Trash2}
            label={`Eliminar ${doc.title}`}
            disabled={busy}
            onClick={() => onAction("remove", doc)}
          />
        )}
      </div>
    </li>
  )
}
