import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  followUpsApi,
  type CreateFollowUpAttemptInput,
  type FollowUp,
  type FollowUpAttempt,
} from "@/api/follow-ups"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { followUpTypeLabels } from "@/lib/follow-up-labels"

const CHANNELS = (
  Object.entries(followUpTypeLabels) as [CreateFollowUpAttemptInput["channel"], string][]
).map(([value, label]) => ({ value, label }))

const OUTCOMES: { value: CreateFollowUpAttemptInput["outcome"]; label: string }[] = [
  { value: "CONTACTED", label: "Contactado" },
  { value: "NO_ANSWER", label: "No contestó" },
  { value: "WRONG_NUMBER", label: "Número equivocado" },
  { value: "REJECTED", label: "Rechazó" },
]

const outcomeLabels = Object.fromEntries(OUTCOMES.map((item) => [item.value, item.label]))

export function FollowUpAttemptsPanel({
  followUp,
  canRegister,
}: {
  followUp: FollowUp
  canRegister: boolean
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<CreateFollowUpAttemptInput["channel"]>("CALL")
  const [outcome, setOutcome] = useState<CreateFollowUpAttemptInput["outcome"]>("NO_ANSWER")
  const [notes, setNotes] = useState("")
  const attempts = followUp.attempts ?? []

  const mutation = useMutation({
    mutationFn: () =>
      followUpsApi.recordAttempt(followUp.id, {
        channel,
        outcome,
        notes: notes.trim() || undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["follow-up", followUp.id] }),
        queryClient.invalidateQueries({ queryKey: ["patient-follow-ups"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-timeline"] }),
        queryClient.invalidateQueries({ queryKey: ["agent-follow-ups"] }),
      ])
      setNotes("")
      setOpen(false)
      toast.success(
        outcome === "CONTACTED"
          ? "Contacto registrado. El seguimiento quedó completado."
          : "Intento registrado",
      )
    },
    onError: (error: Error) =>
      toast.error("No se pudo registrar el intento", { description: error.message }),
  })

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Intentos de contacto</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {followUp.status === "NO_ANSWER"
              ? "No contestó. Puedes registrar otro intento, por ejemplo por WhatsApp. Si el resultado es Contactado, el seguimiento pasa a Completado."
              : "Cada intento guarda canal, resultado, hora y autor."}
          </p>
        </div>
        {canRegister &&
          followUp.status !== "CANCELLED" &&
          followUp.status !== "COMPLETED" && (
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen((value) => !value)}>
            Registrar intento
          </Button>
        )}
      </div>

      {attempts.length === 0 ? (
        <p className="text-muted-foreground text-sm">Todavía no hay intentos.</p>
      ) : (
        <ul className="space-y-2">
          {attempts.map((attempt) => (
            <AttemptRow key={attempt.id} attempt={attempt} />
          ))}
        </ul>
      )}

      {open && (
        <form
          className="grid gap-3 border-t pt-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <div className="space-y-1.5">
            <Label>Canal</Label>
            <Select
              items={CHANNELS}
              value={channel}
              onValueChange={(value) =>
                value && setChannel(value as CreateFollowUpAttemptInput["channel"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Resultado</Label>
            <Select
              items={OUTCOMES}
              value={outcome}
              onValueChange={(value) =>
                value && setOutcome(value as CreateFollowUpAttemptInput["outcome"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nota</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar intento"}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}

function AttemptRow({ attempt }: { attempt: FollowUpAttempt }) {
  const when = new Date(attempt.occurredAt).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  return (
    <li className="rounded-lg border px-3 py-2 text-sm">
      <p className="font-medium">
        {followUpTypeLabels[attempt.channel]} · {outcomeLabels[attempt.outcome] ?? attempt.outcome}
      </p>
      <p className="text-muted-foreground text-xs">
        {when}
        {attempt.actorUserId ? " · registrado por un usuario" : ""}
      </p>
      {attempt.notes && <p className="mt-1 text-xs">{attempt.notes}</p>}
    </li>
  )
}
