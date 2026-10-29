import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, Copy, Mail, Send } from "lucide-react"
import { toast } from "sonner"
import { remindersApi, type Reminder } from "@/api/reminders"
import { Button } from "@/components/ds/button"
import {
  reminderChannelLabels,
  reminderDeliveryLabels,
  reminderLeadLabels,
} from "@/lib/reminder-labels"

export function ReminderDeliveryActions({ reminder }: { reminder: Reminder }) {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const pendingDelivery =
    reminder.status === "PENDING" && reminder.deliveryStatus !== "SENT"

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["reminders"] }),
      queryClient.invalidateQueries({ queryKey: ["agent-reminders"] }),
      queryClient.invalidateQueries({ queryKey: ["medical-appointments"] }),
    ])
  }

  const copyMessage = useMutation({
    mutationFn: () => remindersApi.message(reminder.id),
    onSuccess: async (message) => {
      await navigator.clipboard.writeText(message.text)
      setCopied(true)
      toast.success("Mensaje copiado al portapapeles")
    },
    onError: (error: Error) =>
      toast.error("No se pudo copiar el mensaje", { description: error.message }),
  })

  const sendEmail = useMutation({
    mutationFn: () => remindersApi.sendEmail(reminder.id),
    onSuccess: async (updated) => {
      await refresh()
      if (updated.deliveryStatus === "FAILED") {
        toast.error("El correo no se envió", {
          description: updated.deliveryError ?? "Revisa el correo del paciente.",
        })
        return
      }
      toast.success("Correo enviado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo enviar el correo", { description: error.message }),
  })

  const markSent = useMutation({
    mutationFn: () => remindersApi.markSent(reminder.id),
    onSuccess: async () => {
      await refresh()
      toast.success("Recordatorio marcado como enviado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo marcar como enviado", { description: error.message }),
  })

  const leadLabel = reminder.lead ? reminderLeadLabels[reminder.lead] : null

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-[11px]">
        Canal {reminderChannelLabels[reminder.channel]}
        {leadLabel ? ` · ${leadLabel}` : ""}
        {" · "}
        Envío {reminderDeliveryLabels[reminder.deliveryStatus]}
        {reminder.deliveryError ? ` — ${reminder.deliveryError}` : ""}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7"
          disabled={copyMessage.isPending}
          onClick={() => copyMessage.mutate()}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copiado" : "Copiar mensaje"}
        </Button>
        {pendingDelivery && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7"
              disabled={sendEmail.isPending}
              onClick={() => sendEmail.mutate()}
            >
              <Mail className="size-3" />
              Enviar correo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7"
              disabled={markSent.isPending}
              onClick={() => markSent.mutate()}
            >
              <Send className="size-3" />
              Marcar como enviado
            </Button>
          </>
        )}
      </div>
      {copied && (
        <p className="text-[11px] text-emerald-700">
          El texto quedó en el portapapeles.
        </p>
      )}
    </div>
  )
}
