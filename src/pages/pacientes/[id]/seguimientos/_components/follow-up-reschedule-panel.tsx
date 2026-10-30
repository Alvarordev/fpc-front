import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { followUpsApi, type FollowUp } from "@/api/follow-ups"
import { Button } from "@/components/ds/button"
import { Field, TextInput } from "@/components/ds/form"
import { InlineAlert } from "@/components/ds/inline-alert"
import { Modal } from "@/components/ds/modal"
import { cn } from "@/lib/utils"
import { REPLACEABLE } from "../_lib/follow-up-reschedule"
import {
  capitalize,
  formatDate,
  formatTime,
  relativeDay,
} from "../../_lib/ficha-format"

// Reprogramar un seguimiento. Uno agendado (o sin respuesta) solo cambia de
// fecha; uno vencido o cancelado se cierra y se crea uno nuevo enlazado.

/** Valor para `datetime-local` en la hora local del navegador. */
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Fechas rápidas a la misma hora que la cita original (o 9:00). */
function presets(followUp: FollowUp) {
  const base = followUp.scheduledAt ? new Date(followUp.scheduledAt) : null
  const at = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    d.setHours(base?.getHours() ?? 9, base?.getMinutes() ?? 0, 0, 0)
    return toLocalInput(d)
  }
  return [
    { label: "Mañana", value: at(1) },
    { label: "En 3 días", value: at(3) },
    { label: "En 1 semana", value: at(7) },
    { label: "En 2 semanas", value: at(14) },
    { label: "En 1 mes", value: at(30) },
  ]
}

export function FollowUpRescheduleModal({
  followUp,
  patientId,
  open,
  onClose,
}: {
  followUp: FollowUp
  patientId: string
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [scheduledAt, setScheduledAt] = useState("")
  const replaces = REPLACEABLE.includes(followUp.status)
  const options = presets(followUp)

  const mutation = useMutation({
    mutationFn: () => {
      const iso = new Date(scheduledAt).toISOString()
      return replaces
        ? followUpsApi.reschedule(followUp.id, { scheduledAt: iso })
        : followUpsApi.update(followUp.id, {
            scheduledAt: iso,
            ...(followUp.status === "NO_ANSWER"
              ? { status: "SCHEDULED" as const }
              : {}),
          })
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["follow-up", followUp.id] }),
        queryClient.invalidateQueries({ queryKey: ["follow-up", result.id] }),
        queryClient.invalidateQueries({
          queryKey: ["patient-follow-ups", patientId],
        }),
        queryClient.invalidateQueries({ queryKey: ["agent-follow-ups"] }),
      ])
      toast.success("Seguimiento reprogramado", {
        description: `${capitalize(relativeDay(result.scheduledAt ?? scheduledAt))}, ${formatTime(result.scheduledAt ?? scheduledAt)}`,
      })
      setScheduledAt("")
      onClose()
    },
    onError: (error: Error) =>
      toast.error("No se pudo reprogramar", { description: error.message }),
  })

  const [pastError, setPastError] = useState(false)

  function submit() {
    // Se valida al enviar: la hora actual no se lee durante el render.
    if (new Date(scheduledAt).getTime() <= Date.now()) return setPastError(true)
    mutation.mutate()
  }

  return (
    <Modal
      open={open}
      onClose={() => !mutation.isPending && onClose()}
      icon={CalendarClock}
      title="Reprogramar seguimiento"
      description={
        followUp.scheduledAt
          ? `Estaba agendado para el ${formatDate(followUp.scheduledAt)} a las ${formatTime(followUp.scheduledAt)}.`
          : "No tenía fecha agendada."
      }
      footer={
        <>
          <Button onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="dark"
            onClick={submit}
            disabled={!scheduledAt || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Reprogramar
          </Button>
        </>
      }
    >
      <div className="space-y-4 rounded-[18px] bg-white p-4 ring-1 ring-zinc-200/70">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Fechas rápidas"
        >
          {options.map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={scheduledAt === o.value}
              onClick={() => {
                setScheduledAt(o.value)
                setPastError(false)
              }}
              className={cn(
                "inline-flex h-8 items-center rounded-[10px] px-3 text-sm font-medium transition-[background-color,color,transform] active:scale-[0.97]",
                scheduledAt === o.value
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <Field
          label="Fecha y hora"
          error={pastError ? "Elige una fecha futura." : undefined}
          hint={
            replaces
              ? "Se creará un seguimiento nuevo y este quedará enlazado."
              : undefined
          }
        >
          {(id) => (
            <TextInput
              id={id}
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => {
                setScheduledAt(e.target.value)
                setPastError(false)
              }}
              className="sm:w-64"
            />
          )}
        </Field>
      </div>
    </Modal>
  )
}

/** Aviso de seguimiento vencido o cancelado; el botón Reprogramar está en la cabecera. */
export function FollowUpReschedulePanel({
  followUp,
  patientId,
}: {
  followUp: FollowUp
  patientId: string
}) {
  if (followUp.nextFollowUpId) {
    return (
      <div className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm">
        Ya se reprogramó.{" "}
        <Link
          className="font-medium underline underline-offset-2"
          to={`/pacientes/${patientId}/seguimientos/${followUp.nextFollowUpId}`}
        >
          Ver el seguimiento nuevo
        </Link>
      </div>
    )
  }
  if (!REPLACEABLE.includes(followUp.status)) return null

  return (
    <InlineAlert
      aside={
        followUp.status === "OVERDUE" && followUp.scheduledAt
          ? capitalize(`venció ${relativeDay(followUp.scheduledAt)}`)
          : undefined
      }
    >
      {followUp.status === "OVERDUE"
        ? "Este seguimiento está vencido. Reprográmalo o regístralo ahora."
        : "Este seguimiento se canceló. Puedes reprogramarlo."}
    </InlineAlert>
  )
}
