import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  psychooncologyAppointmentsApi,
  type PsychooncologyAppointment,
} from "@/api/psychooncology-appointments"
import { PenLine } from "lucide-react"
import { Button } from "@/components/ds/button"
import { ReminderMessageDialog } from "@/components/reminder-message-dialog"

const reminderModeLabels: Record<PsychooncologyAppointment["reminderMode"], string> = {
  TWO_HOURS: "2 horas antes",
  ONE_DAY: "1 día antes",
  CUSTOM: "Personalizado",
  MANUAL: "Manual",
}

export function PsychoSessionActions({
  appointment,
  patientId,
}: {
  appointment: PsychooncologyAppointment
  patientId: string
}) {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [blocked, setBlocked] = useState<string | null>(null)
  const [editingText, setEditingText] = useState(false)
  const pending =
    appointment.status === "SCHEDULED" || appointment.status === "OVERDUE"
  const videoWithoutZoom =
    appointment.modality === "VIDEO_CALL" && !appointment.zoomLink

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: ["psychooncology-appointments", patientId],
    })
  }

  const copyReminder = useMutation({
    mutationFn: () => psychooncologyAppointmentsApi.reminder(appointment.id),
    onSuccess: async (reminder) => {
      setBlocked(null)
      await navigator.clipboard.writeText(reminder.message)
      setCopied(true)
      toast.success("Recordatorio copiado")
    },
    onError: (error: Error) => {
      if (videoWithoutZoom || error.message.includes("409")) {
        setBlocked("Esta videollamada no tiene link de Zoom. Agrégalo antes de copiar o marcar el recordatorio.")
      }
      toast.error("No se pudo copiar el recordatorio", { description: error.message })
    },
  })

  const markSent = useMutation({
    mutationFn: () => psychooncologyAppointmentsApi.markReminderSent(appointment.id),
    onSuccess: async () => {
      setBlocked(null)
      await refresh()
      toast.success("Recordatorio marcado como enviado")
    },
    onError: (error: Error) => {
      if (videoWithoutZoom) {
        setBlocked("Esta videollamada no tiene link de Zoom. Agrégalo antes de copiar o marcar el recordatorio.")
      }
      toast.error("No se pudo marcar el recordatorio", { description: error.message })
    },
  })

  const markManaged = useMutation({
    mutationFn: () => psychooncologyAppointmentsApi.markNoShowManaged(appointment.id),
    onSuccess: async () => {
      await Promise.all([
        refresh(),
        queryClient.invalidateQueries({
          queryKey: ["psychooncology-unmanaged-no-shows", patientId],
        }),
      ])
      toast.success("Inasistencia marcada como gestionada")
    },
    onError: (error: Error) =>
      toast.error("No se pudo marcar la inasistencia", { description: error.message }),
  })

  if (!pending && appointment.status !== "NO_SHOW") return null

  return (
    <div className="space-y-2" onClick={(event) => event.stopPropagation()}>
      {pending && (
        <p className="text-muted-foreground text-xs">
          Recordatorio: {reminderModeLabels[appointment.reminderMode]}
          {appointment.reminderSentAt ? " · enviado" : " · sin enviar"}
        </p>
      )}
      {blocked && <p className="text-xs text-amber-800">{blocked}</p>}
      <div className="flex flex-wrap gap-2">
        {pending && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={copyReminder.isPending || videoWithoutZoom}
              onClick={() => copyReminder.mutate()}
            >
              {copied ? "Copiado" : "Copiar recordatorio"}
            </Button>
            <Button type="button" size="sm" variant="outline" icon={PenLine} disabled={videoWithoutZoom} onClick={() => setEditingText(true)}>
              Editar texto
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={Boolean(appointment.reminderSentAt) || markSent.isPending || videoWithoutZoom}
              onClick={() => markSent.mutate()}
            >
              Marcar enviado
            </Button>
          </>
        )}
        {appointment.status === "NO_SHOW" && !appointment.noShowManagedAt && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={markManaged.isPending}
            onClick={() => markManaged.mutate()}
          >
            Marcar gestionada
          </Button>
        )}
      </div>
      {editingText && (
        <ReminderMessageDialog
          queryKey={["psychooncology-reminder", appointment.id]}
          load={async () => {
            const reminder = await psychooncologyAppointmentsApi.reminder(appointment.id)
            return { text: reminder.message, defaultText: reminder.defaultMessage, isCustom: reminder.isCustom }
          }}
          save={(text) => psychooncologyAppointmentsApi.setReminderMessage(appointment.id, text)}
          onClose={() => setEditingText(false)}
        />
      )}
      {videoWithoutZoom && pending && (
        <p className="text-xs text-amber-800">
          Esta videollamada no tiene link de Zoom. Agrégalo antes de copiar o marcar el recordatorio.
        </p>
      )}
    </div>
  )
}
