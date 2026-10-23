import { useState } from "react"
import { CalendarDays, Clock3, Phone } from "lucide-react"
import type { FollowUp } from "@/api/follow-ups"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toIsoDateTime, toLocalDateTimeParts } from "../_lib/agenda"

interface FollowUpEditDialogProps {
  open: boolean
  followUp: FollowUp | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: { scheduledAt: string }) => void
}

export function FollowUpEditDialog({
  open,
  followUp,
  isPending,
  onOpenChange,
  onSave,
}: FollowUpEditDialogProps) {
  const initialParts = followUp?.scheduledAt
    ? toLocalDateTimeParts(followUp.scheduledAt)
    : { date: "", time: "" }
  const [date, setDate] = useState(initialParts.date)
  const [time, setTime] = useState(initialParts.time)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!date || !time || !followUp) return
    onSave({ scheduledAt: toIsoDateTime(date, time) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {followUp && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-700">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100">
                <Phone className="size-4" />
              </div>
              <div>
                <DialogTitle>Reagendar seguimiento</DialogTitle>
                <DialogDescription className="mt-1">
                  Actualiza cuándo debes contactar al paciente.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="bg-muted/30 rounded-xl border p-3">
              <p className="text-sm font-semibold">
                {followUp.subjectPatientName ?? "Paciente desconocido"}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                La fecha actual se reemplazará al guardar.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="follow-up-edit-date"
                  className="flex items-center gap-1.5"
                >
                  <CalendarDays className="size-3.5" /> Fecha
                </Label>
                <Input
                  id="follow-up-edit-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="follow-up-edit-time"
                  className="flex items-center gap-1.5"
                >
                  <Clock3 className="size-3.5" /> Hora
                </Label>
                <Input
                  id="follow-up-edit-time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !date || !time}>
                {isPending ? "Guardando..." : "Guardar fecha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  )
}
