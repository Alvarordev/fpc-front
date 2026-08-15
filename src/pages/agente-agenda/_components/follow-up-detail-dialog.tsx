import {
  ArrowRight,
  CalendarDays,
  Clock3,
  FileText,
  Pencil,
  Phone,
  UserRound,
} from "lucide-react"
import type { FollowUp } from "@/api/follow-ups"
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
import {
  followUpPurposeLabels,
  followUpTypeLabels,
  formatAgendaDate,
  formatAgendaTime,
} from "../_lib/agenda"

interface FollowUpDetailDialogProps {
  followUp: FollowUp | null
  onClose: () => void
  onGoToFollowUp: (followUp: FollowUp) => void
  onEdit: (followUp: FollowUp) => void
}

const statusLabels: Record<FollowUp["status"], string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_ANSWER: "No contestó",
}

export function FollowUpDetailDialog({
  followUp,
  onClose,
  onGoToFollowUp,
  onEdit,
}: FollowUpDetailDialogProps) {
  return (
    <Dialog
      open={Boolean(followUp)}
      onOpenChange={(open) => !open && onClose()}
    >
      {followUp && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-700">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100">
                <Phone className="size-4" />
              </div>
              <div>
                <DialogTitle>Detalle del seguimiento</DialogTitle>
                <DialogDescription className="mt-1">
                  Revisa la tarea antes de contactar al paciente.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            <div className="bg-muted/30 flex items-start justify-between gap-3 rounded-xl border p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  <UserRound className="text-muted-foreground size-4 shrink-0" />
                  {followUp.subjectPatientName ?? "Paciente desconocido"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {followUpTypeLabels[followUp.type]}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-800"
              >
                {statusLabels[followUp.status]}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                icon={CalendarDays}
                label="Fecha"
                value={formatAgendaDate(followUp.scheduledAt)}
              />
              <DetailItem
                icon={Clock3}
                label="Hora"
                value={formatAgendaTime(followUp.scheduledAt)}
              />
              <DetailItem
                icon={Phone}
                label="Canal"
                value={followUpTypeLabels[followUp.type]}
              />
              <DetailItem
                icon={FileText}
                label="Propósito"
                value={followUpPurposeLabels[followUp.purpose]}
              />
            </div>

            {followUp.notes && (
              <div className="bg-background rounded-xl border p-3">
                <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wide uppercase">
                  Notas
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {followUp.notes}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onGoToFollowUp(followUp)}
            >
              Ir al seguimiento
              <ArrowRight className="size-4" />
            </Button>
            <Button type="button" onClick={() => onEdit(followUp)}>
              <Pencil className="size-4" />
              Editar seguimiento
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
