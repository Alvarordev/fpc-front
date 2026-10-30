import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Loader2, MessageSquarePlus } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "@/components/ds/modal"
import { Panel } from "@/components/ds/card"
import { Button } from "@/components/ds/button"
import { ToneIcon } from "@/components/ds/icon"
import { Field, TextArea, TextInput } from "@/components/ds/form"
import { cn } from "@/lib/utils"
import type { SupportTicketType } from "@/api/support-tickets"
import { useCreateSupportTicket } from "../_hooks/use-support-tickets"
import { ticketTypeMeta, ticketTypeOrder } from "../_lib/ticket-labels"
import { MAX_TICKET_IMAGES, useImageDrafts } from "../_hooks/use-image-drafts"
import { ImageDraftGrid, ImageDropzone } from "./image-drafts"

export function CreateTicketModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation()
  const [type, setType] = useState<SupportTicketType | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const drafts = useImageDrafts()
  const createTicket = useCreateSupportTicket()

  const ready = type !== null && title.trim() !== "" && description.trim() !== ""

  async function submit() {
    if (!type || !ready) return
    try {
      const ticket = await createTicket.mutateAsync({
        type,
        title: title.trim(),
        description: description.trim(),
        pagePath: pathname,
        images: drafts.files,
      })
      toast.success(`Ticket #${ticket.ticketNumber} enviado`, {
        description: "Puedes ver su estado en Mis tickets.",
      })
      setType(null)
      setTitle("")
      setDescription("")
      drafts.clear()
      onClose()
    } catch (err) {
      drafts.setError(err instanceof Error ? err.message : "No se pudo enviar el ticket. Inténtalo de nuevo.")
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !createTicket.isPending && onClose()}
      icon={MessageSquarePlus}
      title="Reportar un problema o pedir un cambio"
      description="El equipo técnico lo revisa y te responde en Mis tickets."
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Link to="/tickets" onClick={onClose} className="text-[13px] text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline">
            Ver mis tickets
          </Link>
          <div className="flex gap-2">
            <Button onClick={onClose} disabled={createTicket.isPending}>
              Cancelar
            </Button>
            <Button variant="dark" onClick={submit} disabled={!ready || createTicket.isPending}>
              {createTicket.isPending && <Loader2 className="size-4 animate-spin" />}
              Enviar ticket
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3" onPaste={drafts.onPaste}>
        <Panel title="¿Qué tipo de solicitud es?">
          <div role="radiogroup" aria-label="Tipo de solicitud" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ticketTypeOrder.map((value) => {
              const meta = ticketTypeMeta[value]
              const active = type === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setType(value)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-[14px] p-3 text-left ring-1 transition-[background-color,box-shadow,transform] active:scale-[0.99] motion-reduce:transform-none",
                    active ? "bg-white ring-2 ring-zinc-900" : "bg-zinc-50 ring-zinc-200/60 hover:bg-zinc-100/70",
                  )}
                >
                  <ToneIcon icon={meta.icon} tone={meta.tone} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-zinc-900">{meta.label}</span>
                    <span className="block text-[13px] text-zinc-500">{meta.hint}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel>
          <div className="space-y-4">
            <Field label="Título">
              {(id) => (
                <TextInput
                  id={id}
                  value={title}
                  maxLength={160}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. No puedo guardar el seguimiento del paciente"
                />
              )}
            </Field>
            <Field label="Descripción" hint="Qué estabas haciendo, qué esperabas y qué pasó.">
              {(id) => <TextArea id={id} value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />}
            </Field>
          </div>
        </Panel>

        <Panel title={`Capturas de pantalla · ${drafts.images.length}/${MAX_TICKET_IMAGES}`}>
          <div className="space-y-3">
            <ImageDraftGrid images={drafts.images} onRemove={drafts.remove} />
            {drafts.images.length < MAX_TICKET_IMAGES && <ImageDropzone onFiles={drafts.add} />}
          </div>
        </Panel>

        {drafts.error && (
          <p role="alert" className="px-1 text-[13px] text-red-700">
            {drafts.error}
          </p>
        )}
      </div>
    </Modal>
  )
}
