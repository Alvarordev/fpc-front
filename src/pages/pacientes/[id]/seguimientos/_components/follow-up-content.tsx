import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { alertsApi } from "@/api/alerts"
import { followUpsApi } from "@/api/follow-ups"
import {
  patientTimelineApi,
  type PatientTimelineEvent,
} from "@/api/patient-timeline"
import { patientsApi, type PatientDetailsInput } from "@/api/patients"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/auth-store"
import { ScheduleFollowUpDialog } from "../../_components/schedule-follow-up-dialog"
import type { ScheduleFollowUpFormValues } from "../../_components/schedule-follow-up-schema"
import { SchedulePsychooncologyDialog } from "../../_components/schedule-psychooncology-dialog"
import { ClinicalDataTabs } from "./clinical-data-tabs"
import { DRAFT_DIAGNOSIS_ID, hasAnyClinicalDraft } from "./clinical-drafts"
import { CreateAlertDialog } from "./create-alert-dialog"
import { FollowUpAside } from "./follow-up-aside"
import { FollowUpOutcomes } from "../../_components/follow-up-outcomes"
import { useFollowUpDraftStore } from "../_store/follow-up-draft-store"
import { toDurationInput } from "@/types/duration"
import { patientTabUrl } from "../../_lib/patient-tabs"
import {
  followUpPurposeLabels,
  followUpStatusClasses,
  followUpStatusLabels,
  followUpTypeLabels,
} from "@/lib/follow-up-labels"

