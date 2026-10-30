import { useEffect, useState } from "react"
import { ImageOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "@/components/ds/modal"
import { Panel } from "@/components/ds/card"
import { Button } from "@/components/ds/button"
import { Chip, MetaTag } from "@/components/ds/badge"
import { Field, SelectField, TextArea } from "@/components/ds/form"
import { toneDot } from "@/components/ds/tone"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { pathTitles } from "@/lib/navigation"
import { useAuthStore } from "@/store/auth-store"
import type {
  SupportTicket,
  SupportTicketAttachment,
  SupportTicketMessage,
  SupportTicketStatus,
} from "@/api/support-tickets"
import {
  useAddTicketMessage,
  useMarkTicketSeen,
  useTicketImageUrl,
  useUpdateSupportTicket,
} from "../_hooks/use-support-tickets"
import { formatTicketDate, ticketStatusMeta, ticketStatusOrder, ticketTypeMeta } from "../_lib/ticket-labels"
import { MAX_TICKET_IMAGES, useImageDrafts } from "../_hooks/use-image-drafts"
import { ImageDraftGrid, ImageDropzone } from "./image-drafts"

const statusOptions = ticketStatusOrder.map((value) => ({ value, label: ticketStatusMeta[value].label }))
const CLOSED: SupportTicketStatus[] = ["COMPLETED", "DISMISSED"]

type Author = SupportTicketMessage["author"]

function screenName(path: string) {
  return pathTitles["/" + (path.split("/").filter(Boolean)[0] ?? "")] ?? path
}

function TicketImage({ ticketId, attachment }: { ticketId: string; attachment: SupportTicketAttachment }) {
  const { url, isError } = useTicketImageUrl(ticketId, attachment.id)
  const [expanded, setExpanded] = useState(false)
  const name = attachment.originalFileName

  if (isError) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-[10px] bg-zinc-50 text-zinc-400 ring-1 ring-zinc-200">
        <ImageOff className="size-5" />
      </div>
    )
  }
  if (!url) return <div className="aspect-video animate-pulse rounded-[10px] bg-zinc-100 ring-1 ring-zinc-200" />

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        title="Ver en tamaño completo"
        className="block w-full cursor-zoom-in overflow-hidden rounded-[10px] ring-1 ring-zinc-200"
      >
        <img src={url} alt={name} className="aspect-video w-full object-cover" />
      </button>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[95vw] rounded-[20px] p-2 sm:max-w-5xl">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <img src={url} alt={name} className="max-h-[85vh] w-full rounded-[14px] object-contain" />
        </DialogContent>
      </Dialog>
    </>
  )
}

function ImageGrid({ ticketId, attachments }: { ticketId: string; attachments: SupportTicketAttachment[] }) {
  if (attachments.length === 0) return null
  return (
    <div className="mt-2.5 grid grid-cols-2 gap-2">
      {attachments.map((a) => (
        <TicketImage key={a.id} ticketId={ticketId} attachment={a} />
      ))}
    </div>
  )
}

/** Una entrada del hilo: quién, cuándo y lo que escribió. */
function ThreadEntry({
  who,
  when,
  mine,
  children,
}: {
  who: string
  when: string
  mine: boolean
  children: React.ReactNode
}) {
  return (
    <li className={cn("rounded-[14px] p-3 ring-1", mine ? "bg-white ring-zinc-200" : "bg-zinc-50 ring-zinc-200/60")}>
      <p className="mb-1 flex flex-wrap items-baseline gap-x-2 text-[13px]">
        <span className="font-medium text-zinc-900">{who}</span>
        <span className="text-zinc-500 tabular-nums">{when}</span>
      </p>
      {children}
    </li>
  )
}

function StatusEvent({ who, status, when, reopened }: { who: string; status: SupportTicketStatus; when: string; reopened: boolean }) {
  const meta = ticketStatusMeta[status]
  return (
    <li className="flex items-center gap-2 px-3 text-[13px] text-zinc-500">
      <span className={cn("size-1.5 shrink-0 rounded-full", toneDot[meta.tone])} />
      <span>
        {reopened ? (
          who === "Tú" ? (
            "Reabriste el ticket"
          ) : (
            <>
              <span className="text-zinc-700">{who}</span> reabrió el ticket
            </>
          )
        ) : who === "Tú" ? (
          <>
            Cambiaste el estado a <span className="font-medium text-zinc-900">{meta.label}</span>
          </>
        ) : (
          <>
            <span className="text-zinc-700">{who}</span> cambió el estado a <span className="font-medium text-zinc-900">{meta.label}</span>
          </>
        )}
        {" · "}
        <span className="tabular-nums">{when}</span>
      </span>
    </li>
  )
}

