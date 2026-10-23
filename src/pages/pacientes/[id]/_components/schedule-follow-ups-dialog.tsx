import { useState } from "react"
import { CalendarPlus, Copy, Plus, Trash2 } from "lucide-react"
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
import {
  followUpPurposeLabels,
  followUpTypeLabels,
} from "@/lib/follow-up-labels"
import {
  getLocalDateValue,
  scheduleFollowUpSchema,
  type ScheduleFollowUpFormValues,
} from "./schedule-follow-up-schema"

interface ScheduleFollowUpsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ScheduleFollowUpFormValues[]) => Promise<void>
  isPending: boolean
  agents?: Array<{ id: string; fullName: string }>
  requiresAgentSelection?: boolean
}

function createEmptyRow(): ScheduleFollowUpFormValues {
  return {
    type: "CALL",
    purpose: "FOLLOW_UP",
    date: getLocalDateValue(),
    time: "",
    notes: "",
  }
}

function formatRowDate(row: ScheduleFollowUpFormValues) {
  if (!row.date) return "Elegí una fecha"

  const date = new Date(`${row.date}T12:00:00`)
  if (Number.isNaN(date.valueOf())) return "Elegí una fecha"

  return date.toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function getRowError(row: ScheduleFollowUpFormValues) {
  const result = scheduleFollowUpSchema.safeParse(row)
  if (!result.success)
    return result.error.issues[0]?.message ?? "Revisá este seguimiento"

  const scheduledAt = new Date(`${row.date}T${row.time}:00`)
  if (Number.isNaN(scheduledAt.valueOf()) || scheduledAt <= new Date()) {
    return "La fecha y hora deben ser futuras"
  }

  return undefined
}

export function ScheduleFollowUpsDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  agents = [],
  requiresAgentSelection = false,
}: ScheduleFollowUpsDialogProps) {
  const [rows, setRows] = useState<ScheduleFollowUpFormValues[]>([
    createEmptyRow(),
  ])
  const [selectedAgentId, setSelectedAgentId] = useState<string>()
  const [rowErrors, setRowErrors] = useState<Array<string | undefined>>([])
  const [agentError, setAgentError] = useState<string>()

  function reset() {
    setRows([createEmptyRow()])
    setSelectedAgentId(undefined)
    setRowErrors([])
    setAgentError(undefined)
  }

  function close() {
    onOpenChange(false)
    reset()
  }

  function updateRow(
    index: number,
    updates: Partial<ScheduleFollowUpFormValues>,
  ) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...updates } : row,
      ),
    )
    setRowErrors((current) =>
      current.map((error, rowIndex) =>
        rowIndex === index ? undefined : error,
      ),
    )
  }

  function addRow() {
    setRows((current) => [...current, createEmptyRow()])
    setRowErrors((current) => [...current, undefined])
  }

  function duplicateRow(index: number) {
    setRows((current) => [
      ...current.slice(0, index + 1),
      { ...current[index], time: "" },
      ...current.slice(index + 1),
    ])
    setRowErrors((current) => [
      ...current.slice(0, index + 1),
      undefined,
      ...current.slice(index + 1),
    ])
  }

  function removeRow(index: number) {
    if (rows.length === 1) return
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))
    setRowErrors((current) =>
      current.filter((_, rowIndex) => rowIndex !== index),
    )
  }

  async function submit() {
    const errors = rows.map(getRowError)
    setRowErrors(errors)

    const nextAgentError =
      requiresAgentSelection && !selectedAgentId
        ? "Seleccioná un agente responsable"
        : undefined
    setAgentError(nextAgentError)

    if (errors.some(Boolean) || nextAgentError) return

    await onSubmit(
      rows.map((row) => ({
        ...row,
        agentId: selectedAgentId,
      })),
    )
    close()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full">
              <CalendarPlus className="size-4" />
            </span>
            Planificar seguimientos
          </DialogTitle>
          <DialogDescription>
            Organizá los próximos seguimientos de este paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {requiresAgentSelection && (
            <div className="space-y-2">
              <Label htmlFor="planned-follow-up-agent">
                Agente responsable
              </Label>
              <Select
                items={agents.map((agent) => ({
                  value: agent.id,
                  label: agent.fullName,
                }))}
                value={selectedAgentId}
                onValueChange={(value) => {
                  setSelectedAgentId(value ?? undefined)
                  setAgentError(undefined)
                }}
              >
                <SelectTrigger
                  id="planned-follow-up-agent"
                  className="w-full"
                  aria-invalid={Boolean(agentError)}
                >
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
              {agentError && (
                <p className="text-destructive text-xs">{agentError}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {rows.map((row, index) => {
              const error = rowErrors[index]

              return (
                <div
                  key={index}
                  className={`space-y-4 rounded-xl border p-4 ${
                    error
                      ? "border-destructive/50 bg-destructive/[0.03]"
                      : "border-border/70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Seguimiento {index + 1}
                      </p>
                      <p className="text-muted-foreground text-xs capitalize">
                        {formatRowDate(row)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Duplicar seguimiento ${index + 1}`}
                        onClick={() => duplicateRow(index)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      {rows.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Eliminar seguimiento ${index + 1}`}
                          onClick={() => removeRow(index)}
                        >
                          <Trash2 className="text-muted-foreground size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`planned-follow-up-date-${index}`}>
                        Fecha
                      </Label>
                      <Input
                        id={`planned-follow-up-date-${index}`}
                        type="date"
                        value={row.date}
                        onChange={(event) =>
                          updateRow(index, { date: event.target.value })
                        }
                        aria-invalid={Boolean(error)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`planned-follow-up-time-${index}`}>
                        Hora
                      </Label>
                      <Input
                        id={`planned-follow-up-time-${index}`}
                        type="time"
                        value={row.time}
                        onChange={(event) =>
                          updateRow(index, { time: event.target.value })
                        }
                        aria-invalid={Boolean(error)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Canal</Label>
                      <Select
                        items={Object.entries(followUpTypeLabels).map(
                          ([value, label]) => ({ value, label }),
                        )}
                        value={row.type}
                        onValueChange={(value) =>
                          updateRow(index, {
                            type: value as ScheduleFollowUpFormValues["type"],
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar canal" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(followUpTypeLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Propósito</Label>
                      <Select
                        items={Object.entries(followUpPurposeLabels).map(
                          ([value, label]) => ({ value, label }),
                        )}
                        value={row.purpose}
                        onValueChange={(value) =>
                          updateRow(index, {
                            purpose:
                              value as ScheduleFollowUpFormValues["purpose"],
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar propósito" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(followUpPurposeLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`planned-follow-up-notes-${index}`}>
                      Nota{" "}
                      <span className="text-muted-foreground font-normal">
                        (opcional)
                      </span>
                    </Label>
                    <Textarea
                      id={`planned-follow-up-notes-${index}`}
                      value={row.notes ?? ""}
                      onChange={(event) =>
                        updateRow(index, { notes: event.target.value })
                      }
                      className="min-h-16 resize-y"
                      placeholder="Qué conviene revisar en este seguimiento..."
                    />
                  </div>

                  {error && <p className="text-destructive text-xs">{error}</p>}
                </div>
              )
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={addRow}
          >
            <Plus className="size-4" />
            Agregar otro seguimiento
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending
              ? "Guardando..."
              : `Guardar ${rows.length} ${rows.length === 1 ? "seguimiento" : "seguimientos"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
