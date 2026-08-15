import { Bell, CalendarDays, Clock3, Pencil, UserRound } from "lucide-react"
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

interface ReminderDetailDialogProps {
  reminder: Reminder | null
  patientName: string
  onClose: () => void
  onViewPatient: (reminder: Reminder) => void
  onEdit: (reminder: Reminder) => void
}

export function ReminderDetailDialog({
  reminder,
  patientName,
  onClose,
  onViewPatient,
  onEdit,
}: ReminderDetailDialogProps) {
  return (
    <Dialog
      open={Boolean(reminder)}
      onOpenChange={(open) => !open && onClose()}
    >
      {reminder && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-violet-700">
              <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100">
                <Bell className="size-4" />
              </div>
              <div>
                <DialogTitle>Detalle del recordatorio</DialogTitle>
                <DialogDescription className="mt-1">
                  Una tarea pendiente para no perder el seguimiento.
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
              </div>
              <Badge
                variant="outline"
                className="border-violet-300 bg-violet-50 text-violet-800"
              >
                Pendiente
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                icon={CalendarDays}
                label="Fecha"
                value={formatAgendaDate(reminder.dueAt)}
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
            <Button type="button" onClick={() => onEdit(reminder)}>
              <Pencil className="size-4" />
              Editar recordatorio
            </Button>
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
