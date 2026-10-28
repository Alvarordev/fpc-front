import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  psychooncologyCyclesApi,
  type PsychooncologyCycle,
} from "@/api/psychooncology-cycles"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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

  return (
    <section className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Ciclo de psicooncología</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Cada ciclo tiene {openCycle?.baseSessions ?? 4} sesiones base. Las siguientes se agendan como adicionales.
          </p>
        </div>
        {canManage && openCycle && openCycle.sessionCount >= openCycle.baseSessions && (
          <Button type="button" size="sm" variant="outline" onClick={onScheduleAdditional}>
            Agendar sesión adicional
          </Button>
        )}
      </div>

      {cyclesQuery.isLoading ? (
        <p className="text-muted-foreground mt-3 text-sm">Cargando ciclos...</p>
      ) : cyclesQuery.isError ? (
        <p className="text-destructive mt-3 text-sm">No se pudieron cargar los ciclos.</p>
      ) : cycles.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">
          Todavía no hay un ciclo. Se abre al agendar la primera sesión.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {cycles.map((cycle) => (
            <li key={cycle.id} className="rounded-lg border px-3 py-2 text-sm">
              <p className="font-medium">
                {cycle.sessionCount} de {cycle.baseSessions} sesiones base
                {cycle.additionalSessionCount > 0
                  ? ` · ${cycle.additionalSessionCount} adicional${cycle.additionalSessionCount === 1 ? "" : "es"}`
                  : ""}
                {" · "}
                {cycle.completedSessionCount} realizada{cycle.completedSessionCount === 1 ? "" : "s"}
              </p>
              <p className="text-muted-foreground text-xs">
                {cycle.closedAt
                  ? `Cerrado: ${cycle.closeReason ? closeReasonLabels[cycle.closeReason] : "cerrado"}`
                  : "Abierto"}
              </p>
              {canManage && !cycle.closedAt && closingId === cycle.id && (
                <div className="mt-2 space-y-2">
                  <Select
                    items={[...CLOSE_REASONS]}
                    value={reason}
                    onValueChange={(value) =>
                      setReason((value as typeof reason | null) ?? "COMPLETED")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLOSE_REASONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Nota opcional"
                    className="min-h-16 text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={closeCycle.isPending}
                      onClick={() => closeCycle.mutate(cycle.id)}
                    >
                      Confirmar cierre
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setClosingId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
              {canManage && !cycle.closedAt && closingId !== cycle.id && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => setClosingId(cycle.id)}
                >
                  Cerrar ciclo
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
