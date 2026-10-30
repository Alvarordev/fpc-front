import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { TextArea } from "@/components/ds/form"
import { ToneIcon } from "@/components/ds/icon"
import { Skeleton } from "@/components/ui/skeleton"
import { eventMeta, formatAlertDate } from "../_lib/alert-copy"
import { useAddAlertEvent, useAlertEvents } from "../_hooks/use-alert-timeline"

export function AlertHistory({ alertId }: { alertId: string }) {
  const { data: events = [], isLoading } = useAlertEvents(alertId)
  const addEvent = useAddAlertEvent(alertId)
  const [comment, setComment] = useState("")
  const chronological = [...events].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  async function submit() {
    const text = comment.trim()
    if (!text) return
    try {
      await addEvent.mutateAsync({ title: "Avance de gestión", description: text })
      setComment("")
      toast.success("Comentario agregado")
    } catch (error) {
      toast.error("No se pudo agregar el comentario", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      })
    }
  }

  return (
    <Panel title="Historial">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : chronological.length === 0 ? (
        <p className="text-[13px] text-zinc-500">Todavía no hay eventos en esta incidencia.</p>
      ) : (
        <ol className="space-y-3">
          {chronological.map((event) => {
            const meta = eventMeta(event.eventType)
            const actor = event.actorName ?? event.agentName ?? "El sistema"
            return (
              <li key={event.id} className="flex gap-3">
                <ToneIcon icon={meta.icon} tone={meta.tone} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{meta.label}</p>
                  {event.description && <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-600">{event.description}</p>}
                  <p className="mt-0.5 text-[13px] text-zinc-500">
                    {actor} · {formatAlertDate(event.createdAt)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-4 space-y-2">
        <TextArea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Escribe un comentario"
          rows={3}
        />
        <div className="flex justify-end">
          <Button variant="dark" disabled={!comment.trim() || addEvent.isPending} onClick={() => void submit()}>
            {addEvent.isPending ? "Guardando…" : "Agregar comentario"}
          </Button>
        </div>
      </div>
    </Panel>
  )
}
