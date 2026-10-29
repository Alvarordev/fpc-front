import { Bell, Brain, CalendarPlus, CheckCircle2, PhoneOff, RotateCcw, TriangleAlert, XCircle } from "lucide-react"
import { ActionTile } from "@/components/ds/action-tile"
import { Button } from "@/components/ds/button"
import { Card, GroupLabel, Item } from "@/components/ds/card"
import { ComposerDock } from "@/components/ds/composer-dock"
import { SelectField } from "@/components/ds/form"
import { RemoveButton } from "@/components/ds/record-section"
import { followUpTypeLabels } from "@/lib/follow-up-labels"
import { formatDate } from "../../_lib/ficha-format"
import { useFollowUpDraftStore } from "../_store/follow-up-draft-store"

// Acciones que nacen del seguimiento (derivar, reportar, agendar, recordar).
// Quedan en borrador y se crean al completarlo; los diálogos los abre la página.

export type DerivedAction = "psico" | "alerta" | "siguiente" | "recordatorio"

function dueText(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return value
  return date.toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function DerivedActionsCard({ onOpen }: { onOpen: (action: DerivedAction) => void }) {
  const { psico, psicoSummary, alert, nextFollowUp, reminders, clearPsico, clearAlert, clearNextFollowUp, removeReminder } = useFollowUpDraftStore()
  const pending = [
    psico && { id: "psico", title: "Sesión de psicooncología", meta: psicoSummary ?? (psico.modality === "VIDEO_CALL" ? "Videollamada" : "Llamada"), open: "psico" as const, remove: clearPsico },
    alert && { id: "alerta", title: `Incidencia: ${alert.title}`, meta: alert.description, open: "alerta" as const, remove: clearAlert },
    nextFollowUp && {
      id: "siguiente",
      title: "Siguiente seguimiento",
      meta: [formatDate(nextFollowUp.date), nextFollowUp.time, followUpTypeLabels[nextFollowUp.type]].filter(Boolean).join(", "),
      open: "siguiente" as const,
      remove: clearNextFollowUp,
    },
    ...reminders.map((r, i) => ({ id: `recordatorio-${i}`, title: `Recordatorio: ${r.description}`, meta: dueText(r.dueAt), open: null, remove: () => removeReminder(i) })),
  ].filter((x): x is NonNullable<typeof x> => Boolean(x))

  return (
    <Card title="Acciones de este seguimiento" description="Se crean al completar el seguimiento">
      <div className="grid gap-2 sm:grid-cols-2">
        <ActionTile icon={Brain} tone="violet" label="Derivar a psicooncología" hint="Agenda una sesión con un voluntario" done={Boolean(psico)} onClick={() => onOpen("psico")} />
        <ActionTile icon={TriangleAlert} tone="red" label="Reportar incidencia hospitalaria" hint="Medicinas, citas, trato o trámites" done={Boolean(alert)} onClick={() => onOpen("alerta")} />
        <ActionTile icon={CalendarPlus} tone="blue" label="Agendar siguiente seguimiento" hint="Fecha, canal y agente" done={Boolean(nextFollowUp)} onClick={() => onOpen("siguiente")} />
        <ActionTile icon={Bell} tone="amber" label="Agregar recordatorio" hint="Cita médica o tratamiento" onClick={() => onOpen("recordatorio")} />
      </div>
      {pending.length > 0 && (
        <div className="mt-4 space-y-2">
          <GroupLabel>Por crear</GroupLabel>
          {pending.map((p) => (
            <Item
              key={p.id}
              title={p.title}
              meta={p.meta}
              onOpen={p.open ? () => onOpen(p.open!) : undefined}
              openLabel={`Editar ${p.title.toLowerCase()}`}
              actions={<RemoveButton label={`Quitar ${p.title.toLowerCase()}`} onClick={p.remove} />}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

/** La nota del seguimiento siempre a mano (Alt + N) y los botones de cierre. */
export function NotesDock({
  notes,
  onNotesChange,
  onResetNotes,
  pendingCount,
  disabled,
  canComplete,
  interlocutor,
  onClose,
}: {
  notes: string
  onNotesChange: (value: string) => void
  onResetNotes?: () => void
  pendingCount: number
  disabled: boolean
  canComplete: boolean
  interlocutor: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }
  onClose: (status: "COMPLETED" | "NO_ANSWER" | "CANCELLED") => void
}) {
  return (
    <ComposerDock
      label="Nota del seguimiento"
      value={notes}
      onChange={onNotesChange}
      placeholder="Escribe mientras conversan: cómo se siente, qué necesita, qué acordaron"
      asideTop={
        <div className="flex items-center gap-2 text-[13px] text-zinc-500">
          <span className="shrink-0">Habló con</span>
          <div className="min-w-0 flex-1">
            <SelectField value={interlocutor.value} onChange={interlocutor.onChange} options={interlocutor.options} />
          </div>
          {onResetNotes && (
            <Button icon={RotateCcw} onClick={onResetNotes} disabled={disabled}>
              Restablecer
            </Button>
          )}
        </div>
      }
      asideBottom={
        <div className="space-y-2">
          <p className="text-right text-xs text-zinc-500">
            {!canComplete
              ? "Para completar, registra un intento como Contactado"
              : pendingCount
                ? `Al completar se guardará: ${pendingCount} ${pendingCount === 1 ? "elemento" : "elementos"}`
                : "Escribe la nota antes de completar"}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button icon={XCircle} disabled={disabled} onClick={() => onClose("CANCELLED")}>
              Cancelar seguimiento
            </Button>
            <Button icon={PhoneOff} disabled={disabled} onClick={() => onClose("NO_ANSWER")}>
              No contestó
            </Button>
            <Button variant="brand" icon={CheckCircle2} disabled={disabled || !canComplete} onClick={() => onClose("COMPLETED")}>
              {disabled ? "Guardando…" : "Completar"}
            </Button>
          </div>
        </div>
      }
    />
  )
}
