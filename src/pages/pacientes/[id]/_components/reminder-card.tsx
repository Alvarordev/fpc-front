import { CheckCircle2, Pencil, XCircle } from "lucide-react"
import type { Reminder } from "@/api/reminders"
import { CatalogValue } from "@/components/catalog-select"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Item } from "@/components/ds/card"
import { DateTile } from "@/components/ds/date-tile"
import type { Tone } from "@/components/ds/tone"
import { ReminderDeliveryActions } from "@/components/reminder-delivery-actions"
import { reminderDeliveryLabels } from "@/lib/reminder-labels"
import { capitalize, daysFromToday, formatTime, relativeDay } from "../_lib/ficha-format"

// Recordatorio de un paciente: qué, cuándo, dónde y si el aviso salió.

const STATUS: Record<Reminder["status"], { label: string; tone: Tone }> = {
  PENDING: { label: "Pendiente", tone: "amber" },
  DONE: { label: "Completado", tone: "green" },
  DISMISSED: { label: "Descartado", tone: "gray" },
}

const DELIVERY_TONE: Record<Reminder["deliveryStatus"], Tone> = { PENDING: "amber", SENT: "green", FAILED: "red" }

const APPOINTMENT: Record<NonNullable<Reminder["medicalAppointment"]>["status"], string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Asistió",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No asistió",
}

export function ReminderCard({
  reminder,
  canManage,
  onEdit,
  onComplete,
  onDismiss,
}: {
  reminder: Reminder
  canManage: boolean
  onEdit: (reminder: Reminder) => void
  onComplete: (reminder: Reminder) => void
  onDismiss: (reminder: Reminder) => void
}) {
  const due = reminder.dueAt ?? (reminder.dueOn ? `${reminder.dueOn}T12:00:00` : null)
  const pending = reminder.status === "PENDING"
  const appointment = reminder.medicalAppointment
  const today = pending && due !== null && daysFromToday(due) === 0
  return (
    <Item
      highlight={today}
      leading={due ? <DateTile date={due} urgent={today} /> : undefined}
      title={reminder.description}
      tags={
        <>
          {reminder.kind === "MEDICAL_APPOINTMENT" && <Chip tone="blue">Cita médica</Chip>}
          <Chip tone={STATUS[reminder.status].tone}>{STATUS[reminder.status].label}</Chip>
          {appointment && <Chip>{APPOINTMENT[appointment.status]}</Chip>}
        </>
      }
      meta={
        <>
          {[due && `${capitalize(relativeDay(due))}${reminder.dueAt ? ` a las ${formatTime(reminder.dueAt)}` : ""}`, appointment?.healthCenterName].filter(Boolean).join(", ")}
          {appointment && (
            <span>
              {", "}
              <CatalogValue kind="medical_specialty" code={appointment.specialty} />
            </span>
          )}
        </>
      }
      body={
        <span className="flex items-center gap-2">
          <span className="text-zinc-500">Aviso:</span>
          <Chip tone={DELIVERY_TONE[reminder.deliveryStatus]}>{reminderDeliveryLabels[reminder.deliveryStatus]}</Chip>
        </span>
      }
      footer={
        <>
          {canManage && pending && (
            <>
              <Button icon={CheckCircle2} onClick={() => onComplete(reminder)}>
                Completar
              </Button>
              <Button icon={Pencil} onClick={() => onEdit(reminder)}>
                Editar
              </Button>
              <Button icon={XCircle} onClick={() => onDismiss(reminder)}>
                Descartar
              </Button>
            </>
          )}
          <ReminderDeliveryActions reminder={reminder} />
        </>
      }
    />
  )
}