export function FollowUpContent() {
  const { id: patientId, followUpId } = useParams<{
    id: string
    followUpId: string
  }>()
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

  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"
  const requiresAgentSelection =
    user?.role === "ADMIN" || user?.role === "FOUNDATION"

  const followUpQuery = useQuery({
    queryKey: ["follow-up", followUpId],
    queryFn: () => followUpsApi.getById(followUpId!),
    enabled: Boolean(followUpId),
  })
  const patientTimelineQuery = useQuery({
    queryKey: ["patient-timeline", patientId],
    queryFn: () => patientTimelineApi.list(patientId!),
    enabled: Boolean(patientId),
  })
  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    enabled: canManage,
    staleTime: 60_000,
  })
  const updateMutation = useMutation({
    mutationFn: ({
      status,
      completedAt,
    }: {
      status: "COMPLETED" | "CANCELLED" | "NO_ANSWER"
      completedAt?: string
    }) =>
      followUpsApi.update(followUpId!, {
        status,
        notes: notes || undefined,
        completedAt,
      }),
  })

  async function refreshAfterCompletion() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["follow-up", followUpId] }),
      queryClient.invalidateQueries({
        queryKey: ["patient-timeline", patientId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["patient-follow-ups", patientId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["patient-profile", patientId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["patient-addresses", patientId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["patient-social-notes", patientId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["psychooncology-appointments"],
      }),
    ])
  }

  if (!followUpId) {
    return (
      <MissingFollowUp
        onBack={() => navigate(patientTabUrl(patientId!, "seguimiento"))}
      />
    )
  }

  if (followUpQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Cargando seguimiento...
      </div>
    )
  }

  if (followUpQuery.isError || !followUpQuery.data) {
    return (
      <MissingFollowUp
        onBack={() => navigate(patientTabUrl(patientId!, "seguimiento"))}
      />
    )
  }

  const followUp = followUpQuery.data
  if (followUp.subjectPatientId !== patientId)
    return (
      <MissingFollowUp
        onBack={() => navigate(patientTabUrl(patientId!, "seguimiento"))}
      />
    )
  const isOpen = followUp.status === "SCHEDULED"
  const followUpTimelineEvent = patientTimelineQuery.data?.data.find(
    (event): event is Extract<PatientTimelineEvent, { kind: "FOLLOW_UP" }> =>
      event.kind === "FOLLOW_UP" && event.followUpId === followUp.id,
  )

  function resolveNextFollowUpAgentId(values: ScheduleFollowUpFormValues) {
    const ownAgent = agentsQuery.data?.find(
      (agent) => agent.userId === user?.id,
    )
    return requiresAgentSelection ? values.agentId : ownAgent?.id
  }

  /** Persist every drafted change, in order, when the follow-up is completed. */
  async function commitDrafts() {
    const details: PatientDetailsInput = {
      ...clinicalDrafts.details,
      ...clinicalDrafts.social,
    }
    if (Object.keys(details).length > 0) {
      await patientsApi.updateDetails(patientId!, details)
    }

    let newDiagnosisId: string | undefined
    if (clinicalDrafts.diagnosis) {
      const { waitTimeForDiagnosisManuallyEdited, ...diagnosisDraft } =
        clinicalDrafts.diagnosis
      const waitTimeForDiagnosis = waitTimeForDiagnosisManuallyEdited
        ? toDurationInput(diagnosisDraft.waitTimeForDiagnosis)
        : diagnosisDraft.firstSymptomsDate && diagnosisDraft.diagnosisDate
          ? undefined
          : toDurationInput(diagnosisDraft.waitTimeForDiagnosis)
      if (
        diagnosisDraft.waitTimeForDiagnosis?.valueMin !== undefined &&
        !waitTimeForDiagnosis
      )
        throw new Error(
          "Completa correctamente el tiempo de espera para el diagnóstico",
        )

      const created = await patientsApi.createDiagnosis(patientId!, {
        ...diagnosisDraft,
        waitTimeForDiagnosis,
        followUpId: followUpId!,
      })
      newDiagnosisId = created.id
    }

    for (const treatmentDraft of clinicalDrafts.treatments ?? []) {
      const diagnosisId =
        treatmentDraft.diagnosisId === DRAFT_DIAGNOSIS_ID
          ? newDiagnosisId
          : treatmentDraft.diagnosisId

      if (!diagnosisId) continue
      if (treatmentDraft.mode === "REPLACE" && !treatmentDraft.seriesId) {
        throw new Error("Selecciona el tratamiento que deseas actualizar")
      }

      const normalizedFrequency = toDurationInput(
        treatmentDraft.treatmentFrequency,
      )
      if (treatmentDraft.treatmentFrequency && !normalizedFrequency) {
        throw new Error("Completa correctamente la frecuencia del tratamiento")
      }

      const normalizedMedications = treatmentDraft.medications?.map(
        (medication) => ({
          ...medication,
          frequency: toDurationInput(medication.frequency),
        }),
      )

      await patientsApi.createTreatment(patientId!, {
        diagnosisId,
        treatmentType: treatmentDraft.treatmentType,
        followUpId: followUpId!,
        seriesId:
          treatmentDraft.mode === "REPLACE"
            ? treatmentDraft.seriesId
            : undefined,
        isReferred: treatmentDraft.isReferred,
        sourceHealthCenterId: treatmentDraft.sourceHealthCenterId,
        receivingHealthCenterId: treatmentDraft.receivingHealthCenterId,
        startDate: treatmentDraft.startDate,
        endDate: treatmentDraft.endDate,
        changeReason: treatmentDraft.changeReason,
        notReceivingReason: treatmentDraft.notReceivingReason,
        treatmentSituation: treatmentDraft.treatmentSituation,
        hasLatestPrescription: treatmentDraft.hasLatestPrescription,
        latestPrescriptionDate: treatmentDraft.latestPrescriptionDate,
        treatmentFrequency: normalizedFrequency,
        ...(normalizedMedications?.length
          ? { medications: normalizedMedications }
          : {}),
      })
    }

    for (const note of clinicalDrafts.socialNotes ?? []) {
      await patientsApi.createSocialNote(patientId!, {
        followUpId: followUpId!,
        type: note.type,
        note: note.note,
      })
    }

    if (clinicalDrafts.symptomReport) {
      const { symptomDuration, symptomFrequency, ...symptomReportDraft } =
        clinicalDrafts.symptomReport
      const normalizedDuration = toDurationInput(symptomDuration)
      const normalizedFrequency = toDurationInput(symptomFrequency)
      if (symptomDuration?.valueMin !== undefined && !normalizedDuration)
        throw new Error("Completa correctamente la duración de los síntomas")
      if (symptomFrequency?.valueMin !== undefined && !normalizedFrequency)
        throw new Error("Completa correctamente la frecuencia de los síntomas")

      await patientsApi.createSymptomReport(patientId!, {
        ...symptomReportDraft,
        symptomDuration: normalizedDuration,
        symptomFrequency: normalizedFrequency,
        followUpId: followUpId!,
      })
    }

    if (clinicalDrafts.insurance) {
      await patientsApi.createInsurance(patientId!, {
        ...clinicalDrafts.insurance,
        followUpId: followUpId!,
      })
    }
    if (clinicalDrafts.sisAffiliation) {
      await patientsApi.createSisAffiliation(patientId!, {
        ...clinicalDrafts.sisAffiliation,
        followUpId: followUpId!,
      })
    }
    if (clinicalDrafts.address) {
      await patientsApi.createAddress(patientId!, {
        ...clinicalDrafts.address,
        followUpId: followUpId!,
      })
    }

    if (alertDraft) {
      await alertsApi.create({
        healthCenterId: alertDraft.healthCenterId,
        followUpId: followUpId!,
        subjectPatientId: followUp.subjectPatientId,
        interlocutorId: followUp.interlocutorId,
        title: alertDraft.title,
        description: alertDraft.description,
        severity: alertDraft.severity,
        category: alertDraft.category,
      })
    }

    if (psicoDraft) {
      try {
        await psychooncologyAppointmentsApi.create(psicoDraft)
      } catch (error) {
        toast.error("No se pudo agendar la cita de psicooncología", {
          description: (error as Error).message,
        })
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
        toast.error("No se pudo crear un recordatorio", {
          description: (error as Error).message,
        })
      }
    }
  }

  async function handleComplete() {
    setIsCompleting(true)
    try {
      await commitDrafts()
      await updateMutation.mutateAsync({
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      })
      draftStore.reset()
      await refreshAfterCompletion()
      toast.success("Seguimiento completado")
    } catch (error) {
      toast.error("No se pudo completar el seguimiento", {
        description: (error as Error).message,
      })
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
      toast.error("No se pudo actualizar el seguimiento", {
        description: (error as Error).message,
      })
    }
  }

  function addReminderDraft() {
    draftStore.addReminder({
      description: reminderDescription,
      dueAt: reminderAt,
    })
    setReminderDescription("")
    setReminderAt("")
  }

  return (
    <div className="mx-auto max-w-[90rem] space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5 text-xs"
        onClick={() => navigate(patientTabUrl(patientId!, "seguimiento"))}
      >
        <ArrowLeft className="size-3.5" />
        Volver al paciente
      </Button>

      <Card size="sm" className="border-border/60">
        <CardHeader className="border-border/60 border-b pb-4">
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
            <span>Registrar seguimiento</span>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${followUpStatusClasses[followUp.status]}`}
            >
              {followUpStatusLabels[followUp.status]}
            </span>
          </CardTitle>
          <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              <b className="text-foreground font-medium">Canal</b>{" "}
              {followUpTypeLabels[followUp.type] ?? "Sin especificar"}
            </span>
            <span>
              <b className="text-foreground font-medium">Propósito</b>{" "}
              {followUpPurposeLabels[followUp.purpose] ?? "Sin especificar"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="follow-up-notes">Notas del seguimiento</Label>
            <Textarea
              id="follow-up-notes"
              className="min-h-20 resize-y"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={
                followUp.notes ?? "Registrá el resultado del seguimiento..."
              }
              disabled={!canManage || !isOpen}
            />
          </div>
          {canManage && isOpen && (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                onClick={handleComplete}
                disabled={isCompleting}
                className="gap-1.5"
              >
                <CheckCircle2 className="size-4" />
                {isCompleting ? "Guardando..." : "Completar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDiscardStatus("NO_ANSWER")}
                disabled={isCompleting}
              >
                No contestó
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDiscardStatus("CANCELLED")}
                disabled={isCompleting}
              >
                Cancelar
              </Button>
            </div>
          )}
          {hasAnyClinicalDraft(clinicalDrafts) && isOpen && (
            <p className="text-muted-foreground text-xs lg:col-span-2">
              Los cambios se guardan al completar el seguimiento. Si lo cancelás
              o marcás «No contestó», se descartan.
            </p>
          )}
          {followUpTimelineEvent?.outcomes.length ? (
            <FollowUpOutcomes
              outcomes={followUpTimelineEvent.outcomes}
              className="lg:col-span-2"
            />
          ) : null}
        </CardContent>
      </Card>

      {canManage && isOpen ? (
        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Card size="sm" className="border-border/60">
            <CardHeader className="border-border/60 shrink-0 border-b pb-4">
              <CardTitle className="text-base">Ficha clínica</CardTitle>
              <p className="text-muted-foreground text-xs">
                Seleccioná una sección. El contenido se conserva al cambiar de
                sección.
              </p>
            </CardHeader>
            <CardContent className="px-4 pt-4 pb-4">
              <ClinicalDataTabs
                patientId={patientId!}
                drafts={clinicalDrafts}
                onDraftsChange={(updater) => draftStore.updateClinical(updater)}
              />
            </CardContent>
          </Card>
          <FollowUpAside
            className="order-last xl:order-last"
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
        </div>
      ) : null}

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
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={onBack}
      >
        <ArrowLeft className="size-3.5" />
        Volver al paciente
      </Button>
      <p className="text-muted-foreground text-sm">
        No se encontró el seguimiento solicitado.
      </p>
    </div>
  )
}
