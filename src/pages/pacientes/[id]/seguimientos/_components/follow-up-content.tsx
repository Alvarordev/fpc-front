import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CalendarPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { followUpsApi } from "@/api/follow-ups"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/auth-store"
import { ScheduleFollowUpDialog, type ScheduleFollowUpFormValues } from "../../_components/schedule-follow-up-dialog"
import { SchedulePsychooncologyDialog } from "../../_components/schedule-psychooncology-dialog"

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_ANSWER: "No contestó",
}

export function FollowUpContent() {
  const { id: patientId, followUpId } = useParams<{ id: string; followUpId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [notes, setNotes] = useState("")
  const [nextOpen, setNextOpen] = useState(false)
  const [psychooncologyOpen, setPsychooncologyOpen] = useState(false)
  const [reminderDescription, setReminderDescription] = useState("")
  const [reminderAt, setReminderAt] = useState("")
  const canManage = user?.role === "ADMIN" || user?.role === "FOUNDATION" || user?.role === "AGENT"
  const requiresAgentSelection = user?.role === "ADMIN" || user?.role === "FOUNDATION"

  const followUpQuery = useQuery({
    queryKey: ["follow-up", followUpId],
    queryFn: () => followUpsApi.getById(followUpId!),
    enabled: Boolean(followUpId),
  })
  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    enabled: canManage,
    staleTime: 60_000,
  })
  const updateMutation = useMutation({
    mutationFn: ({ status, completedAt }: { status: "COMPLETED" | "CANCELLED" | "NO_ANSWER"; completedAt?: string }) =>
      followUpsApi.update(followUpId!, { status, notes: notes || undefined, completedAt }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["follow-up", followUpId] }),
        queryClient.invalidateQueries({ queryKey: ["patient-timeline", patientId] }),
      ])
      toast.success("Seguimiento actualizado")
    },
    onError: (error: Error) => toast.error("No se pudo actualizar el seguimiento", { description: error.message }),
  })
  const nextMutation = useMutation({
    mutationFn: (input: Parameters<typeof followUpsApi.scheduleNext>[1]) => followUpsApi.scheduleNext(followUpId!, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patient-timeline", patientId] })
      toast.success("Siguiente seguimiento agendado")
    },
    onError: (error: Error) => toast.error("No se pudo agendar el siguiente seguimiento", { description: error.message }),
  })
  const reminderMutation = useMutation({
    mutationFn: () => followUpsApi.createReminder(followUpId!, {
      subjectPatientId: followUpQuery.data!.subjectPatientId,
      dueAt: new Date(reminderAt).toISOString(),
      description: reminderDescription,
      assignedAgentId: followUpQuery.data!.agentId,
      createdFromFollowUpId: followUpId!,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patient-timeline", patientId] })
      setReminderDescription("")
      setReminderAt("")
      toast.success("Recordatorio creado")
    },
    onError: (error: Error) => toast.error("No se pudo crear el recordatorio", { description: error.message }),
  })
  const psychooncologyMutation = useMutation({
    mutationFn: psychooncologyAppointmentsApi.create,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["psychooncology-appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-timeline", patientId] }),
      ])
      toast.success("Cita de psicooncología agendada")
    },
    onError: (error: Error) => toast.error("No se pudo agendar la cita", { description: error.message }),
  })

  if (!followUpId) {
    return <MissingFollowUp onBack={() => navigate(`/pacientes/${patientId}`)} />
  }

  if (followUpQuery.isLoading) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" />Cargando seguimiento...</div>
  }

  if (followUpQuery.isError || !followUpQuery.data) {
    return <MissingFollowUp onBack={() => navigate(`/pacientes/${patientId}`)} />
  }

  const followUp = followUpQuery.data
  if (followUp.subjectPatientId !== patientId) return <MissingFollowUp onBack={() => navigate(`/pacientes/${patientId}`)} />
  const isOpen = followUp.status === "SCHEDULED"

  async function scheduleNext(values: ScheduleFollowUpFormValues) {
    const ownAgent = agentsQuery.data?.find((agent) => agent.userId === user?.id)
    const agentId = requiresAgentSelection ? values.agentId : ownAgent?.id

    if (!agentId) {
      throw new Error("No se encontró un agente asociado a tu cuenta")
    }

    await nextMutation.mutateAsync({
      subjectPatientId: followUp.subjectPatientId,
      interlocutorId: followUp.interlocutorId,
      agentId,
      type: values.type,
      purpose: values.purpose,
      scheduledAt: `${values.date}T${values.time}:00`,
      notes: values.notes || undefined,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(`/pacientes/${patientId}`)}>
        <ArrowLeft className="size-3.5" />Volver al paciente
      </Button>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            Registrar seguimiento
            <span className="text-xs font-normal text-muted-foreground">{statusLabels[followUp.status]}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <span>Canal: {followUp.type.replaceAll("_", " ")}</span>
            <span>Propósito: {followUp.purpose.replaceAll("_", " ")}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="follow-up-notes">Notas</Label>
            <Textarea id="follow-up-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={followUp.notes ?? "Registrá el resultado del seguimiento..."} disabled={!canManage || !isOpen} />
          </div>
          {canManage && isOpen && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => updateMutation.mutate({ status: "COMPLETED", completedAt: new Date().toISOString() })} disabled={updateMutation.isPending}>Completar</Button>
              <Button variant="outline" onClick={() => updateMutation.mutate({ status: "NO_ANSWER" })} disabled={updateMutation.isPending}>No contestó</Button>
              <Button variant="outline" onClick={() => updateMutation.mutate({ status: "CANCELLED" })} disabled={updateMutation.isPending}>Cancelar</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {canManage && !isOpen && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Acciones posteriores</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <Button variant="outline" className="gap-1.5" onClick={() => setNextOpen(true)}>
              <CalendarPlus className="size-4" />Agendar siguiente seguimiento
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={() => setPsychooncologyOpen(true)}>
              <CalendarPlus className="size-4" />Derivar a psicooncología
            </Button>
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Crear recordatorio</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input value={reminderDescription} onChange={(event) => setReminderDescription(event.target.value)} placeholder="Descripción" />
                <Input type="datetime-local" value={reminderAt} onChange={(event) => setReminderAt(event.target.value)} />
              </div>
              <Button size="sm" variant="secondary" disabled={!reminderDescription || !reminderAt || reminderMutation.isPending} onClick={() => reminderMutation.mutate()}>
                Crear recordatorio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ScheduleFollowUpDialog open={nextOpen} onOpenChange={setNextOpen} onSubmit={scheduleNext} isPending={nextMutation.isPending} agents={agentsQuery.data} requiresAgentSelection={requiresAgentSelection} />
      <SchedulePsychooncologyDialog
        open={psychooncologyOpen}
        onOpenChange={setPsychooncologyOpen}
        patientId={followUp.subjectPatientId}
        followUpId={followUp.id}
        isPending={psychooncologyMutation.isPending}
        onSubmit={async (input) => {
          await psychooncologyMutation.mutateAsync(input)
        }}
      />
    </div>
  )
}

function MissingFollowUp({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onBack}><ArrowLeft className="size-3.5" />Volver al paciente</Button>
      <p className="text-sm text-muted-foreground">No se encontró el seguimiento solicitado.</p>
    </div>
  )
}
