import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { alertsApi } from "@/api/alerts"
import { followUpsApi, type FollowUp } from "@/api/follow-ups"
import {
  patientTimelineApi,
  type PatientTimelineEvent,
} from "@/api/patient-timeline"
import {
  patientsApi,
  type PatientDetailsInput,
  type PatientDiagnosis,
  type PatientTreatment,
} from "@/api/patients"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/auth-store"
import { ScheduleFollowUpDialog } from "../../_components/schedule-follow-up-dialog"
import type { ScheduleFollowUpFormValues } from "../../_components/schedule-follow-up-schema"
import { SchedulePsychooncologyDialog } from "../../_components/schedule-psychooncology-dialog"
import { ClinicalDataTabs } from "./clinical-data-tabs"
import {
  draftDiagnosisIdFromOption,
  hasAnyClinicalDraft,
  isDraftDiagnosisOptionId,
} from "./clinical-drafts"
import { CreateAlertDialog } from "./create-alert-dialog"
import { ClinicalRecordDetailSheet } from "./clinical-record-detail-sheet"
import { FollowUpAside } from "./follow-up-aside"
import {
  FollowUpStatusConfirmationDialog,
  type FollowUpStatusAction,
} from "./follow-up-status-confirmation-dialog"
import { FollowUpOutcomes } from "../../_components/follow-up-outcomes"
import {
  followUpNotesKey,
  useFollowUpDraftStore,
} from "../_store/follow-up-draft-store"
import { usePatient } from "../../_hooks/use-patient"
import { toDurationInput } from "@/types/duration"
import { patientTabUrl } from "../../_lib/patient-tabs"
import {
  followUpPurposeLabels,
  followUpStatusClasses,
  followUpStatusLabels,
  followUpTypeLabels,
} from "@/lib/follow-up-labels"

type EditableFollowUpStatus = Exclude<FollowUp["status"], "SCHEDULED">

const EDITABLE_STATUS_OPTIONS = [
  { value: "COMPLETED", label: "Completado" },
  { value: "NO_ANSWER", label: "No contestó" },
  { value: "CANCELLED", label: "Cancelado" },
] as const

function isClosedFollowUpStatus(
  status: FollowUp["status"],
): status is EditableFollowUpStatus {
  return status !== "SCHEDULED"
}

