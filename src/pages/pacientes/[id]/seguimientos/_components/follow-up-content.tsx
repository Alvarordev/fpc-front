import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { alertsApi } from "@/api/alerts"
import { followUpsApi } from "@/api/follow-ups"
import { patientsApi, type PatientDetailsInput } from "@/api/patients"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/auth-store"
import { ScheduleFollowUpDialog, type ScheduleFollowUpFormValues } from "../../_components/schedule-follow-up-dialog"
import { SchedulePsychooncologyDialog } from "../../_components/schedule-psychooncology-dialog"
import { ClinicalDataTabs } from "./clinical-data-tabs"
import { DRAFT_DIAGNOSIS_ID, hasAnyClinicalDraft } from "./clinical-drafts"
import { CreateAlertDialog } from "./create-alert-dialog"
import { FollowUpAside } from "./follow-up-aside"
import { useFollowUpDraftStore } from "../_store/follow-up-draft-store"

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
  const [alertOpen, setAlertOpen] = useState(false)
  const [reminderDescription, setReminderDescription] = useState("")
  const [reminderAt, setReminderAt] = useState("")
  const [isCompleting, setIsCompleting] = useState(false)

  const draftStore = useFollowUpDraftStore()
  const {
    clinical: clinicalDrafts,
    psico: psicoDraft,
    alert: alertDraft,
    nextFollowUp: nextFollowUpDraft,
    reminders: reminderDrafts,
  } = draftStore

  useEffect(() => {
    if (followUpId) useFollowUpDraftStore.getState().ensureFollowUp(followUpId)
  }, [followUpId])

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
  })

  async function refreshAfterCompletion() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["follow-up", followUpId] }),
      queryClient.invalidateQueries({ queryKey: ["patient-timeline", patientId] }),
      queryClient.invalidateQueries({ queryKey: ["patient-profile", patientId] }),
      queryClient.invalidateQueries({ queryKey: ["psychooncology-appointments"] }),
    ])
  }

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

  function resolveNextFollowUpAgentId(values: ScheduleFollowUpFormValues) {
    const ownAgent = agentsQuery.data?.find((agent) => agent.userId === user?.id)
    return requiresAgentSelection ? values.agentId : ownAgent?.id
  }

  /** Persist every drafted change, in order, when the follow-up is completed. */
  async function commitDrafts() {
    const details: PatientDetailsInput = { ...clinicalDrafts.details, ...clinicalDrafts.social }
    if (Object.keys(details).length > 0) {
      await patientsApi.updateDetails(patientId!, details)
    }

    let newDiagnosisId: string | undefined
    if (clinicalDrafts.diagnosis) {
      const created = await patientsApi.createDiagnosis(patientId!, { ...clinicalDrafts.diagnosis, followUpId: followUpId! })
      newDiagnosisId = created.id
    }

    if (clinicalDrafts.treatment) {
      const diagnosisId =
        clinicalDrafts.treatment.diagnosisId === DRAFT_DIAGNOSIS_ID ? newDiagnosisId : clinicalDrafts.treatment.diagnosisId

      if (diagnosisId) {
        await patientsApi.createTreatment(patientId!, { ...clinicalDrafts.treatment, diagnosisId, followUpId: followUpId! })
      }
    }

    if (clinicalDrafts.insurance) {
      await patientsApi.createInsurance(patientId!, { ...clinicalDrafts.insurance, followUpId: followUpId! })
    }
    if (clinicalDrafts.sisAffiliation) {
      await patientsApi.createSisAffiliation(patientId!, { ...clinicalDrafts.sisAffiliation, followUpId: followUpId! })
    }

    if (alertDraft) {
      await alertsApi.create({
        healthCenterId: alertDraft.healthCenterId,
        followUpId: followUpId!,
        subjectPatientId: followUp.subjectPatientId,
        interlocutorId: followUp.interlocutorId,
        title: alertDraft.title,
        description: alertDraft.description,
      })
    }

    if (psicoDraft) {
      try {
        await psychooncologyAppointmentsApi.create(psicoDraft)
      } catch (error) {
        toast.error("No se pudo agendar la cita de psicooncología", { description: (error as Error).message })
      }
    }

    if (nextFollowUpDraft) {
      const agentId = resolveNextFollowUpAgentId(nextFollowUpDraft)
      if (agentId) {
        await followUpsApi.scheduleNext(followUpId!, {
          subjectPatientId: followUp.subjectPatientId,
          interlocutorId: followUp.interlocutorId,
          agentId,
          type: nextFollowUpDraft.type,
          purpose: nextFollowUpDraft.purpose,
          scheduledAt: `${nextFollowUpDraft.date}T${nextFollowUpDraft.time}:00`,
          notes: nextFollowUpDraft.notes || undefined,
        })
      }
    }

    for (const reminder of reminderDrafts) {
      try {
        await followUpsApi.createReminder(followUpId!, {
          subjectPatientId: followUp.subjectPatientId,
          dueAt: new Date(reminder.dueAt).toISOString(),
          description: reminder.description,
          assignedAgentId: followUp.agentId,
          createdFromFollowUpId: followUpId,
        })
      } catch (error) {
        toast.error("No se pudo crear un recordatorio", { description: (error as Error).message })
      }
    }
  }

  async function handleComplete() {
    setIsCompleting(true)
    try {
      await updateMutation.mutateAsync({ status: "COMPLETED", completedAt: new Date().toISOString() })
      await commitDrafts()
      draftStore.reset()
      await refreshAfterCompletion()
      toast.success("Seguimiento completado")
    } catch (error) {
      toast.error("No se pudo completar el seguimiento", { description: (error as Error).message })
    } finally {
      setIsCompleting(false)
    }
  }

  async function handleDiscardStatus(status: "CANCELLED" | "NO_ANSWER") {
    try {
      await updateMutation.mutateAsync({ status })
      draftStore.reset()
      await refreshAfterCompletion()
      toast.success("Seguimiento actualizado")
    } catch (error) {
      toast.error("No se pudo actualizar el seguimiento", { description: (error as Error).message })
    }
  }

  function addReminderDraft() {
    draftStore.addReminder({ description: reminderDescription, dueAt: reminderAt })
    setReminderDescription("")
    setReminderAt("")
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(`/pacientes/${patientId}`)}>
        <ArrowLeft className="size-3.5" />Volver al paciente
      </Button>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
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
                  <Button onClick={handleComplete} disabled={isCompleting}>
                    {isCompleting ? "Guardando..." : "Completar"}
                  </Button>
                  <Button variant="outline" onClick={() => handleDiscardStatus("NO_ANSWER")} disabled={isCompleting}>No contestó</Button>
                  <Button variant="outline" onClick={() => handleDiscardStatus("CANCELLED")} disabled={isCompleting}>Cancelar</Button>
                </div>
              )}
              {hasAnyClinicalDraft(clinicalDrafts) && isOpen && (
                <p className="text-muted-foreground text-xs">
                  Los cambios de la ficha clínica y las acciones posteriores se guardan localmente y recién se registran al presionar «Completar». Si cancelás o marcás «No contestó», se descartan.
                </p>
              )}
            </CardContent>
          </Card>

          {canManage && isOpen && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ficha clínica</CardTitle>
              </CardHeader>
              <CardContent>
                <ClinicalDataTabs
                  patientId={patientId!}
                  drafts={clinicalDrafts}
                  onDraftsChange={(updater) => draftStore.updateClinical(updater)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {canManage && isOpen && (
          <FollowUpAside
            onPsicoOpen={() => setPsychooncologyOpen(true)}
            hasPsicoDraft={Boolean(psicoDraft)}
            onClearPsico={() => draftStore.clearPsico()}
            onAlertOpen={() => setAlertOpen(true)}
            hasAlertDraft={Boolean(alertDraft)}
            onClearAlert={() => draftStore.clearAlert()}
            onNextContactOpen={() => setNextOpen(true)}
            hasNextContactDraft={Boolean(nextFollowUpDraft)}
            onClearNextContact={() => draftStore.clearNextFollowUp()}
            reminderDescription={reminderDescription}
            onReminderDescriptionChange={setReminderDescription}
            reminderAt={reminderAt}
            onReminderAtChange={setReminderAt}
            onAddReminder={addReminderDraft}
            reminderDrafts={reminderDrafts}
            onRemoveReminder={(index) => draftStore.removeReminder(index)}
          />
        )}
      </div>

      <ScheduleFollowUpDialog
        open={nextOpen}
        onOpenChange={setNextOpen}
        onSubmit={async (values) => draftStore.setNextFollowUp(values)}
        isPending={false}
        agents={agentsQuery.data}
        requiresAgentSelection={requiresAgentSelection}
      />
      <SchedulePsychooncologyDialog
        open={psychooncologyOpen}
        onOpenChange={setPsychooncologyOpen}
        patientId={followUp.subjectPatientId}
        followUpId={followUp.id}
        isPending={false}
        onSubmit={async (input) => draftStore.setPsico(input)}
      />
      <CreateAlertDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        isPending={false}
        onSubmit={async (values) => draftStore.setAlert(values)}
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
