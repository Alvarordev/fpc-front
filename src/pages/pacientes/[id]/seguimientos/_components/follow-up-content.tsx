import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { followUpsApi, type FollowUp } from "@/api/follow-ups"
import { patientTimelineApi } from "@/api/patient-timeline"
import type { PatientDiagnosis, PatientTreatment } from "@/api/patients"
import { Button } from "@/components/ds/button"
import { Card } from "@/components/ds/card"
import { StepSection } from "@/components/ds/step-section"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/store/auth-store"
import { normalizeDuration } from "@/types/duration"
import { DiagnosisDetailModal, TreatmentDetailModal } from "../../_components/clinical-record-modals"
import { PatientChangeLog } from "../../_components/patient-change-log"
import { PatientReferralsSection } from "../../_components/patient-referrals-section"
import { usePatient } from "../../_hooks/use-patient"
import { patientTabUrl } from "../../_lib/patient-tabs"
import { groupTreatmentSeries } from "../../_lib/treatment-series"
import { commitFollowUpDrafts } from "../_lib/commit-follow-up-drafts"
import { pendingSummary } from "../_lib/pending-summary"
import { followUpNotesKey, useFollowUpDraftStore } from "../_store/follow-up-draft-store"
import { hasAnyClinicalDraft } from "./clinical-drafts"
import { DerivedActionModal } from "./derived-action-modals"
import { ClinicalSheet } from "./ficha/clinical-sheet"
import { DerivedActionsCard, NotesDock, type DerivedAction } from "./follow-up-actions"
import { FollowUpAttemptsPanel } from "./follow-up-attempts-panel"
import { FollowUpClosedView, type ClosedStatus } from "./follow-up-closed-view"
import { FollowUpHeader } from "./follow-up-header"
import { canRescheduleFollowUp } from "../_lib/follow-up-reschedule"
import { FollowUpRescheduleModal, FollowUpReschedulePanel } from "./follow-up-reschedule-panel"
import { FollowUpStatusConfirmationDialog, type FollowUpStatusAction } from "./follow-up-status-confirmation-dialog"
import { reenrollmentMissing, toReenrollmentInput, type ReenrollmentDraft } from "../_lib/reenrollment"
import { ReenrollmentForm } from "./reenrollment-form"

// Pantalla de un seguimiento. Abierto, se registra en tres pasos (contactar,
// actualizar la ficha, decidir los siguientes pasos) con la nota fija al pie; todo
// queda en borrador y se guarda al completar. Cerrado, se consulta y se puede
// corregir el estado y la nota.

const DETAIL_HINT = "Para corregirlo, usa la pestaña de la ficha clínica: queda registrado en este seguimiento."

const isClosed = (status: FollowUp["status"]): status is ClosedStatus => status === "COMPLETED" || status === "NO_ANSWER" || status === "CANCELLED"

