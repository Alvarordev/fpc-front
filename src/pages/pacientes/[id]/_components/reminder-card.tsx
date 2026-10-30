import { useQuery } from "@tanstack/react-query"
import { Bell, CheckCircle2, Pencil, XCircle } from "lucide-react"
import { remindersApi } from "@/api/reminders"
import type { Reminder } from "@/api/reminders"
import { CatalogValue } from "@/components/catalog-select"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Item, Panel } from "@/components/ds/card"
import { DataList } from "@/components/ds/data"
import { Modal } from "@/components/ds/modal"
import { DateTile } from "@/components/ds/date-tile"
import type { Tone } from "@/components/ds/tone"
import { ReminderDeliveryActions } from "@/components/reminder-delivery-actions"
import { reminderChannelLabels, reminderDeliveryLabels, reminderLeadLabels } from "@/lib/reminder-labels"
import { capitalize, daysFromToday, formatDate, formatTime, relativeDay } from "../_lib/ficha-format"

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
  onOpen,
}: {
  reminder: Reminder
  canManage: boolean
  onEdit: (reminder: Reminder) => void
  onComplete: (reminder: Reminder) => void
  onDismiss: (reminder: Reminder) => void
  /** Abre el detalle (recordatorios ya cerrados). */
  onOpen?: (reminder: Reminder) => void
}) {
  const due = reminder.dueAt ?? (reminder.dueOn ? `${reminder.dueOn}T12:00:00` : null)
  const pending = reminder.status === "PENDING"
  const appointment = reminder.medicalAppointment
  const today = pending && due !== null && daysFromToday(due) === 0
  return (
    <Item
      highlight={today}
      onOpen={onOpen ? () => onOpen(reminder) : undefined}
      openLabel={`Ver el detalle de ${reminder.description}`}
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

const dateTime = (value: string | null | undefined) => (value ? `${formatDate(value)}, ${formatTime(value)}` : null)

/** Detalle de un recordatorio: qué se recordó, cómo se cerró y qué texto recibió el paciente. */
export function ReminderDetailModal({ reminder, onClose }: { reminder: Reminder; onClose: () => void }) {
  const appointment = reminder.medicalAppointment
  const message = useQuery({ queryKey: ["reminder-message", reminder.id], queryFn: () => remindersApi.message(reminder.id) })
  const due = reminder.dueAt ? dateTime(reminder.dueAt) : formatDate(reminder.dueOn)
  return (
    <Modal
      open
      onClose={onClose}
      icon={Bell}
      title={reminder.description}
      description={reminder.kind === "MEDICAL_APPOINTMENT" ? "Recordatorio de cita médica" : "Recordatorio"}
      tags={
        <>
          <Chip tone={STATUS[reminder.status].tone}>{STATUS[reminder.status].label}</Chip>
          {appointment && <Chip>{APPOINTMENT[appointment.status]}</Chip>}
        </>
      }
    >
      <Panel title="Recordatorio">
        <DataList
          items={[
            ["Para", due],
            [reminder.status === "DISMISSED" ? "Descartado" : "Completado", dateTime(reminder.completedAt) ?? formatDate(reminder.completedOn)],
            ...(appointment
              ? ([
                  ["Especialidad", <CatalogValue kind="medical_specialty" code={appointment.specialty} />],
                  ["Hospital", appointment.healthCenterName],
                  ["Cita", [formatDate(appointment.appointmentDate), appointment.appointmentTime?.slice(0, 5)].filter(Boolean).join(", ") || null],
                  ["Primera consulta", appointment.isFirstConsultation ? "Sí" : "No"],
                ] as [string, React.ReactNode][])
              : []),
          ]}
        />
      </Panel>
      <Panel title="Aviso al paciente">
        <DataList
          items={[
            ["Canal", reminderChannelLabels[reminder.channel]],
            ["Anticipación", reminder.lead ? reminderLeadLabels[reminder.lead] : null],
            [
              "Envío",
              // Cerrado sin enviar: ya no está "pendiente", simplemente no salió.
              reminder.status !== "PENDING" && reminder.deliveryStatus === "PENDING" ? (
                "No se envió"
              ) : (
                <Chip tone={DELIVERY_TONE[reminder.deliveryStatus]}>{reminderDeliveryLabels[reminder.deliveryStatus]}</Chip>
              ),
            ],
            ["Enviado", dateTime(reminder.sentAt)],
            ...(reminder.deliveryError ? ([["Error", reminder.deliveryError]] as [string, React.ReactNode][]) : []),
          ]}
        />
        <div className="mt-3">
          <p className="mb-1.5 text-[13px] text-zinc-500">Texto{message.data?.isCustom ? " (escrito por el agente)" : ""}</p>
          {message.isLoading ? (
            <p className="text-[13px] text-zinc-500">Cargando…</p>
          ) : message.data ? (
            <p className="rounded-[12px] bg-zinc-50 p-3 text-[13px] leading-relaxed whitespace-pre-line text-zinc-700 ring-1 ring-zinc-200/60">{message.data.text}</p>
          ) : (
            <p className="text-[13px] text-zinc-500">No se pudo cargar el texto.</p>
          )}
        </div>
      </Panel>
    </Modal>
  )
}
