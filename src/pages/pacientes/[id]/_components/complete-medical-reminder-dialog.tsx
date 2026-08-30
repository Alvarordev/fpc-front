import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type {
  CompleteReminderInput,
  Reminder,
} from "@/api/reminders"
import { cn } from "@/lib/utils"

type AppointmentOutcomeStatus = "COMPLETED" | "NO_ANSWER" | "CANCELLED"

interface CompleteMedicalReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reminder: Reminder | null
  isPending: boolean
  onConfirm: (input: CompleteReminderInput) => void
}

const STATUS_OPTIONS: {
  value: AppointmentOutcomeStatus
  label: string
  description: string
}[] = [
  {
    value: "COMPLETED",
    label: "Asistió",
    description: "El paciente asistió a la cita",
  },
  {
    value: "NO_ANSWER",
    label: "No asistió",
    description: "El paciente no se presentó",
  },
  {
    value: "CANCELLED",
    label: "Se canceló",
    description: "La cita se canceló antes de ocurrir",
  },
]

export function CompleteMedicalReminderDialog({
  open,
  onOpenChange,
  reminder,
  isPending,
  onConfirm,
}: CompleteMedicalReminderDialogProps) {
  const [status, setStatus] = useState<AppointmentOutcomeStatus | "">("")
  const [hasReferralSheet, setHasReferralSheet] = useState(false)
  const [referredTo, setReferredTo] = useState("")
  const [referralNotProvidedReason, setReferralNotProvidedReason] = useState("")
  const [difficulties, setDifficulties] = useState("")
  const [nextAppointmentDate, setNextAppointmentDate] = useState("")
  const [nextAppointmentSpecialty, setNextAppointmentSpecialty] = useState("")
  const [changeReason, setChangeReason] = useState("")

  useEffect(() => {
    if (!open) return
    setStatus("")
    setHasReferralSheet(false)
    setReferredTo("")
    setReferralNotProvidedReason("")
    setDifficulties("")
    setNextAppointmentDate("")
    setNextAppointmentSpecialty("")
    setChangeReason("")
  }, [open, reminder?.id])

  if (!reminder) return null

  const specialty = reminder.medicalAppointment?.specialty
  const referralValid =
    status !== "COMPLETED" ||
    (hasReferralSheet ? referredTo.trim().length > 0 : true)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!status || !changeReason.trim() || !referralValid) return

    onConfirm({
      medicalAppointment: {
        status,
        changeReason: changeReason.trim(),
        difficulties: difficulties.trim() || undefined,
        ...(status === "COMPLETED"
          ? {
              hasReferralSheet,
              referredTo: hasReferralSheet
                ? referredTo.trim() || undefined
                : undefined,
              referralNotProvidedReason: !hasReferralSheet
                ? referralNotProvidedReason.trim() || undefined
                : undefined,
              nextAppointmentDate: nextAppointmentDate || undefined,
              nextAppointmentSpecialty:
                nextAppointmentSpecialty.trim() || undefined,
            }
          : {}),
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Completar cita médica</DialogTitle>
          <DialogDescription>
            {specialty
              ? `Registrá el resultado de la cita de ${specialty}.`
              : "Registrá el resultado de la cita médica."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>¿Qué pasó con la cita?</Label>
            <div className="grid gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left transition-colors",
                    status === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {status === "COMPLETED" && (
            <div className="space-y-3 rounded-lg border p-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasReferralSheet}
                  onChange={(event) =>
                    setHasReferralSheet(event.target.checked)
                  }
                  className="size-4 rounded"
                />
                <span className="text-sm">Recibió hoja de referencia</span>
              </label>
              {hasReferralSheet ? (
                <div className="space-y-1.5">
                  <Label htmlFor="referred-to">Referido a</Label>
                  <Input
                    id="referred-to"
                    value={referredTo}
                    onChange={(event) => setReferredTo(event.target.value)}
                    placeholder="Hospital / especialidad"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="referral-reason">
                    Motivo sin hoja de referencia
                  </Label>
                  <Input
                    id="referral-reason"
                    value={referralNotProvidedReason}
                    onChange={(event) =>
                      setReferralNotProvidedReason(event.target.value)
                    }
                  />
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="next-date">Próxima cita</Label>
                  <Input
                    id="next-date"
                    type="date"
                    value={nextAppointmentDate}
                    onChange={(event) =>
                      setNextAppointmentDate(event.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="next-specialty">Especialidad próxima</Label>
                  <Input
                    id="next-specialty"
                    value={nextAppointmentSpecialty}
                    onChange={(event) =>
                      setNextAppointmentSpecialty(event.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="difficulties">Dificultades (opcional)</Label>
            <Input
              id="difficulties"
              value={difficulties}
              onChange={(event) => setDifficulties(event.target.value)}
              placeholder="Barreras para asistir o comentarios"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="change-reason">
              Motivo del registro <span className="text-destructive">*</span>
            </Label>
            <Input
              id="change-reason"
              value={changeReason}
              onChange={(event) => setChangeReason(event.target.value)}
              placeholder="Ej: Confirmado con el paciente"
              required
            />
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
            <Button
              type="submit"
              disabled={
                isPending || !status || !changeReason.trim() || !referralValid
              }
            >
              {isPending ? "Guardando..." : "Completar recordatorio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