export function FollowUpContent() {
  const { id: patientId, followUpId } = useParams<{ id: string; followUpId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [editing, setEditing] = useState<{ followUpId: string; status: ClosedStatus } | null>(null)
  const [derived, setDerived] = useState<DerivedAction | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [confirmation, setConfirmation] = useState<{ action: FollowUpStatusAction; source: "open" | "edit" } | null>(null)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<PatientDiagnosis | null>(null)
  const [selectedTreatment, setSelectedTreatment] = useState<PatientTreatment | null>(null)
  const [reenrollment, setReenrollment] = useState<ReenrollmentDraft>({})

  const draftStore = useFollowUpDraftStore()
  const { notesDrafts, clinical: clinicalDrafts, nextFollowUp: nextFollowUpDraft, contact: contactDraft, interlocutorId: interlocutorDraft } = draftStore

  useEffect(() => {
    if (followUpId) useFollowUpDraftStore.getState().ensureFollowUp(followUpId)
  }, [followUpId])

  const canManage = user?.role === "ADMIN" || user?.role === "FOUNDATION" || user?.role === "AGENT"
  const requiresAgentSelection = user?.role === "ADMIN" || user?.role === "FOUNDATION"

  const followUpQuery = useQuery({ queryKey: ["follow-up", followUpId], queryFn: () => followUpsApi.getById(followUpId!), enabled: Boolean(followUpId) })
  const timeline = useQuery({ queryKey: ["patient-timeline", patientId], queryFn: () => patientTimelineApi.list(patientId!), enabled: Boolean(patientId) }).data?.data
  const agentsQuery = useQuery({ queryKey: ["agents"], queryFn: agentsApi.list, enabled: canManage, staleTime: 60_000 })
  const ownAgentId = agentsQuery.data?.find((agent) => agent.userId === user?.id)?.id
  const patientQuery = usePatient(patientId ?? "")
  const patient = patientQuery.data

  // El seguimiento no oncológico vigente se edita desde la ficha: se precarga en el borrador.
  useEffect(() => {
    const records = patient?.nonOncologicalFollowUps ?? []
    const record = records.find((item) => item.followUpId === followUpId) ?? records.find((item) => item.status === "ACTIVE")
    if (!record || useFollowUpDraftStore.getState().clinical.nonOncologicalFollowUp?.id === record.id) return
    useFollowUpDraftStore.getState().updateClinical((previous) => ({
      ...previous,
      nonOncologicalFollowUp: {
        id: record.id,
        diagnosticStatusEventId: record.diagnosticStatusEventId,
        diagnosis: record.diagnosis,
        occurredOn: record.occurredOn,
        receivesTreatment: record.receivesTreatment,
        treatmentName: record.treatmentName,
        medication: record.medication,
        treatmentFrequency: normalizeDuration(record.treatmentFrequency),
        hasControls: record.hasControls,
        controlSpecialty: record.controlSpecialty,
        controlPeriodicity: normalizeDuration(record.controlPeriodicity),
        status: record.status,
        dischargedOn: record.dischargedOn,
        dischargeReason: record.dischargeReason,
      },
    }))
  }, [followUpId, patient?.nonOncologicalFollowUps])

  const notesKey = followUpId ? followUpNotesKey(user?.id, followUpId) : null
  const hasNotesDraft = notesKey ? Object.prototype.hasOwnProperty.call(notesDrafts, notesKey) : false
  const notes = hasNotesDraft && notesKey ? notesDrafts[notesKey] : (followUpQuery.data?.notes ?? "")
  const isEditing = editing?.followUpId === followUpId
  const setNotes = (value: string) => notesKey && draftStore.setNotes(notesKey, value)

  const updateMutation = useMutation({
    mutationFn: ({ status, completedAt }: { status: ClosedStatus; completedAt?: string }) =>
      followUpsApi.update(followUpId!, { status, notes: notes.trim(), completedAt, ...(status === "COMPLETED" && interlocutorDraft ? { interlocutorId: interlocutorDraft } : {}) }),
  })
  const editMutation = useMutation({
    mutationFn: (status: ClosedStatus) =>
      followUpsApi.update(followUpId!, {
        status,
        notes: notes.trim(),
        ...(status !== followUpQuery.data?.status ? { completedAt: status === "COMPLETED" ? new Date().toISOString() : undefined } : {}),
      }),
  })
  const isStatusPending = isCompleting || updateMutation.isPending || editMutation.isPending

  async function refreshAfterFollowUpUpdate() {
    // El resumen IA se regenera al pedirlo tras un cambio y tarda varios segundos:
    // se refresca en segundo plano, sin hacer esperar el guardado.
    void queryClient.invalidateQueries({ queryKey: ["patient-summary", patientId] })
    const keys = [
      ["follow-up", followUpId],
      ["patient-timeline", patientId],
      ["patient-follow-ups", patientId],
      ["patient-profile", patientId],
      ["patient-diagnostic-status-current", patientId],
      ["patient-addresses", patientId],
      ["patient-social-notes", patientId],
      ["psychooncology-appointments"],
      ["agent-follow-ups"],
      ["patients"],
      ["patient-change-log", patientId],
    ]
    await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
  }

  const back = () => navigate(patientTabUrl(patientId!, "seguimiento"))

  if (followUpQuery.isLoading) return <FollowUpSkeleton />
  const followUp = followUpQuery.data
  if (!followUpId || followUpQuery.isError || !followUp || followUp.subjectPatientId !== patientId) return <MissingFollowUp onBack={back} />

  // No contestó sigue en registro: se puede intentar por otro canal y completar.
  const isOpen = followUp.status === "SCHEDULED" || followUp.status === "OVERDUE" || followUp.status === "NO_ANSWER"
  const canAct = canManage && (user?.role !== "AGENT" || (Boolean(ownAgentId) && followUp.agentId === ownAgentId))
  const canEditClosed = canAct && !isOpen && isClosed(followUp.status)
  const pending = pendingSummary(draftStore, notes)
  // Un seguimiento de reenrolamiento abierto de un paciente inactivo registra el reenrolamiento al completarse.
  const registersReenrollment = followUp.purpose === "REENROLLMENT" && patient?.activityStatus === "INACTIVE"
  const reenrollmentBlocker = registersReenrollment ? reenrollmentMissing(reenrollment) : null
  const selectedSeries = selectedTreatment && patient ? groupTreatmentSeries(patient.treatments).find((s) => s.seriesId === selectedTreatment.seriesId) : undefined
  const viewDiagnosis = (diagnosis: PatientDiagnosis) => {
    setSelectedTreatment(null)
    setSelectedDiagnosis(diagnosis)
  }
  const viewTreatment = (treatment: PatientTreatment) => {
    setSelectedDiagnosis(null)
    setSelectedTreatment(treatment)
  }

  function nextFollowUpAgentId() {
    if (!nextFollowUpDraft) return undefined
    return requiresAgentSelection ? nextFollowUpDraft.agentId : ownAgentId
  }

  async function complete() {
    setIsCompleting(true)
    try {
      if (!contactDraft) throw new Error("Registra el intento en que lograste el contacto")
      if (reenrollmentBlocker) throw new Error(reenrollmentBlocker)
      await commitFollowUpDrafts({ patientId: patientId!, followUp: followUp!, drafts: useFollowUpDraftStore.getState(), nextFollowUpAgentId: nextFollowUpAgentId() })
      // Reactiva al paciente y deja el seguimiento realizado; la nota y el intento se guardan después.
      if (registersReenrollment) await followUpsApi.createReenrollment(followUpId!, toReenrollmentInput(reenrollment))
      // Primero el cierre con la nota; el intento Contactado después no cambia el estado.
      await updateMutation.mutateAsync({ status: "COMPLETED", completedAt: new Date().toISOString() })
      await followUpsApi.recordAttempt(followUpId!, { channel: contactDraft.channel, outcome: "CONTACTED", notes: contactDraft.notes })
      draftStore.reset(notesKey ?? undefined)
      await refreshAfterFollowUpUpdate()
      if (registersReenrollment) setReenrollment({})
      toast.success(registersReenrollment ? "Paciente reenrolado" : "Seguimiento completado")
    } catch (error) {
      toast.error("No se pudo completar el seguimiento", { description: (error as Error).message })
    } finally {
      setIsCompleting(false)
      setConfirmation(null)
    }
  }

  /**
   * Guarda la nota y vuelve a la ficha. Los intentos ya quedaron guardados al
   * registrarlos (un intento sin respuesta deja el seguimiento en No contestó);
   * el seguimiento sigue abierto para volver a intentar y completarlo después.
   */
  async function saveAndExit() {
    setIsCompleting(true)
    try {
      if (notes.trim() !== (followUp!.notes ?? "").trim()) {
        await followUpsApi.update(followUpId!, { notes: notes.trim() })
        toast.success("Nota guardada")
      }
      if (notesKey) draftStore.clearNotes(notesKey)
      void refreshAfterFollowUpUpdate()
      back()
    } catch (error) {
      toast.error("No se pudo guardar la nota", { description: (error as Error).message })
    } finally {
      setIsCompleting(false)
    }
  }

  async function discard(status: "CANCELLED" | "NO_ANSWER") {
    setIsCompleting(true)
    try {
      await updateMutation.mutateAsync({ status })
      draftStore.reset(notesKey ?? undefined)
      await refreshAfterFollowUpUpdate()
      toast.success("Seguimiento actualizado")
    } catch (error) {
      toast.error("No se pudo actualizar el seguimiento", { description: (error as Error).message })
    } finally {
      setIsCompleting(false)
      setConfirmation(null)
    }
  }

  async function saveEdit() {
    if (!editing) return
    try {
      await editMutation.mutateAsync(editing.status)
      if (notesKey) draftStore.clearNotes(notesKey)
      await refreshAfterFollowUpUpdate()
      setEditing(null)
      toast.success("Seguimiento actualizado")
    } catch (error) {
      toast.error("No se pudo guardar el seguimiento", { description: (error as Error).message })
    } finally {
      setConfirmation(null)
    }
  }

  async function confirm() {
    if (!confirmation) return
    if (confirmation.source === "edit") await saveEdit()
    else if (confirmation.action === "COMPLETED") await complete()
    else await discard(confirmation.action)
  }

  function cancelEdit() {
    if (notesKey) draftStore.clearNotes(notesKey)
    setEditing(null)
  }

  function requestEditSave() {
    if (!editing || editMutation.isPending) return
    if (editing.status !== followUp!.status) setConfirmation({ action: editing.status, source: "edit" })
    else void saveEdit()
  }

  return (
    <div className="font-ds mx-auto min-w-0 max-w-[1120px] space-y-4 text-zinc-900">
      <FollowUpHeader
        followUp={followUp}
        patient={patient}
        timeline={timeline}
        agentName={agentsQuery.data?.find((agent) => agent.id === followUp.agentId)?.fullName}
        isOpen={isOpen}
        readOnlyNote={user?.role === "AGENT" && !canAct}
        onBack={back}
        onReschedule={canAct && canRescheduleFollowUp(followUp) ? () => setRescheduling(true) : undefined}
        onEdit={canEditClosed && !isEditing ? () => setEditing({ followUpId: followUp.id, status: followUp.status as ClosedStatus }) : undefined}
      />
      <FollowUpReschedulePanel followUp={followUp} patientId={patientId!} />
      {canAct && <FollowUpRescheduleModal followUp={followUp} patientId={patientId!} open={rescheduling} onClose={() => setRescheduling(false)} />}

      {canAct && isOpen ? (
        <>
          <StepSection n={1} title="Contacta al paciente" done={Boolean(contactDraft)}>
            <FollowUpAttemptsPanel followUp={followUp} canRegister={canAct} registering />
          </StepSection>
          {registersReenrollment && (
            <StepSection n={2} title="Registra el reenrolamiento" done={!reenrollmentBlocker}>
              <ReenrollmentForm draft={reenrollment} onChange={setReenrollment} />
            </StepSection>
          )}
          <StepSection n={registersReenrollment ? 3 : 2} title="Actualiza la ficha clínica" done={hasAnyClinicalDraft(clinicalDrafts)}>
            <Card title="Ficha clínica" description="Las preguntas son las que le haces. Lo que respondas se conserva al cambiar de pestaña y se guarda al completar.">
              <ClinicalSheet
                patientId={patientId!}
                followUpId={followUpId}
                drafts={clinicalDrafts}
                onDraftsChange={(updater) => draftStore.updateClinical(updater)}
                onViewDiagnosis={viewDiagnosis}
                onViewTreatment={viewTreatment}
              />
            </Card>
            {/* Opcional, pero conviene tenerlas a la vista antes de decidir los siguientes pasos. */}
            <PatientReferralsSection patientId={patientId!} followUpId={followUp.id} />
          </StepSection>
          <StepSection n={registersReenrollment ? 4 : 3} title="Decide los siguientes pasos" done={Boolean(draftStore.psico || draftStore.alert || nextFollowUpDraft || draftStore.reminders.length)}>
            <DerivedActionsCard onOpen={setDerived} canReportIncident={user?.role === "AGENT"} />
          </StepSection>
          <NotesDock
            notes={notes}
            onNotesChange={setNotes}
            onResetNotes={hasNotesDraft && notesKey ? () => draftStore.clearNotes(notesKey) : undefined}
            pendingCount={pending.length}
            disabled={isStatusPending}
            canComplete={Boolean(contactDraft) && !reenrollmentBlocker}
            completeHint={contactDraft ? (reenrollmentBlocker ?? undefined) : undefined}
            onClose={(action) => !isStatusPending && setConfirmation({ action, source: "open" })}
            onSaveAndExit={() => !isStatusPending && void saveAndExit()}
            interlocutor={{
              value: interlocutorDraft ?? followUp.interlocutorId ?? followUp.subjectPatientId,
              onChange: draftStore.setInterlocutor,
              options: [
                { value: followUp.subjectPatientId, label: `${patient?.fullName.split(" ")[0] ?? "Paciente"}, paciente` },
                ...(patient?.companions ?? []).map((link) => ({ value: link.companionId, label: link.companion?.fullName ?? link.companionDisplayName ?? "Acompañante" })),
              ],
            }}
          />
        </>
      ) : (
        <FollowUpClosedView
          followUp={followUp}
          patient={patient}
          timeline={timeline}
          notes={notes}
          onNotesChange={setNotes}
          editing={isEditing && editing ? { status: editing.status, onStatus: (status) => setEditing({ ...editing, status }), onCancel: cancelEdit, onSave: requestEditSave, saving: editMutation.isPending } : null}
          canAct={canAct}
          onViewDiagnosis={viewDiagnosis}
          onViewTreatment={viewTreatment}
        />
      )}

      {!(canAct && isOpen) && <PatientReferralsSection patientId={patientId!} followUpId={followUp.id} />}
      <PatientChangeLog patientId={patientId!} followUpId={followUp.id} title="Qué cambió en este contacto" description="Cambios registrados durante este seguimiento." />

      {derived && (
        <DerivedActionModal action={derived} patientId={followUp.subjectPatientId} followUpId={followUp.id} agents={agentsQuery.data} requiresAgentSelection={requiresAgentSelection} onClose={() => setDerived(null)} />
      )}
      {selectedDiagnosis && <DiagnosisDetailModal diagnosis={selectedDiagnosis} hint={DETAIL_HINT} onClose={() => setSelectedDiagnosis(null)} />}
      {selectedSeries && <TreatmentDetailModal patientId={patientId!} series={selectedSeries} hint={DETAIL_HINT} onClose={() => setSelectedTreatment(null)} />}
      <FollowUpStatusConfirmationDialog action={confirmation?.action ?? null} pending={pending} isPending={isStatusPending} onClose={() => setConfirmation(null)} onConfirm={() => void confirm()} />
    </div>
  )
}

function FollowUpSkeleton() {
  return (
    <div className="font-ds mx-auto max-w-[1120px] space-y-4">
      <Skeleton className="h-4 w-48 bg-zinc-200" />
      <Skeleton className="h-28 rounded-[20px] bg-white" />
      <Skeleton className="h-32 rounded-[20px] bg-white" />
      <Skeleton className="h-56 rounded-[20px] bg-white" />
    </div>
  )
}

function MissingFollowUp({ onBack }: { onBack: () => void }) {
  return (
    <div className="font-ds space-y-4">
      <Button icon={ArrowLeft} onClick={onBack}>
        Volver al paciente
      </Button>
      <p className="text-sm text-zinc-500">No encontramos este seguimiento. Puede que el enlace esté incompleto o que se haya eliminado.</p>
    </div>
  )
}