export function FollowUpContent() {
  const { id: patientId, followUpId } = useParams<{
    id: string
    followUpId: string
  }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(
    null,
  )
  const [editStatusDraft, setEditStatusDraft] = useState<{
    followUpId: string
    value: EditableFollowUpStatus
  } | null>(null)
  const [nextOpen, setNextOpen] = useState(false)
  const [psychooncologyOpen, setPsychooncologyOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [reminderDescription, setReminderDescription] = useState("")
  const [reminderAt, setReminderAt] = useState("")
  const [isCompleting, setIsCompleting] = useState(false)
  const [statusConfirmation, setStatusConfirmation] = useState<{
    action: FollowUpStatusAction
    source: "open" | "edit"
  } | null>(null)
  const [selectedDiagnosis, setSelectedDiagnosis] =
    useState<PatientDiagnosis | null>(null)
  const [selectedTreatment, setSelectedTreatment] =
    useState<PatientTreatment | null>(null)

  const draftStore = useFollowUpDraftStore()
  const {
    notesDrafts,
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
  const patientQuery = usePatient(patientId ?? "")
  const notesKey = followUpId ? followUpNotesKey(user?.id, followUpId) : null
  const hasNotesDraft = notesKey
    ? Object.prototype.hasOwnProperty.call(notesDrafts, notesKey)
    : false
  const notes =
    hasNotesDraft && notesKey
      ? notesDrafts[notesKey]
      : (followUpQuery.data?.notes ?? "")
  const editStatus: EditableFollowUpStatus =
    editStatusDraft && editStatusDraft.followUpId === followUpId
      ? editStatusDraft.value
      : followUpQuery.data?.status && followUpQuery.data.status !== "SCHEDULED"
        ? followUpQuery.data.status
        : "COMPLETED"
  const isEditing = editingFollowUpId === followUpId

  function setNotes(value: string) {
    if (!notesKey) return
    draftStore.setNotes(notesKey, value)
  }

  function setEditStatus(value: EditableFollowUpStatus) {
    if (!followUpId) return
    setEditStatusDraft({ followUpId, value })
  }
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
        notes: notes.trim(),
        completedAt,
      }),
  })
  const editMutation = useMutation({
    mutationFn: () =>
      followUpsApi.update(followUpId!, {
        status: editStatus,
        notes: notes.trim(),
        ...(editStatus !== followUpQuery.data?.status
          ? {
              completedAt:
                editStatus === "COMPLETED"
                  ? new Date().toISOString()
                  : undefined,
            }
          : {}),
      }),
  })
  const isStatusPending =
    isCompleting || updateMutation.isPending || editMutation.isPending

  async function refreshAfterFollowUpUpdate() {
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
      queryClient.invalidateQueries({ queryKey: ["agent-follow-ups"] }),
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
  const canEditClosed = canManage && !isOpen
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

    const newDiagnosisIds = new Map<string, string>()
    for (const diagnosisDecision of clinicalDrafts.diagnoses ?? []) {
      const {
        draftId,
        mode,
        replacementDiagnosisId,
        waitTimeForDiagnosisManuallyEdited,
        ...diagnosisDraft
      } = diagnosisDecision
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
        mode,
        ...(mode === "REPLACE" ? { replacementDiagnosisId } : {}),
        waitTimeForDiagnosis,
        followUpId: followUpId!,
      })
      newDiagnosisIds.set(draftId, created.id)
    }

    for (const treatmentDraft of clinicalDrafts.treatments ?? []) {
      const diagnosisId = isDraftDiagnosisOptionId(treatmentDraft.diagnosisId)
        ? newDiagnosisIds.get(
            draftDiagnosisIdFromOption(treatmentDraft.diagnosisId),
          )
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
        operationName: treatmentDraft.operationName,
        careProgram: treatmentDraft.careProgram,
        receivesTeleconsultation: treatmentDraft.receivesTeleconsultation,
        teleconsultationNote:
          treatmentDraft.receivesTeleconsultation === true
            ? treatmentDraft.teleconsultationNote
            : undefined,
        teleconsultationSpecialties:
          treatmentDraft.receivesTeleconsultation === true
            ? treatmentDraft.teleconsultationSpecialties
            : undefined,
        treatmentSituation: treatmentDraft.treatmentSituation,
        treatmentAbandonmentReason:
          treatmentDraft.treatmentSituation === "ABANDONED"
            ? treatmentDraft.treatmentAbandonmentReason
            : undefined,
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
    if (clinicalDrafts.healthBackground) {
      await patientsApi.createHealthBackgroundAssessment(patientId!, {
        ...clinicalDrafts.healthBackground,
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
      draftStore.reset(notesKey ?? undefined)
      await refreshAfterFollowUpUpdate()
      toast.success("Seguimiento completado")
    } catch (error) {
      toast.error("No se pudo completar el seguimiento", {
        description: (error as Error).message,
      })
    } finally {
      setIsCompleting(false)
      setStatusConfirmation(null)
    }
  }

  async function handleDiscardStatus(status: "CANCELLED" | "NO_ANSWER") {
    setIsCompleting(true)
    try {
      await updateMutation.mutateAsync({ status })
      draftStore.reset(notesKey ?? undefined)
      await refreshAfterFollowUpUpdate()
      toast.success("Seguimiento actualizado")
    } catch (error) {
      toast.error("No se pudo actualizar el seguimiento", {
        description: (error as Error).message,
      })
    } finally {
      setIsCompleting(false)
      setStatusConfirmation(null)
    }
  }

  function requestStatusChange(status: FollowUpStatusAction) {
    if (isCompleting || updateMutation.isPending) return
    setStatusConfirmation({ action: status, source: "open" })
  }

  async function confirmStatusChange() {
    if (!statusConfirmation) return
    if (statusConfirmation.source === "edit") {
      await handleEditSave()
    } else if (statusConfirmation.action === "COMPLETED") {
      await handleComplete()
    } else {
      await handleDiscardStatus(statusConfirmation.action)
    }
  }

  function startEditing() {
    if (!canEditClosed || !isClosedFollowUpStatus(followUp.status)) return

    setEditStatus(followUp.status)
    setEditingFollowUpId(followUp.id)
  }

  function cancelEditing() {
    if (!isClosedFollowUpStatus(followUp.status)) return

    if (notesKey) draftStore.clearNotes(notesKey)
    setEditStatus(followUp.status)
    setEditingFollowUpId(null)
  }

  async function handleEditSave() {
    try {
      const updated = await editMutation.mutateAsync()
      if (notesKey) draftStore.clearNotes(notesKey)
      if (isClosedFollowUpStatus(updated.status)) setEditStatus(updated.status)
      await refreshAfterFollowUpUpdate()
      setEditingFollowUpId(null)
      toast.success("Seguimiento actualizado")
    } catch (error) {
      toast.error("No se pudo guardar el seguimiento", {
        description: (error as Error).message,
      })
    } finally {
      setStatusConfirmation(null)
    }
  }

  function requestEditSave() {
    if (editMutation.isPending) return
    if (editStatus !== followUp.status) {
      setStatusConfirmation({ action: editStatus, source: "edit" })
      return
    }
    void handleEditSave()
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
            <div className="flex flex-wrap items-center gap-2">
              <span>
                {isOpen ? "Registrar seguimiento" : "Detalle del seguimiento"}
              </span>
              {canEditClosed && !isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={startEditing}
                >
                  <Pencil className="size-3.5" />
                  Editar seguimiento
                </Button>
              )}
            </div>
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
          {isEditing ? (
            <div className="space-y-4 lg:col-span-2">
              <div className="max-w-sm space-y-2">
                <Label htmlFor="follow-up-edit-status">Estado</Label>
                <Select
                  items={EDITABLE_STATUS_OPTIONS}
                  value={editStatus}
                  onValueChange={(value) => {
                    if (value) setEditStatus(value as EditableFollowUpStatus)
                  }}
                >
                  <SelectTrigger id="follow-up-edit-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDITABLE_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="follow-up-notes">Notas del seguimiento</Label>
                  {hasNotesDraft && notesKey && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-7 gap-1 text-xs"
                      onClick={() => draftStore.clearNotes(notesKey)}
                      disabled={editMutation.isPending}
                    >
                      <RotateCcw className="size-3" />
                      Restablecer nota
                    </Button>
                  )}
                </div>
                <Textarea
                  id="follow-up-notes"
                  className="min-h-20 resize-y"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Registrá el resultado del seguimiento..."
                  disabled={editMutation.isPending}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={editMutation.isPending}
                  className="gap-1.5"
                >
                  <X className="size-4" />
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={requestEditSave}
                  disabled={editMutation.isPending}
                  className="gap-1.5"
                >
                  <Save className="size-4" />
                  {editMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="follow-up-notes">Notas del seguimiento</Label>
                  {hasNotesDraft && notesKey && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-7 gap-1 text-xs"
                      onClick={() => draftStore.clearNotes(notesKey)}
                      disabled={isStatusPending}
                    >
                      <RotateCcw className="size-3" />
                      Restablecer nota
                    </Button>
                  )}
                </div>
                <Textarea
                  id="follow-up-notes"
                  className="min-h-20 resize-y"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Registrá el resultado del seguimiento..."
                  disabled={!canManage || !isOpen}
                />
              </div>
              {canManage && isOpen && (
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button
                    onClick={() => requestStatusChange("COMPLETED")}
                    disabled={isStatusPending}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="size-4" />
                    {isStatusPending ? "Guardando..." : "Completar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => requestStatusChange("NO_ANSWER")}
                    disabled={isStatusPending}
                  >
                    No contestó
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => requestStatusChange("CANCELLED")}
                    disabled={isStatusPending}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </>
          )}
          {(hasAnyClinicalDraft(clinicalDrafts) || hasNotesDraft) && isOpen && (
            <p className="text-muted-foreground text-xs lg:col-span-2">
              La nota se conserva en esta sesión hasta que la guardes o la
              restablezcas. Los cambios de la ficha se guardan al completar el
              seguimiento; si lo cancelás o marcás «No contestó», se descartan.
            </p>
          )}
          {followUpTimelineEvent?.outcomes.length ? (
            <FollowUpOutcomes
              outcomes={followUpTimelineEvent.outcomes}
              diagnoses={patientQuery.data?.diagnoses}
              treatments={patientQuery.data?.treatments}
              onViewDiagnosis={(diagnosis) => {
                setSelectedTreatment(null)
                setSelectedDiagnosis(diagnosis)
              }}
              onViewTreatment={(treatment) => {
                setSelectedDiagnosis(null)
                setSelectedTreatment(treatment)
              }}
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
                followUpId={followUpId}
                drafts={clinicalDrafts}
                onDraftsChange={(updater) => draftStore.updateClinical(updater)}
                onViewDiagnosis={(diagnosis) => {
                  setSelectedTreatment(null)
                  setSelectedDiagnosis(diagnosis)
                }}
                onViewTreatment={(treatment) => {
                  setSelectedDiagnosis(null)
                  setSelectedTreatment(treatment)
                }}
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
      <ClinicalRecordDetailSheet
        patientId={patientId!}
        diagnosis={selectedDiagnosis}
        treatment={selectedTreatment}
        open={Boolean(selectedDiagnosis || selectedTreatment)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDiagnosis(null)
            setSelectedTreatment(null)
          }
        }}
      />
      <FollowUpStatusConfirmationDialog
        action={statusConfirmation?.action ?? null}
        open={Boolean(statusConfirmation)}
        isPending={isStatusPending}
        onOpenChange={(open) => {
          if (!open && !isStatusPending) setStatusConfirmation(null)
        }}
        onConfirm={confirmStatusChange}
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
