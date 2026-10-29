import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarClock } from "lucide-react"
import { toast } from "sonner"
import { followUpsApi, type FollowUp } from "@/api/follow-ups"
import { Button } from "@/components/ds/button"
import { Field, TextInput } from "@/components/ds/form"
import { InlineAlert } from "@/components/ds/inline-alert"
import { capitalize, relativeDay } from "../../_lib/ficha-format"

// Aviso de seguimiento vencido o cancelado, con la reprogramación en línea.

export function FollowUpReschedulePanel({ followUp, patientId, canReschedule }: { followUp: FollowUp; patientId: string; canReschedule: boolean }) {
  const queryClient = useQueryClient()
  const [scheduledAt, setScheduledAt] = useState("")
  const canChangeDate = followUp.status === "OVERDUE" || followUp.status === "CANCELLED"

  const mutation = useMutation({
    mutationFn: () => followUpsApi.reschedule(followUp.id, { scheduledAt: new Date(scheduledAt).toISOString() }),
    onSuccess: async (created) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["follow-up", followUp.id] }),
        queryClient.invalidateQueries({ queryKey: ["follow-up", created.id] }),
        queryClient.invalidateQueries({ queryKey: ["patient-follow-ups", patientId] }),
        queryClient.invalidateQueries({ queryKey: ["agent-follow-ups"] }),
      ])
      toast.success("Seguimiento reprogramado")
      setScheduledAt("")
    },
    onError: (error: Error) => toast.error("No se pudo reprogramar", { description: error.message }),
  })

  if (followUp.nextFollowUpId) {
    return (
      <div className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm">
        Ya se reprogramó.{" "}
        <Link className="font-medium underline underline-offset-2" to={`/pacientes/${patientId}/seguimientos/${followUp.nextFollowUpId}`}>
          Ver el seguimiento nuevo
        </Link>
      </div>
    )
  }
  if (!canChangeDate) return null

  return (
    <div className="space-y-3 rounded-[20px] border border-red-200 bg-white p-4">
      <InlineAlert aside={followUp.status === "OVERDUE" && followUp.scheduledAt ? capitalize(`venció ${relativeDay(followUp.scheduledAt)}`) : undefined}>
        {followUp.status === "OVERDUE" ? "Este seguimiento está vencido. Reprográmalo o regístralo ahora." : "Este seguimiento se canceló. Puedes reprogramarlo."}
      </InlineAlert>
      {canReschedule && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!scheduledAt) return
            if (new Date(scheduledAt).getTime() <= Date.now()) {
              toast.error("Elige una fecha futura")
              return
            }
            mutation.mutate()
          }}
        >
          <Field label="Nueva fecha y hora" className="w-64">
            {(id) => <TextInput id={id} type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />}
          </Field>
          <Button type="submit" icon={CalendarClock} disabled={!scheduledAt || mutation.isPending}>
            {mutation.isPending ? "Reprogramando…" : "Reprogramar"}
          </Button>
          {followUp.status === "OVERDUE" && <span className="pb-2 text-[13px] text-zinc-500">O registra un intento abajo si ya estás en contacto.</span>}
        </form>
      )}
    </div>
  )
}
