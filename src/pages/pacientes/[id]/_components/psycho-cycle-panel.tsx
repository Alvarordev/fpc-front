import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  psychooncologyCyclesApi,
  type PsychooncologyCycle,
} from "@/api/psychooncology-cycles"
import { Button } from "@/components/ds/button"
import { Card, GroupLabel } from "@/components/ds/card"
import { ChoiceGroup, Field, TextArea } from "@/components/ds/form"
import { SegmentedProgress } from "@/components/ds/progress"

const CLOSE_REASONS = [
  { value: "COMPLETED", label: "Completó" },
  { value: "ABANDONED", label: "Abandonó" },
  { value: "NOT_NEEDED", label: "No lo necesita" },
] as const

const closeReasonLabels: Record<NonNullable<PsychooncologyCycle["closeReason"]>, string> = {
  COMPLETED: "Completó",
  ABANDONED: "Abandonó",
  NOT_NEEDED: "No lo necesita",
}

export function PsychoCyclePanel({
  patientId,
  canManage,
  onScheduleAdditional,
}: {
  patientId: string
  canManage: boolean
  onScheduleAdditional: () => void
}) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState<(typeof CLOSE_REASONS)[number]["value"]>("COMPLETED")
  const [notes, setNotes] = useState("")
  const [closingId, setClosingId] = useState<string | null>(null)
  const cyclesQuery = useQuery({
    queryKey: ["psychooncology-cycles", patientId],
    queryFn: () => psychooncologyCyclesApi.list(patientId),
  })
  const closeCycle = useMutation({
    mutationFn: (id: string) =>
      psychooncologyCyclesApi.close(id, {
        reason,
        notes: notes.trim() || undefined,
      }),
    onSuccess: async () => {
      setClosingId(null)
      setNotes("")
      await queryClient.invalidateQueries({ queryKey: ["psychooncology-cycles", patientId] })
      toast.success("Ciclo cerrado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo cerrar el ciclo", { description: error.message }),
  })

  const cycles = cyclesQuery.data ?? []
  const openCycle = cycles.find((cycle) => !cycle.closedAt)

  const latest = openCycle ?? cycles[0]
  return (
    <Card title="Ciclo de psicooncología" description={`Cada ciclo tiene ${openCycle?.baseSessions ?? 4} sesiones base; las siguientes van como adicionales.`}>
      {cyclesQuery.isLoading ? (
        <p className="text-[13px] text-zinc-500">Cargando ciclos...</p>
      ) : cyclesQuery.isError ? (
        <p className="text-[13px] text-red-700">No se pudieron cargar los ciclos.</p>
      ) : !latest ? (
        <p className="text-[13px] text-zinc-500">Todavía no hay un ciclo. Se abre al agendar la primera sesión.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="flex items-baseline gap-2">
              <span className="text-[28px] leading-none font-semibold tabular-nums">{latest.completedSessionCount}</span>
              <span className="text-[13px] text-zinc-500">de {latest.baseSessions} sesiones base realizadas</span>
            </p>
            <div className="mt-3">
              <SegmentedProgress done={Math.min(latest.completedSessionCount, latest.baseSessions)} total={latest.baseSessions} />
            </div>
            <p className="mt-2 text-[13px] text-zinc-500">
              {latest.sessionCount} agendadas
              {latest.additionalSessionCount > 0 ? `, ${latest.additionalSessionCount} ${latest.additionalSessionCount === 1 ? "adicional" : "adicionales"}` : ""}
              {latest.closedAt ? `. Cerrado: ${latest.closeReason ? closeReasonLabels[latest.closeReason].toLowerCase() : "sin motivo"}` : ". Abierto"}
            </p>
          </div>
          {canManage && openCycle && openCycle.sessionCount >= openCycle.baseSessions && <Button onClick={onScheduleAdditional}>Agendar sesión adicional</Button>}
          {canManage && openCycle && closingId === openCycle.id && (
            <div className="space-y-3 rounded-[14px] bg-zinc-50 p-3 ring-1 ring-zinc-200/60">
              <Field label="Motivo del cierre">{() => <ChoiceGroup label="Motivo del cierre" value={reason} onChange={setReason} options={[...CLOSE_REASONS]} />}</Field>
              <Field label="Nota">{(id) => <TextArea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="min-h-16" />}</Field>
              <div className="flex gap-2">
                <Button variant="dark" disabled={closeCycle.isPending} onClick={() => closeCycle.mutate(openCycle.id)}>
                  Confirmar cierre
                </Button>
                <Button onClick={() => setClosingId(null)}>Volver</Button>
              </div>
            </div>
          )}
          {canManage && openCycle && closingId !== openCycle.id && <Button onClick={() => setClosingId(openCycle.id)}>Cerrar ciclo</Button>}
          {cycles.length > 1 && (
            <div className="border-t border-zinc-100 pt-3">
              <GroupLabel>Ciclos anteriores</GroupLabel>
              <ul className="mt-1 space-y-1.5 px-1 text-[13px] text-zinc-600">
                {cycles
                  .filter((c) => c.id !== latest.id)
                  .map((c) => (
                    <li key={c.id}>
                      {c.completedSessionCount} de {c.baseSessions} realizadas, {c.closeReason ? closeReasonLabels[c.closeReason].toLowerCase() : "abierto"}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
