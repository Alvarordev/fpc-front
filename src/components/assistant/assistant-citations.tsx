import { useState } from "react"
import { Download, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ds/button"
import { openKnowledgeDocument } from "@/api/knowledge"
import type { AssistantMessage } from "@/api/assistant"

export function AssistantCitations({
  citations,
  messageId,
}: {
  citations: AssistantMessage["citations"]
  messageId: string
}) {
  const [opening, setOpening] = useState<string>()
  if (!citations?.length) return null
  return (
    <div
      className="mt-5 space-y-2"
      aria-label="Documentos que respaldan la respuesta"
    >
      <p className="flex items-center gap-2 text-[13px] font-medium text-zinc-700">
        <FileText className="size-4" />
        Fuentes documentales
      </p>
      {citations.map((citation) => (
        <details
          key={citation.number}
          id={`source-${messageId}-${citation.number}`}
          className="rounded-[14px] bg-zinc-50 px-3 py-2.5 text-[13px]"
        >
          <summary className="cursor-pointer leading-relaxed text-zinc-700">
            <span className="font-medium">
              [{citation.number}] {citation.title}
            </span>
            <span className="ml-1 text-zinc-500">
              · Versión {citation.version}
              {citation.page ? ` · pág. ${citation.page}` : ""}
            </span>
          </summary>
          <blockquote className="mt-3 leading-relaxed break-words whitespace-pre-wrap text-zinc-600">
            {citation.excerpt}
          </blockquote>
          <Button
            icon={Download}
            className="mt-3"
            disabled={Boolean(opening)}
            onClick={async () => {
              setOpening(citation.documentId)
              try {
                await openKnowledgeDocument(
                  citation.documentId,
                  citation.originalName,
                  citation.page,
                )
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "No se pudo descargar el documento.",
                )
              } finally {
                setOpening(undefined)
              }
            }}
          >
            {opening === citation.documentId
              ? "Descargando…"
              : "Descargar original"}
          </Button>
        </details>
      ))}
    </div>
  )
}
