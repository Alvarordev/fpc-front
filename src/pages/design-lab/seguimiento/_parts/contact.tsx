import { useState } from "react"
import { CalendarClock, Mail, MessageCircle, Phone, PhoneMissed, Users, Video } from "lucide-react"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Card, Item } from "@/components/ds/card"
import { ChoiceGroup, Field, TextInput } from "@/components/ds/form"
import { InlineAlert } from "@/components/ds/inline-alert"
import { channelText, type MockPatient } from "../../_data/mock-patient"
import { channelLabels, outcomeLabels, timeOf, type AttemptOutcome, type Channel } from "../_data/mock-follow-up"
import type { FollowUpDraft } from "./use-draft"

// Contacto: los intentos (canal, resultado, hora y autor) y el registro de un
// intento nuevo. Si un intento queda como Contactado, se habilita la nota.

const CHANNEL_ICONS: Record<Channel, typeof Phone> = {
  CALL: Phone,
  WHATSAPP: MessageCircle,
  VIDEO_CALL: Video,
  EMAIL: Mail,
  IN_PERSON: Users,
  FACEBOOK: MessageCircle,
}

const CHANNEL_OPTIONS = (["CALL", "WHATSAPP", "VIDEO_CALL", "IN_PERSON"] as Channel[]).map((c) => ({ value: c, label: channelLabels[c], icon: CHANNEL_ICONS[c] }))
const OUTCOME_OPTIONS = (Object.keys(outcomeLabels) as AttemptOutcome[]).map((o) => ({ value: o, label: outcomeLabels[o].label }))

export function AttemptsCard({ draft, editable }: { draft: FollowUpDraft; editable: boolean }) {
  const [channel, setChannel] = useState<Channel>(draft.attempts.at(-1)?.outcome === "NO_ANSWER" ? "WHATSAPP" : "CALL")
  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null)
  const [note, setNote] = useState("")
  const lastFailed = draft.attempts.at(-1) && draft.attempts.at(-1)!.outcome !== "CONTACTED"

  function register() {
    if (!outcome) return
    draft.addAttempt({ at: `2026-10-28T${new Date().toTimeString().slice(0, 5)}`, channel, outcome, note: note.trim() || undefined, author: "Carla Mendoza" })
    setOutcome(null)
    setNote("")
  }

  return (
    <Card
      title="Intentos de contacto"
      description={!editable ? `${draft.attempts.length} ${draft.attempts.length === 1 ? "intento registrado" : "intentos registrados"}` : draft.contacted ? "Ya hubo contacto: registra la nota y la ficha clínica" : lastFailed ? "No contestó. Prueba con otro canal, por ejemplo WhatsApp" : "Registra cada intento con su canal y resultado"}
    >
      {draft.attempts.length ? (
        <div className="space-y-2">
          {draft.attempts.map((a, i) => {
            const Icon = a.outcome === "CONTACTED" ? CHANNEL_ICONS[a.channel] : PhoneMissed
            return (
              <Item
                key={a.id}
                leading={
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-white ring-1 ring-zinc-200">
                    <Icon className="size-[18px] text-zinc-600" strokeWidth={1.75} />
                  </span>
                }
                title={`Intento ${i + 1}, ${channelText(channelLabels[a.channel])}`}
                tags={<Chip tone={outcomeLabels[a.outcome].tone}>{outcomeLabels[a.outcome].label}</Chip>}
                meta={`A las ${timeOf(a.at)}, por ${a.author}`}
                body={a.note}
              />
            )
          })}
        </div>
      ) : (
        <p className="rounded-[14px] bg-zinc-50 px-4 py-3 text-[13px] text-zinc-500">Todavía no hay intentos. Registra el primero al contactar al paciente.</p>
      )}

      {editable && !draft.contacted && (
        <div className="mt-4 space-y-4 rounded-[14px] p-4 ring-1 ring-zinc-200">
          <p className="text-sm font-semibold">Nuevo intento</p>
          <Field label="Canal">{() => <ChoiceGroup label="Canal" value={channel} options={CHANNEL_OPTIONS} onChange={setChannel} />}</Field>
          <Field label="Resultado">{() => <ChoiceGroup label="Resultado" value={outcome} options={OUTCOME_OPTIONS} onChange={setOutcome} />}</Field>
          <Field label="Nota del intento" hint="Opcional. Por ejemplo, a qué hora pidió que lo llamen.">
            {(id) => <TextInput id={id} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Qué pasó en este intento" />}
          </Field>
          <div className="flex justify-end">
            <Button variant="dark" disabled={!outcome} onClick={register}>
              Registrar intento
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export function OverdueNotice() {
  const [date, setDate] = useState("2026-10-29T10:00")
  return (
    <div className="space-y-3 rounded-[20px] border border-red-200 bg-white p-4">
      <InlineAlert aside="Venció hace 3 días">Este seguimiento está vencido. Reprográmalo o regístralo ahora.</InlineAlert>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Nueva fecha y hora" className="w-64">
          {(id) => <TextInput id={id} type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />}
        </Field>
        <Button icon={CalendarClock}>Reprogramar</Button>
        <span className="pb-2 text-[13px] text-zinc-500">O registra un intento abajo si ya estás en contacto.</span>
      </div>
    </div>
  )
}

/** Nota de un seguimiento ya cerrado. La nota en curso se escribe en el panel fijo. */
export function NotesCard({ draft, patient }: { draft: FollowUpDraft; patient: MockPatient }) {
  const who = draft.interlocutor === "patient" ? `${patient.fullName}, paciente` : patient.companions.find((c) => c.id === draft.interlocutor)?.name
  return (
    <Card title="Lo que conversaron" description={`Con ${who ?? "el paciente"}`}>
      {draft.notes ? <p className="text-sm leading-relaxed text-zinc-700">{draft.notes}</p> : <p className="text-[13px] text-zinc-500">No se registró nota.</p>}
    </Card>
  )
}
