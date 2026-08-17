import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CreateFollowUpInput } from "@/api/follow-ups"
import {
  followUpPurposeLabels,
  followUpTypeLabels,
} from "@/lib/follow-up-labels"
import {
  scheduleFollowUpSchema,
  getLocalDateValue,
  type ScheduleFollowUpFormValues,
} from "./schedule-follow-up-schema"

interface ScheduleFollowUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ScheduleFollowUpFormValues) => Promise<void>
  isPending: boolean
  agents?: Array<{ id: string; fullName: string }>
  requiresAgentSelection?: boolean
}

export function ScheduleFollowUpDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  agents = [],
  requiresAgentSelection = false,
}: ScheduleFollowUpDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors },
  } = useForm<ScheduleFollowUpFormValues>({
    resolver: zodResolver(scheduleFollowUpSchema),
    defaultValues: {
      type: "CALL",
      purpose: "FOLLOW_UP",
      date: getLocalDateValue(),
      time: "",
      notes: "",
    },
  })

  const selectedType = watch("type")
  const selectedPurpose = watch("purpose")
  const selectedAgentId = watch("agentId")

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  async function submit(values: ScheduleFollowUpFormValues) {
    if (requiresAgentSelection && !values.agentId) {
      setError("agentId", { message: "Seleccioná un agente" })
      return
    }

    await onSubmit(values)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar seguimiento</DialogTitle>
          <DialogDescription>
            Programá un nuevo seguimiento para este paciente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                items={Object.entries(followUpTypeLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
                value={selectedType}
                onValueChange={(v) =>
                  setValue("type", v as CreateFollowUpInput["type"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(followUpTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Propósito</Label>
              <Select
                items={Object.entries(followUpPurposeLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
                value={selectedPurpose}
                onValueChange={(v) =>
                  setValue("purpose", v as CreateFollowUpInput["purpose"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar propósito" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(followUpPurposeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {requiresAgentSelection && (
            <div className="space-y-2">
              <Label>Agente responsable</Label>
              <Select
                items={agents.map((agent) => ({
                  value: agent.id,
                  label: agent.fullName,
                }))}
                value={selectedAgentId}
                onValueChange={(value) =>
                  setValue("agentId", value ?? undefined, {
                    shouldValidate: true,
                  })
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
              {errors.agentId && (
                <p className="text-destructive text-xs">
                  {errors.agentId.message ?? "Seleccioná un agente"}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" {...register("date")} />
              {errors.date && (
                <p className="text-destructive text-xs">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" {...register("time")} />
              {errors.time && (
                <p className="text-destructive text-xs">
                  {errors.time.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              {...register("notes")}
              className="min-h-20 resize-none"
              placeholder="Observaciones sobre el agendamiento..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Agendando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
