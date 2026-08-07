import { Calendar, CheckCircle2, Pencil, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Reminder } from "@/api/reminders"

const STATUS_CONFIG: Record<Reminder["status"], { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  DONE: { label: "Completado", className: "bg-green-100 text-green-800 border-green-300" },
  DISMISSED: { label: "Descartado", className: "bg-red-100 text-red-800 border-red-300" },
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

interface ReminderCardProps {
  reminder: Reminder
  canManage: boolean
  onEdit: (reminder: Reminder) => void
  onComplete: (reminder: Reminder) => void
  onDismiss: (reminder: Reminder) => void
}

export function ReminderCard({ reminder, canManage, onEdit, onComplete, onDismiss }: ReminderCardProps) {
  const statusCfg = STATUS_CONFIG[reminder.status]
  const isPending = reminder.status === "PENDING"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 bg-card",
        reminder.status === "DONE" && "opacity-70",
        reminder.status === "DISMISSED" && "opacity-50",
      )}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-purple-500" />

      <div className="py-3.5 pl-5 pr-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{reminder.description}</p>
            <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
              <Calendar className="size-3" />
              {formatDate(reminder.dueAt)}
            </span>
          </div>
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase", statusCfg.className)}>
            {statusCfg.label}
          </span>
        </div>

        {canManage && isPending && (
          <div className="mt-3 flex items-center gap-1.5 border-t border-border/40 pt-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(reminder)}
            >
              <Pencil className="size-3" />Editar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => onComplete(reminder)}
            >
              <CheckCircle2 className="size-3" />Completar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDismiss(reminder)}
            >
              <XCircle className="size-3" />Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
