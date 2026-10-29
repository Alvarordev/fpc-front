import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Mail, MessageCircle, Phone, PhoneMissed, Users, Video, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { followUpsApi, type CreateFollowUpAttemptInput, type FollowUp } from "@/api/follow-ups"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Card, Item } from "@/components/ds/card"
import { RemoveButton } from "@/components/ds/record-section"
import { ChoiceGroup, Field, TextInput } from "@/components/ds/form"
import type { Tone } from "@/components/ds/tone"
import { followUpTypeLabels } from "@/lib/follow-up-labels"
import { formatTime } from "../../_lib/ficha-format"
import { useFollowUpDraftStore } from "../_store/follow-up-draft-store"

// Intentos de contacto: canal, resultado, hora y autor. Los fallidos se guardan
// al momento. En el backend un intento Contactado completa el seguimiento, así
// que mientras se registra queda en borrador: habilita Completar, que lo guarda
// junto con la nota, la ficha y las acciones.

type Channel = CreateFollowUpAttemptInput["channel"]
type Outcome = CreateFollowUpAttemptInput["outcome"]

const CHANNEL_ICONS: Partial<Record<Channel, LucideIcon>> = {
  CALL: Phone,
  WHATSAPP: MessageCircle,
  VIDEO_CALL: Video,
  EMAIL: Mail,
  IN_PERSON: Users,
  FACEBOOK: MessageCircle,
}

const OUTCOMES: Record<Outcome, { label: string; tone: Tone }> = {
  CONTACTED: { label: "Contactado", tone: "green" },
  NO_ANSWER: { label: "No contestó", tone: "amber" },
  WRONG_NUMBER: { label: "Número equivocado", tone: "red" },
  REJECTED: { label: "Rechazó la llamada", tone: "red" },
}

const CHANNEL_OPTIONS = (Object.keys(followUpTypeLabels) as Channel[]).map((c) => ({ value: c, label: followUpTypeLabels[c], icon: CHANNEL_ICONS[c] }))
const OUTCOME_OPTIONS = (Object.keys(OUTCOMES) as Outcome[]).map((o) => ({ value: o, label: OUTCOMES[o].label }))

export function FollowUpAttemptsPanel({ followUp, canRegister, registering }: { followUp: FollowUp; canRegister: boolean; registering: boolean }) {
  const queryClient = useQueryClient()
  const attempts = followUp.attempts ?? []
  const last = attempts.at(-1)
  const contactDraft = useFollowUpDraftStore((s) => (registering ? s.contact : null))
  const setContact = useFollowUpDraftStore((s) => s.setContact)
  const contacted = Boolean(contactDraft) || attempts.some((a) => a.outcome === "CONTACTED")
  const lastFailed = Boolean(last && last.outcome !== "CONTACTED")
  const [channel, setChannel] = useState<Channel>(lastFailed && last?.channel === "CALL" ? "WHATSAPP" : "CALL")
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [notes, setNotes] = useState("")
  const editable = canRegister && followUp.status !== "CANCELLED" && followUp.status !== "COMPLETED"

  const mutation = useMutation({
    mutationFn: (input: CreateFollowUpAttemptInput) => followUpsApi.recordAttempt(followUp.id, input),
    onSuccess: async (_, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["follow-up", followUp.id] }),
        queryClient.invalidateQueries({ queryKey: ["patient-follow-ups"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-timeline"] }),
        queryClient.invalidateQueries({ queryKey: ["agent-follow-ups"] }),
      ])
      setOutcome(null)
      setNotes("")
      toast.success(input.outcome === "CONTACTED" ? "Contacto registrado" : "Intento registrado")
    },
    onError: (error: Error) => toast.error("No se pudo registrar el intento", { description: error.message }),
  })

  const description = !editable
    ? `${attempts.length} ${attempts.length === 1 ? "intento registrado" : "intentos registrados"}`
    : contacted
      ? "Ya hubo contacto: escribe la nota y actualiza la ficha clínica"
      : lastFailed
        ? "No contestó. Prueba con otro canal, por ejemplo WhatsApp"
        : "Registra cada intento con su canal y resultado"

  return (
    <Card title="Intentos de contacto" description={description}>
      {attempts.length || contactDraft ? (
        <div className="space-y-2">
          {attempts.map((a, i) => {
            const Icon = a.outcome === "CONTACTED" ? (CHANNEL_ICONS[a.channel] ?? Phone) : PhoneMissed
            const result = OUTCOMES[a.outcome as Outcome]
            return (
              <Item
                key={a.id}
                leading={
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-white ring-1 ring-zinc-200">
                    <Icon className="size-[18px] text-zinc-600" strokeWidth={1.75} />
                  </span>
                }
                title={`Intento ${i + 1}, ${followUpTypeLabels[a.channel]?.toLowerCase() ?? a.channel}`}
                tags={result ? <Chip tone={result.tone}>{result.label}</Chip> : null}
                meta={`A las ${formatTime(a.occurredAt)}`}
                body={a.notes}
              />
            )
          })}
          {contactDraft && (
            <Item
              leading={
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-white ring-1 ring-zinc-200">
                  {(() => {
                    const Icon = CHANNEL_ICONS[contactDraft.channel] ?? Phone
                    return <Icon className="size-[18px] text-zinc-600" strokeWidth={1.75} />
                  })()}
                </span>
              }
              title={`Intento ${attempts.length + 1}, ${followUpTypeLabels[contactDraft.channel]?.toLowerCase() ?? contactDraft.channel}`}
              tags={<Chip tone="green">Contactado</Chip>}
              meta="Se guarda al completar el seguimiento"
              body={contactDraft.notes}
              actions={<RemoveButton label="Quitar el contacto" onClick={() => setContact(null)} />}
            />
          )}
        </div>
      ) : (
        <p className="rounded-[14px] bg-zinc-50 px-4 py-3 text-[13px] text-zinc-500">Todavía no hay intentos. Registra el primero al contactar al paciente.</p>
      )}

      {editable && !contacted && (
        <form
          className="mt-4 space-y-4 rounded-[14px] p-4 ring-1 ring-zinc-200"
          onSubmit={(e) => {
            e.preventDefault()
            if (!outcome) return
            if (registering && outcome === "CONTACTED") {
              setContact({ channel, notes: notes.trim() || undefined })
              setOutcome(null)
              setNotes("")
              return
            }
            mutation.mutate({ channel, outcome, notes: notes.trim() || undefined })
          }}
        >
          <p className="text-sm font-semibold">Nuevo intento</p>
          <Field label="Canal">{() => <ChoiceGroup label="Canal" value={channel} options={CHANNEL_OPTIONS} onChange={setChannel} />}</Field>
          <Field label="Resultado">{() => <ChoiceGroup label="Resultado" value={outcome} options={OUTCOME_OPTIONS} onChange={setOutcome} />}</Field>
          <Field label="Nota del intento" hint="Opcional. Por ejemplo, a qué hora pidió que lo llamen.">
            {(id) => <TextInput id={id} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Qué pasó en este intento" />}
          </Field>
          {outcome === "CONTACTED" && (
            <p className="text-[13px] text-zinc-500">
              {registering ? "El contacto se guarda al completar, junto con la nota y la ficha." : "Al registrar el contacto, el seguimiento queda completado."}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" variant="dark" disabled={!outcome || mutation.isPending}>
              {mutation.isPending ? "Registrando…" : "Registrar intento"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}
