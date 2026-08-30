import { useEffect } from "react"
import { useForm } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MedicalAppointmentFields,
  resolveSpecialty,
  type MedicalAppointmentFieldsValue,
} from "@/components/medical-appointment-fields"
import type { Agent } from "@/api/agents"
import type { Reminder, ReminderKind } from "@/api/reminders"
import { cn } from "@/lib/utils"

function toLocalDateTime(date: string) {
  const value = new Date(date)
  const timezoneOffset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

export interface ReminderFormValues {
  kind: ReminderKind
  description: string
  dueAt: string
  assignedAgentId?: string
  medicalAppointment: MedicalAppointmentFieldsValue
}

interface ReminderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reminder?: Reminder | null
  agents?: Agent[]
  requiresAgentSelection?: boolean
  hideAgentSelection?: boolean
  isPending: boolean
  draftMode?: boolean
  onSave: (values: ReminderFormValues) => void
}

const EMPTY_APPOINTMENT: MedicalAppointmentFieldsValue = {
  specialty: "",
  customSpecialty: "",
  healthCenterId: "",
  isFirstConsultation: false,
}

export function ReminderFormDialog({
  open,
  onOpenChange,
  reminder,
  agents = [],
  requiresAgentSelection = false,
  hideAgentSelection = false,
  isPending,
  draftMode = false,
  onSave,
}: ReminderFormDialogProps) {
  const isEditing = Boolean(reminder)
  const { register, handleSubmit, watch, setValue, reset } =
    useForm<ReminderFormValues>({
      defaultValues: {
        kind: "GENERIC",
        description: "",
        dueAt: "",
        assignedAgentId: undefined,
        medicalAppointment: EMPTY_APPOINTMENT,
      },
    })

  useEffect(() => {
    if (!open) return
    if (reminder) {
      const appointment = reminder.medicalAppointment
      reset({
        kind: reminder.kind ?? "GENERIC",
        description: reminder.description,
        dueAt: toLocalDateTime(reminder.dueAt),
        assignedAgentId: reminder.assignedAgentId,
        medicalAppointment: appointment
          ? {
              specialty: appointment.specialty,
              customSpecialty: "",
              healthCenterId: appointment.healthCenterId ?? "",
              isFirstConsultation: appointment.isFirstConsultation,
            }
          : EMPTY_APPOINTMENT,
      })
      return
    }
    reset({
      kind: "GENERIC",
      description: "",
      dueAt: "",
      assignedAgentId: undefined,
      medicalAppointment: EMPTY_APPOINTMENT,
    })
  }, [open, reminder, reset])

  const kind = watch("kind")
  const description = watch("description")
  const dueAt = watch("dueAt")
  const assignedAgentId = watch("assignedAgentId")
  const medicalAppointment = watch("medicalAppointment")
  const specialty = resolveSpecialty(medicalAppointment)
  const isMedical = kind === "MEDICAL_APPOINTMENT"

  const agentItems = agents.map((agent) => ({
    value: agent.id,
    label: agent.fullName,
  }))

  const canSubmit = Boolean(
    dueAt &&
      (isMedical
        ? specialty
        : description.trim()) &&
      (!requiresAgentSelection || hideAgentSelection || assignedAgentId),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editar recordatorio"
              : draftMode
                ? "Agregar recordatorio"
                : "Nuevo recordatorio"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los campos del recordatorio."
              : draftMode
                ? "Se guardará al completar el seguimiento."
                : "Registrá un recordatorio genérico o una cita médica."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSave)}
          className="flex flex-col gap-4"
        >
          {!isEditing && (
            <div className="flex gap-2">
              {(
                [
                  ["GENERIC", "Genérico"],
                  ["MEDICAL_APPOINTMENT", "Cita médica"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue("kind", value)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                    kind === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {isMedical ? (
            <MedicalAppointmentFields
              value={medicalAppointment}
              specialtyReadOnly={isEditing}
              onChange={(value) => setValue("medicalAppointment", value)}
            />
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-description">
              Descripción{" "}
              {!isMedical && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="reminder-description"
              placeholder={
                isMedical
                  ? "Opcional — se genera desde la especialidad"
                  : "Ej: Hemograma completo, Tomografía de tórax..."
              }
              {...register("description", { required: !isMedical })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-due-at">
              {isMedical ? "Fecha y hora de la cita" : "Fecha y hora"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reminder-due-at"
              type="datetime-local"
              {...register("dueAt", { required: true })}
            />
          </div>

          {requiresAgentSelection && !hideAgentSelection && (
            <div className="flex flex-col gap-2">
              <Label>Agente responsable</Label>
              <Select
                items={agentItems}
                value={assignedAgentId}
                onValueChange={(value) =>
                  setValue("assignedAgentId", value ?? undefined)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar agente" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : draftMode
                    ? "Agregar a la lista"
                    : "Crear recordatorio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
