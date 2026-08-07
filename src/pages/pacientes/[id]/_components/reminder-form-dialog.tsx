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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Agent } from "@/api/agents"
import type { Reminder } from "@/api/reminders"

function toLocalDateTime(date: string) {
  const value = new Date(date)
  const timezoneOffset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

export interface ReminderFormValues {
  description: string
  dueAt: string
  assignedAgentId?: string
}

interface ReminderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reminder?: Reminder | null
  agents: Agent[]
  requiresAgentSelection: boolean
  isPending: boolean
  onSave: (values: ReminderFormValues) => void
}

export function ReminderFormDialog({
  open,
  onOpenChange,
  reminder,
  agents,
  requiresAgentSelection,
  isPending,
  onSave,
}: ReminderFormDialogProps) {
  const isEditing = Boolean(reminder)
  const { register, handleSubmit, watch, setValue, reset } = useForm<ReminderFormValues>({
    defaultValues: { description: "", dueAt: "", assignedAgentId: undefined },
  })

  useEffect(() => {
    if (!open) return
    reset(
      reminder
        ? {
            description: reminder.description,
            dueAt: toLocalDateTime(reminder.dueAt),
            assignedAgentId: reminder.assignedAgentId,
          }
        : { description: "", dueAt: "", assignedAgentId: undefined },
    )
  }, [open, reminder, reset])

  const description = watch("description")
  const dueAt = watch("dueAt")
  const assignedAgentId = watch("assignedAgentId")

  // Pass `items` so the trigger can resolve the agent's name from
  // `assignedAgentId` even before the popup has ever been opened —
  // Select.Value otherwise falls back to rendering the raw id.
  // See AGENTS.md "Selects" rule.
  const agentItems = agents.map((agent) => ({ value: agent.id, label: agent.fullName }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar recordatorio" : "Nuevo recordatorio"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los campos del recordatorio."
              : "Registrá un recordatorio de cita, procedimiento o medicación para el paciente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-description">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reminder-description"
              placeholder="Ej: Hemograma completo, Tomografía de tórax..."
              {...register("description", { required: true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-due-at">
              Fecha y hora <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reminder-due-at"
              type="datetime-local"
              {...register("dueAt", { required: true })}
            />
          </div>
          {requiresAgentSelection && (
            <div className="flex flex-col gap-2">
              <Label>Agente responsable</Label>
              <Select
                items={agentItems}
                value={assignedAgentId}
                onValueChange={(value) => setValue("assignedAgentId", value ?? undefined)}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !description.trim() || !dueAt}>
              {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear recordatorio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
