import { useState } from "react"
import { CalendarPlus, Copy, Plus, Trash2 } from "lucide-react"
import { Button, IconButton } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { Field, SelectField } from "@/components/ds/form"
import { Modal } from "@/components/ds/modal"
import { QuestionForm } from "@/components/ds/question-form"
import type { Group, Values } from "@/components/ds/questions"
import { followUpPurposeLabels, followUpTypeLabels } from "@/lib/follow-up-labels"
import { getLocalDateValue, type ScheduleFollowUpFormValues } from "./schedule-follow-up-schema"

// Planificar varios seguimientos de una vez: cada uno en su bloque, con la
// opción de duplicarlo para repetir canal y motivo en otra fecha.

interface ScheduleFollowUpsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ScheduleFollowUpFormValues[]) => Promise<void>
  isPending: boolean
  agents?: Array<{ id: string; fullName: string }>
  requiresAgentSelection?: boolean
}

const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }))

const rowGroups: Group[] = [
  {
    // Sin título: el bloque ya lleva el número y la fecha.
    title: "",
    questions: [
      { id: "date", label: "Fecha", type: "date", required: true },
      { id: "time", label: "Hora", type: "time", required: true },
      { id: "type", label: "Canal", type: "choice", required: true, options: options(followUpTypeLabels), wide: true },
      { id: "purpose", label: "Motivo", type: "select", required: true, options: options(followUpPurposeLabels) },
      { id: "notes", label: "Nota", type: "textarea", placeholder: "Qué conviene revisar en este seguimiento" },
    ],
  },
]

type Row = { key: number; values: Values }

let nextKey = 0
const emptyRow = (values: Values = { type: "CALL", purpose: "FOLLOW_UP", date: getLocalDateValue() }): Row => ({ key: nextKey++, values })

function rowLabel(values: Values) {
  if (!values.date) return "Sin fecha"
  const date = new Date(`${values.date}T12:00:00`)
  if (Number.isNaN(date.valueOf())) return "Sin fecha"
  const label = date.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}${values.time ? `, ${values.time}` : ""}`
}

function rowError(values: Values) {
  if (!values.date) return "Elige la fecha"
  if (!values.time) return "Elige la hora"
  if (!values.type || !values.purpose) return "Elige el canal y el motivo"
  const at = new Date(`${values.date}T${values.time}:00`)
  if (Number.isNaN(at.valueOf()) || at <= new Date()) return "La fecha y hora deben ser futuras"
  return undefined
}

export function ScheduleFollowUpsDialog({ open, onOpenChange, onSubmit, isPending, agents = [], requiresAgentSelection = false }: ScheduleFollowUpsDialogProps) {
  if (!open) return null
  return <PlanModal onClose={() => onOpenChange(false)} onSubmit={onSubmit} isPending={isPending} agents={agents} requiresAgentSelection={requiresAgentSelection} />
}

function PlanModal({
  onClose,
  onSubmit,
  isPending,
  agents,
  requiresAgentSelection,
}: Omit<ScheduleFollowUpsDialogProps, "open" | "onOpenChange"> & { onClose: () => void; agents: Array<{ id: string; fullName: string }> }) {
  const [rows, setRows] = useState<Row[]>(() => [emptyRow()])
  const [agentId, setAgentId] = useState<string | null>(null)
  const [tried, setTried] = useState(false)

  const errors = rows.map((r) => rowError(r.values))
  const agentMissing = requiresAgentSelection && !agentId
  const invalid = errors.filter(Boolean).length + (agentMissing ? 1 : 0)

  function update(key: number, id: string, value: string | null) {
    setRows((current) => current.map((r) => (r.key === key ? { ...r, values: { ...r.values, [id]: value } } : r)))
  }

  function duplicate(index: number) {
    setRows((current) => [...current.slice(0, index + 1), emptyRow({ ...current[index].values, time: null }), ...current.slice(index + 1)])
  }

  async function submit() {
    setTried(true)
    if (invalid) return
    await onSubmit(
      rows.map(({ values: v }) => ({
        type: v.type as ScheduleFollowUpFormValues["type"],
        purpose: v.purpose as ScheduleFollowUpFormValues["purpose"],
        date: v.date!,
        time: v.time!,
        notes: v.notes ?? "",
        agentId: agentId ?? undefined,
      })),
    )
    onClose()
  }

  return (
    <Modal
      open
      onClose={() => !isPending && onClose()}
      icon={CalendarPlus}
      title="Planificar seguimientos"
      description="Los próximos contactos con este paciente"
      footer={
        <>
          {tried && invalid > 0 && <span className="mr-auto self-center text-[13px] text-red-700">{invalid === 1 ? "Falta corregir 1 dato" : `Faltan corregir ${invalid} datos`}</span>}
          <Button onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="dark" onClick={submit} disabled={isPending}>
            {isPending ? "Guardando…" : rows.length === 1 ? "Guardar seguimiento" : `Guardar ${rows.length} seguimientos`}
          </Button>
        </>
      }
    >
      {requiresAgentSelection && (
        <Panel>
          <Field label="Agente responsable *" hint={tried && agentMissing ? "Elige quién hará estos seguimientos." : undefined}>
            {(id) => <SelectField id={id} value={agentId} onChange={setAgentId} options={agents.map((a) => ({ value: a.id, label: a.fullName }))} placeholder="Seleccionar agente" />}
          </Field>
        </Panel>
      )}
      {rows.map((row, index) => (
        <Panel key={row.key}>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 tabular-nums">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">{rowLabel(row.values)}</p>
              {tried && errors[index] && <p className="text-[13px] text-red-700">{errors[index]}</p>}
            </div>
            <IconButton icon={Copy} label={`Duplicar seguimiento ${index + 1}`} onClick={() => duplicate(index)} />
            {rows.length > 1 && <IconButton icon={Trash2} label={`Quitar seguimiento ${index + 1}`} onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))} />}
          </div>
          <QuestionForm groups={rowGroups} values={row.values} onChange={(id, v) => update(row.key, id, v)} showMissing={tried} />
        </Panel>
      ))}
      <button
        type="button"
        onClick={() => setRows((current) => [...current, emptyRow()])}
        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 transition-[color,transform] hover:text-zinc-900 active:scale-[0.99]"
      >
        <Plus className="size-4" />
        Agregar otro seguimiento
      </button>
    </Modal>
  )
}
