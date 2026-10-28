import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { followUpsApi, type FollowUp } from "@/api/follow-ups"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function FollowUpReschedulePanel({
  followUp,
  patientId,
  canReschedule,
}: {
  followUp: FollowUp
  patientId: string
  canReschedule: boolean
}) {
  const queryClient = useQueryClient()
  const [scheduledAt, setScheduledAt] = useState("")
  const canChangeDate =
    followUp.status === "OVERDUE" || followUp.status === "CANCELLED"
  const showForm = canReschedule && canChangeDate && !followUp.nextFollowUpId

  const mutation = useMutation({
    mutationFn: () =>
      followUpsApi.reschedule(followUp.id, {
        scheduledAt: new Date(scheduledAt).toISOString(),
      }),
    onSuccess: async (created) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["follow-up", followUp.id] }),
        queryClient.invalidateQueries({ queryKey: ["follow-up", created.id] }),
        queryClient.invalidateQueries({ queryKey: ["patient-follow-ups", patientId] }),
        queryClient.invalidateQueries({ queryKey: ["agent-follow-ups"] }),
      ])
      toast.success("Seguimiento reagendado")
      setScheduledAt("")
    },
    onError: (error: Error) =>
      toast.error("No se pudo reagendar", { description: error.message }),
  })

  if (!canChangeDate && !followUp.nextFollowUpId) return null

  return (
    <section className="space-y-3 rounded-xl border border-red-200 bg-red-50/40 p-4">
      {followUp.status === "OVERDUE" && (
        <p className="text-sm font-medium text-red-800">Este seguimiento está vencido.</p>
      )}
      {followUp.nextFollowUpId && (
        <p className="text-sm">
          Ya fue reagendado.{" "}
          <Link
            className="font-medium underline"
            to={`/pacientes/${patientId}/seguimientos/${followUp.nextFollowUpId}`}
          >
            Ver el seguimiento nuevo
          </Link>
        </p>
      )}
      {showForm && !followUp.nextFollowUpId && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (!scheduledAt) return
            if (new Date(scheduledAt).getTime() <= Date.now()) {
              toast.error("La nueva fecha debe ser futura")
              return
            }
            mutation.mutate()
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="reschedule-at">Nueva fecha</Label>
            <Input
              id="reschedule-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? "Reagendando..." : "Reagendar"}
          </Button>
        </form>
      )}
    </section>
  )
}
