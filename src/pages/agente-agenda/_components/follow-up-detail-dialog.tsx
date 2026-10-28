import { useState } from "react"
import { Link } from "react-router-dom"
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
  followUpStatusLabels,
  followUpTypeLabels,
  formatAgendaDate,
  formatAgendaTime,
} from "../_lib/agenda"

interface FollowUpDetailDialogProps {
  followUp: FollowUp | null
  onClose: () => void
  onGoToFollowUp: (followUp: FollowUp) => void
  onEdit: (followUp: FollowUp) => void
  onCancel: (followUp: FollowUp) => void
  isCancelling?: boolean
}

export function FollowUpDetailDialog({
  followUp,
  onClose,
  onGoToFollowUp,
  onEdit,
  onCancel,
  isCancelling = false,
}: FollowUpDetailDialogProps) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const canCancel =
    followUp?.status === "SCHEDULED" || followUp?.status === "OVERDUE"
  const canReschedule =
    (followUp?.status === "OVERDUE" || followUp?.status === "CANCELLED") &&
    !followUp.nextFollowUpId
  const canEditDate = followUp?.status === "SCHEDULED" && !followUp.nextFollowUpId

  return (
    <Dialog
      open={Boolean(followUp)}
      onOpenChange={(open) => {
        if (!open) {
          setConfirmCancel(false)
          onClose()
        }
      }}
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
                {followUpStatusLabels[followUp.status]}
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

            {followUp.nextFollowUpId && (
              <p className="text-sm">
                Ya fue reagendado.{" "}
                <Link
                  className="font-medium underline"
                  to={`/pacientes/${followUp.subjectPatientId}/seguimientos/${followUp.nextFollowUpId}`}
                  onClick={onClose}
                >
                  Ver el seguimiento nuevo
                </Link>
              </p>
            )}

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
            <div className="flex flex-wrap gap-2">
              {canCancel &&
                (confirmCancel ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isCancelling}
                    onClick={() => onCancel(followUp)}
                  >
                    {isCancelling ? "Cancelando..." : "Confirmar cancelación"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancelar
                  </Button>
                ))}
              {(canEditDate || canReschedule) && (
                <Button type="button" onClick={() => onEdit(followUp)}>
                  <Pencil className="size-4" />
                  {canReschedule ? "Reagendar" : "Editar seguimiento"}
                </Button>
              )}
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
