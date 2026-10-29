import { useState } from "react"
import { Bell, Brain, CalendarPlus, CheckCircle2, PhoneOff, TriangleAlert, XCircle, type LucideIcon } from "lucide-react"
import { ActionTile } from "@/components/ds/action-tile"
import { Button } from "@/components/ds/button"
import { Card, GroupLabel, Item, Panel } from "@/components/ds/card"
import { CheckList } from "@/components/ds/check-list"
import { ComposerDock } from "@/components/ds/composer-dock"
import { SelectField } from "@/components/ds/form"
import { FormModal } from "@/components/ds/form-modal"
import { Modal } from "@/components/ds/modal"
import type { Group, Values } from "@/components/ds/questions"
import { RemoveButton } from "@/components/ds/record-section"
import type { Tone } from "@/components/ds/tone"
import { longDate, type MockPatient } from "../../_data/mock-patient"
import { alertGroups, followUpGroups, psychoGroups, reminderGroups, slotsFor } from "./sheet/config/acciones"
import { pendingSummary, type DerivedKind, type FollowUpDraft } from "./use-draft"

// Acciones que nacen del seguimiento (derivar, reportar, agendar, recordar) y
// el cierre. Todo queda en borrador y se guarda al completar.

const DERIVED: { kind: DerivedKind; label: string; hint: string; icon: LucideIcon; tone: Tone }[] = [
  { kind: "psico", label: "Derivar a psicooncología", hint: "Agenda una sesión con un voluntario", icon: Brain, tone: "violet" },
  { kind: "alerta", label: "Reportar incidencia hospitalaria", hint: "Medicinas, citas, trato o trámites", icon: TriangleAlert, tone: "red" },
  { kind: "siguiente", label: "Agendar siguiente seguimiento", hint: "Fecha, canal y agente", icon: CalendarPlus, tone: "blue" },
  { kind: "recordatorio", label: "Agregar recordatorio", hint: "Cita médica o tratamiento", icon: Bell, tone: "amber" },
]

type ModalConfig = { groups: Group[]; initial: Values; submit: string; summarize: (v: Values) => { title: string; detail: string } }

function derivedModal(kind: DerivedKind, patient: MockPatient): ModalConfig {
  switch (kind) {
    case "psico":
      return {
        groups: psychoGroups(patient.companions.map((c) => ({ value: c.id, label: `${c.name}, ${c.relationship.toLowerCase()}` }))),
        initial: { psFor: "patient", psVolunteer: "mq", psModality: "VIDEO_CALL" },
        submit: "Agendar sesión",
        summarize: (v) => {
          const slot = slotsFor(v.psVolunteer).find((x) => x.value === v.psSlot)?.label ?? ""
          const who = v.psFor === "patient" ? patient.firstName : v.psFor === "companion" ? patient.companions.find((c) => c.id === v.psCompanion)?.name.split(" ")[0] : v.psName
          return { title: "Sesión de psicooncología", detail: [`Para ${who}`, slot, v.psModality === "VIDEO_CALL" ? "videollamada" : "llamada"].filter(Boolean).join(", ") }
        },
      }
    case "alerta":
      return {
        groups: alertGroups,
        initial: { alCenter: patient.health.center, alSeverity: "MEDIUM" },
        submit: "Reportar incidencia",
        summarize: (v) => ({ title: `Incidencia: ${v.alTitle}`, detail: [v.alCategory, v.alCenter, v.alSeverity === "HIGH" ? "prioridad alta" : v.alSeverity === "LOW" ? "prioridad baja" : "prioridad media"].filter(Boolean).join(", ") }),
      }
    case "siguiente":
      return {
        groups: followUpGroups,
        initial: { fuDate: "2026-11-27", fuTime: "10:00", fuType: "CALL", fuPurpose: "FOLLOW_UP", fuAgent: "Carla Mendoza" },
        submit: "Agendar seguimiento",
        summarize: (v) => ({ title: "Siguiente seguimiento", detail: [v.fuDate && longDate(v.fuDate), v.fuTime, CHANNEL_NAMES[v.fuType ?? ""], v.fuAgent].filter(Boolean).join(", ") }),
      }
    case "recordatorio":
      return {
        groups: reminderGroups,
        initial: { rmKind: "MEDICAL_APPOINTMENT", rmLead: "1D", rmChannel: "WHATSAPP" },
        submit: "Agregar recordatorio",
        summarize: (v) => ({
          title: v.rmKind === "MEDICAL_APPOINTMENT" ? `Recordatorio: cita de ${v.rmSpecialty?.toLowerCase()}` : `Recordatorio: ${v.rmDescription}`,
          detail: [v.rmAt && `${longDate(v.rmAt.slice(0, 10))} a las ${v.rmAt.slice(11, 16)}`, v.rmCenter, `por ${CHANNEL_NAMES[v.rmChannel ?? ""]?.toLowerCase()}`].filter(Boolean).join(", "),
        }),
      }
  }
}

const CHANNEL_NAMES: Record<string, string> = { CALL: "Llamada", WHATSAPP: "WhatsApp", VIDEO_CALL: "Videollamada", EMAIL: "Correo", IN_PERSON: "Presencial", FACEBOOK: "Facebook" }