function Composer({ ticket, isReporter }: { ticket: SupportTicket; isReporter: boolean }) {
  const [body, setBody] = useState("")
  const drafts = useImageDrafts()
  const addMessage = useAddTicketMessage()
  const closed = CLOSED.includes(ticket.status)
  const ready = body.trim() !== "" || drafts.images.length > 0

  async function send() {
    if (!ready) return
    try {
      await addMessage.mutateAsync({ id: ticket.id, body: body.trim(), images: drafts.files })
      if (isReporter && closed) toast.success(`Ticket #${ticket.ticketNumber} reabierto`)
      setBody("")
      drafts.clear()
    } catch (err) {
      drafts.setError(err instanceof Error ? err.message : "No se pudo enviar la respuesta.")
    }
  }

  return (
    <Panel>
      <div className="space-y-3" onPaste={drafts.onPaste}>
        <Field
          label={isReporter && closed ? "¿Sigue pasando?" : "Responder"}
          hint={isReporter && closed ? "Cuéntalo aquí y el ticket se reabrirá." : undefined}
        >
          {(id) => (
            <TextArea
              id={id}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send()
              }}
              rows={3}
              className="min-h-20"
              placeholder={isReporter ? "Agrega detalles, responde al equipo o indica si no quedó resuelto." : "Responde a quien reportó."}
            />
          )}
        </Field>
        <ImageDraftGrid images={drafts.images} onRemove={drafts.remove} />
        {drafts.error && <p className="text-[13px] text-red-700">{drafts.error}</p>}
        <div className="flex items-center justify-between gap-2">
          <ImageDropzone compact onFiles={drafts.add} disabled={drafts.images.length >= MAX_TICKET_IMAGES} />
          <Button variant="dark" onClick={send} disabled={!ready || addMessage.isPending}>
            {addMessage.isPending && <Loader2 className="size-4 animate-spin" />}
            {isReporter && closed ? "Enviar y reabrir" : "Enviar"}
          </Button>
        </div>
      </div>
    </Panel>
  )
}

export function TicketDetailModal({ ticket, isAdmin, onClose }: { ticket: SupportTicket | null; isAdmin: boolean; onClose: () => void }) {
  if (!ticket) return null
  return <TicketDetail key={ticket.id} ticket={ticket} isAdmin={isAdmin} onClose={onClose} />
}

function TicketDetail({ ticket, isAdmin, onClose }: { ticket: SupportTicket; isAdmin: boolean; onClose: () => void }) {
  const me = useAuthStore((s) => s.user?.id)
  const update = useUpdateSupportTicket()
  const markSeen = useMarkTicketSeen()
  const type = ticketTypeMeta[ticket.type]
  const statusMeta = ticketStatusMeta[ticket.status]
  const isReporter = ticket.createdBy.id === me

  // Abrir el ticket apaga su punto de novedades.
  const { hasUpdates, id } = ticket
  const { mutate: markAsSeen } = markSeen
  useEffect(() => {
    if (hasUpdates) markAsSeen(id)
  }, [hasUpdates, id, markAsSeen])

  function nameOf(author: Author) {
    if (author.id === me) return "Tú"
    if (author.role === "ADMIN" && !isAdmin) return "Equipo técnico"
    return author.email
  }

  async function changeStatus(status: SupportTicketStatus) {
    try {
      await update.mutateAsync({ id: ticket.id, status })
      toast.success(`Ticket #${ticket.ticketNumber}: ${ticketStatusMeta[status].label}`)
    } catch {
      toast.error("No se pudo cambiar el estado", { description: "Inténtalo de nuevo." })
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      icon={type.icon}
      title={ticket.title}
      description={`#${ticket.ticketNumber}${ticket.pagePath ? ` · reportado desde ${screenName(ticket.pagePath)}` : ""}`}
      tags={
        <>
          <Chip tone={statusMeta.tone}>{statusMeta.label}</Chip>
          <MetaTag icon={type.icon}>{type.label}</MetaTag>
        </>
      }
    >
      {isAdmin && (
        <Panel>
          <Field label="Estado" hint="Quien reportó verá el cambio en su hilo.">
            {(fieldId) => (
              <SelectField id={fieldId} value={ticket.status} onChange={changeStatus} options={statusOptions} disabled={update.isPending} />
            )}
          </Field>
        </Panel>
      )}

      <Panel title="Conversación">
        <ol className="space-y-2.5">
          <ThreadEntry who={nameOf(ticket.createdBy)} when={formatTicketDate(ticket.createdAt)} mine={isReporter}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-900">{ticket.description}</p>
            <ImageGrid ticketId={ticket.id} attachments={ticket.attachments} />
          </ThreadEntry>

          {ticket.messages.map((message) =>
            message.kind === "STATUS_CHANGE" && message.status ? (
              <StatusEvent
                key={message.id}
                who={nameOf(message.author)}
                status={message.status}
                when={formatTicketDate(message.createdAt)}
                reopened={message.status === "PENDING" && message.author.id === ticket.createdBy.id}
              />
            ) : (
              <ThreadEntry key={message.id} who={nameOf(message.author)} when={formatTicketDate(message.createdAt)} mine={message.author.id === me}>
                {message.body && <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-900">{message.body}</p>}
                <ImageGrid ticketId={ticket.id} attachments={message.attachments} />
              </ThreadEntry>
            ),
          )}
        </ol>
        {!isAdmin && ticket.messages.length === 0 && (
          <p className="mt-3 px-1 text-[13px] text-zinc-500">Aún sin respuesta del equipo. Verás un punto en tus tickets cuando la haya.</p>
        )}
      </Panel>

      <Composer ticket={ticket} isReporter={isReporter} />
    </Modal>
  )
}
