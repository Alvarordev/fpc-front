import { useState } from "react"
import { Link } from "react-router-dom"
import { Check, Copy, UserRound } from "lucide-react"
import { toast } from "sonner"
import type { AssistantMessage as Message } from "@/api/assistant"
import { IconButton } from "@/components/ds/button"
import { InlineAlert } from "@/components/ds/inline-alert"
import { AssistantMarkdown } from "./assistant-markdown"
import { AssistantSources } from "./assistant-sources"
import { AssistantCitations } from "./assistant-citations"

export function AssistantMessage({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false)
  if (message.role === "USER")
    return (
      <div className="flex justify-end">
        <p className="max-w-[90%] rounded-[20px] rounded-br-[10px] bg-zinc-100 px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    )
  if (message.isError)
    return (
      <div role="alert">
        <InlineAlert>{message.content}</InlineAlert>
      </div>
    )

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
    } catch {
      toast.error(
        "No se pudo copiar la respuesta. Selecciona el texto para copiarlo.",
      )
    }
  }

  return (
    <article aria-label="Respuesta del asistente" className="min-w-0">
      <AssistantSources sources={message.sources} />
      <AssistantMarkdown message={message} />
      <AssistantCitations
        citations={message.citations}
        messageId={message.id}
      />
      {message.patients.length > 0 && (
        <div
          className="mt-4 flex flex-wrap gap-2"
          aria-label="Pacientes mencionados"
        >
          {message.patients.map((patient) => (
            <Link
              key={patient.patientId}
              to={`/pacientes/${patient.patientId}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[13px] text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              <UserRound className="size-3.5 shrink-0" />
              <span className="truncate">{patient.name}</span>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-1">
        <IconButton
          icon={copied ? Check : Copy}
          label={copied ? "Respuesta copiada" : "Copiar respuesta"}
          onClick={copy}
        />
        <span className="text-xs text-zinc-500 tabular-nums">
          {new Date(message.createdAt).toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Lima",
          })}
        </span>
      </div>
    </article>
  )
}
