import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Stethoscope,
  UserRound,
} from "lucide-react"
import type { Reminder } from "@/api/reminders"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatAgendaDate, formatAgendaTime } from "../_lib/agenda"

const APPOINTMENT_STATUS_LABELS: Record<
  NonNullable<Reminder["medicalAppointment"]>["status"],
  string
> = {
  SCHEDULED: "Programada",
  COMPLETED: "Asistió",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No asistió",
}

interface ReminderDetailDialogProps {
  reminder: Reminder | null
  patientName: string
  onClose: () => void
  onViewPatient: (reminder: Reminder) => void
  onEdit: (reminder: Reminder) => void
  onComplete: (reminder: Reminder) => void
}

export function ReminderDetailDialog({
  reminder,
  patientName,
  onClose,
  onViewPatient,
  onEdit,
  onComplete,
}: ReminderDetailDialogProps) {
  const isMedical = reminder?.kind === "MEDICAL_APPOINTMENT"
  const appointment = reminder?.medicalAppointment

  return (
    <Dialog
      open={Boolean(reminder)}
      onOpenChange={(open) => !open && onClose()}
    >
      {reminder && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div
              className={
                isMedical
                  ? "flex items-center gap-2 text-red-700"
                  : "flex items-center gap-2 text-violet-700"
              }
            >
              <div
                className={
                  isMedical
                    ? "flex size-9 items-center justify-center rounded-xl bg-red-100"
                    : "flex size-9 items-center justify-center rounded-xl bg-violet-100"
                }
              >
                {isMedical ? (
                  <Stethoscope className="size-4" />
                ) : (
                  <Bell className="size-4" />
                )}
              </div>
              <div>
                <DialogTitle>
                  {isMedical
                    ? "Detalle de cita médica"
                    : "Detalle del recordatorio"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {isMedical
                    ? "Recordatorio vinculado a una consulta médica."
                    : "Una tarea pendiente para no perder el seguimiento."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            <div className="bg-muted/30 flex items-start justify-between gap-3 rounded-xl border p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  <UserRound className="text-muted-foreground size-4 shrink-0" />
                  {patientName}
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  {reminder.description}
                </p>
                {appointment && (
                  <p className="text-muted-foreground mt-2 text-xs">
                    {appointment.specialty}
                    {appointment.healthCenterName
                      ? ` · ${appointment.healthCenterName}`
                      : ""}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {isMedical && (
                  <Badge
                    variant="outline"
                    className="border-red-200 bg-red-50 text-red-800"
                  >
                    Cita médica
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={
                    isMedical
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-violet-300 bg-violet-50 text-violet-800"
                  }
                >
                  {appointment
                    ? APPOINTMENT_STATUS_LABELS[appointment.status]
                    : "Pendiente"}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                icon={CalendarDays}
                label="Fecha"
                value={formatAgendaDate(reminder.dueAt ?? reminder.dueOn)}
              />
              <DetailItem
                icon={Clock3}
                label="Hora"
                value={formatAgendaTime(reminder.dueAt)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onViewPatient(reminder)}
            >
              <UserRound className="size-4" />
              Ver paciente
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onEdit(reminder)}
              >
                <Pencil className="size-4" />
                Editar
              </Button>
              <Button type="button" onClick={() => onComplete(reminder)}>
                <CheckCircle2 className="size-4" />
                Completar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
}) {
  return (
    <div className="bg-background rounded-xl border p-3">
      <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}