export function DerivedActionsCard({ draft, patient }: { draft: FollowUpDraft; patient: MockPatient }) {
  const [editing, setEditing] = useState<{ kind: DerivedKind; id?: string; values?: Values } | null>(null)
  const config = editing ? derivedModal(editing.kind, patient) : null
  const meta = editing ? DERIVED.find((d) => d.kind === editing.kind)! : null
  return (
    <Card title="Acciones de este seguimiento" description="Se crean al completar el seguimiento">
      <div className="grid gap-2 sm:grid-cols-2">
        {DERIVED.map((d) => {
          const existing = d.kind !== "recordatorio" ? draft.derived.find((x) => x.kind === d.kind) : undefined
          return (
            <ActionTile
              key={d.kind}
              icon={d.icon}
              tone={d.tone}
              label={d.label}
              hint={d.hint}
              done={Boolean(existing)}
              onClick={() => setEditing(existing ? { kind: d.kind, id: existing.id, values: existing.values } : { kind: d.kind })}
            />
          )
        })}
      </div>
      {draft.derived.length > 0 && (
        <div className="mt-4 space-y-2">
          <GroupLabel>Por crear</GroupLabel>
          {draft.derived.map((d) => (
            <Item
              key={d.id}
              title={d.title}
              meta={d.detail}
              onOpen={() => setEditing({ kind: d.kind, id: d.id, values: d.values })}
              openLabel={`Editar ${d.title.toLowerCase()}`}
              actions={<RemoveButton label={`Quitar ${d.title.toLowerCase()}`} onClick={() => draft.removeDerived(d.id)} />}
            />
          ))}
        </div>
      )}
      {editing && config && meta && (
        <FormModal
          icon={meta.icon}
          footnote="Se creará al completar el seguimiento"
          title={editing.id ? `Editar: ${meta.label.toLowerCase()}` : meta.label}
          description={meta.hint}
          groups={config.groups}
          initial={editing.values ?? config.initial}
          submitLabel={editing.id ? "Guardar cambios" : config.submit}
          onClose={() => setEditing(null)}
          onSubmit={(v) => {
            draft.saveDerived({ kind: editing.kind, values: v, ...config.summarize(v) }, editing.id)
            setEditing(null)
          }}
        />
      )}
    </Card>
  )
}

type Closing = "COMPLETED" | "NO_ANSWER" | "CANCELLED"

const CLOSING: Record<Closing, { title: string; body: string; confirm: string; icon: LucideIcon }> = {
  COMPLETED: { title: "Completar seguimiento", body: "Se guardará todo lo registrado en este contacto:", confirm: "Completar", icon: CheckCircle2 },
  NO_ANSWER: { title: "Marcar como no contestó", body: "Se guardan los intentos. La nota, la ficha y las acciones en borrador se descartan.", confirm: "Marcar no contestó", icon: PhoneOff },
  CANCELLED: { title: "Cancelar seguimiento", body: "El seguimiento queda cancelado y se descartan los borradores.", confirm: "Cancelar seguimiento", icon: XCircle },
}

/** La nota del seguimiento siempre a mano (Alt + N), con quién se habló y el cierre. */
export function NotesDock({ draft, patient }: { draft: FollowUpDraft; patient: MockPatient }) {
  const [confirm, setConfirm] = useState<Closing | null>(null)
  const summary = pendingSummary(draft)
  const canComplete = draft.contacted
  const people = [{ value: "patient", label: `${patient.firstName}, paciente` }, ...patient.companions.map((c) => ({ value: c.id, label: `${c.name.split(" ")[0]}, ${c.relationship.toLowerCase()}` }))]
  return (
    <>
      <ComposerDock
        label="Nota del seguimiento"
        value={draft.notes}
        onChange={draft.setNotes}
        placeholder="Escribe mientras conversan: cómo se siente, qué necesita, qué acordaron"
        asideTop={
          <div className="flex items-center gap-2 text-[13px] text-zinc-500">
            <span className="shrink-0">Habló con</span>
            <div className="min-w-0 flex-1">
              <SelectField value={draft.interlocutor} onChange={draft.setInterlocutor} options={people} />
            </div>
          </div>
        }
        asideBottom={
          <div className="space-y-2">
            <p className="text-right text-xs text-zinc-500">
              {!canComplete
                ? "Para completar, registra un intento como Contactado"
                : summary.length
                  ? `Al completar se guardará: ${summary.length} ${summary.length === 1 ? "elemento" : "elementos"}`
                  : "Escribe la nota antes de completar"}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button onClick={() => setConfirm("CANCELLED")}>Cancelar seguimiento</Button>
              <Button onClick={() => setConfirm("NO_ANSWER")}>No contestó</Button>
              <Button variant="brand" icon={CheckCircle2} disabled={!canComplete} onClick={() => setConfirm("COMPLETED")}>
                Completar
              </Button>
            </div>
          </div>
        }
      />
      {confirm && (
        <Modal
          open
          onClose={() => setConfirm(null)}
          icon={CLOSING[confirm].icon}
          title={CLOSING[confirm].title}
          description={CLOSING[confirm].body}
          footer={
            <>
              <Button onClick={() => setConfirm(null)}>Volver</Button>
              <Button variant={confirm === "COMPLETED" ? "brand" : "dark"} onClick={() => setConfirm(null)}>
                {CLOSING[confirm].confirm}
              </Button>
            </>
          }
        >
          {confirm === "COMPLETED" ? (
            <Panel>
              <CheckList items={summary} empty="Solo se guardarán los intentos. No agregaste nota ni cambios." />
            </Panel>
          ) : (
            <Panel>
              <p className="text-sm text-zinc-600">
                {summary.length ? `Se descartarán ${summary.length} ${summary.length === 1 ? "elemento" : "elementos"} en borrador.` : "No hay borradores que descartar."}
              </p>
            </Panel>
          )}
        </Modal>
      )}
    </>
  )
}
