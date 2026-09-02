import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { followUpsApi } from "@/api/follow-ups"
import {
  historicalRecordsApi,
  type CreateHistoricalFollowUpInput,
  type HistoricalFollowUp,
} from "@/api/historical-records"
import type { PatientDetailsResponse } from "@/api/patients"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ClinicalDataTabs } from "@/pages/pacientes/[id]/seguimientos/_components/clinical-data-tabs"
import type { ClinicalDrafts } from "@/pages/pacientes/[id]/seguimientos/_components/clinical-drafts"
import { usePatient } from "@/pages/pacientes/[id]/_hooks/use-patient"
import {
  buildHistoricalClinicalPayload,
  historicalClinicalDraftsFromPatient,
} from "./build-historical-clinical-payload"
import { Field, SelectField } from "./historical-form-fields"
import {
  FOLLOW_UP_PURPOSE_OPTIONS,
  FOLLOW_UP_STATUS_OPTIONS,
  FOLLOW_UP_TYPE_OPTIONS,
  toDateInputValue,
} from "./historical-record-options"

type FollowUpType = CreateHistoricalFollowUpInput["type"]
type FollowUpPurpose = CreateHistoricalFollowUpInput["purpose"]
type FollowUpStatus = CreateHistoricalFollowUpInput["status"]

export interface HistoricalFollowUpInitialValues {
  scheduledOn?: string
  completedOn?: string
  agentId?: string
  type?: FollowUpType
  purpose?: FollowUpPurpose
  status?: FollowUpStatus
  notes?: string
}

interface HistoricalFollowUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  /** When set the dialog edits that follow-up instead of creating a new one. */
  followUpId?: string | null
  initial?: HistoricalFollowUpInitialValues
  onSaved?: (followUp: HistoricalFollowUp) => void
}

export function HistoricalFollowUpDialog({
  open,
  onOpenChange,
  patientId,
  followUpId,
  initial,
  onSaved,
}: HistoricalFollowUpDialogProps) {
  const isEditing = Boolean(followUpId)

  const followUpQuery = useQuery({
    queryKey: ["follow-up", followUpId],
    queryFn: () => followUpsApi.getById(followUpId!),
    enabled: open && isEditing,
  })
  const patientQuery = usePatient(open && isEditing ? patientId : "")

  const existingFollowUp = isEditing ? followUpQuery.data : undefined
  const isReady = !isEditing || Boolean(existingFollowUp && patientQuery.data)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editar seguimiento histórico"
              : "Agregar seguimiento histórico"}
          </DialogTitle>
          <DialogDescription>
            Las fechas corresponden al hecho original. Al guardar se registran
            también los cambios de la ficha clínica, sin crear actividad
            operativa futura.
          </DialogDescription>
        </DialogHeader>

        {isReady ? (
          <HistoricalFollowUpForm
            patientId={patientId}
            followUpId={followUpId ?? null}
            existingFollowUp={existingFollowUp}
            patient={patientQuery.data}
            initial={initial}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        ) : (
          <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
            <Loader2 className="size-4 animate-spin" /> Cargando seguimiento...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Split from the dialog so every field can seed itself from the already
 * resolved record; the dialog only mounts it once the data is available.
 */
function HistoricalFollowUpForm({
  patientId,
  followUpId,
  existingFollowUp,
  patient,
  initial,
  onClose,
  onSaved,
}: {
  patientId: string
  followUpId: string | null
  existingFollowUp?: HistoricalFollowUp
  patient?: PatientDetailsResponse
  initial?: HistoricalFollowUpInitialValues
  onClose: () => void
  onSaved?: (followUp: HistoricalFollowUp) => void
}) {
  const queryClient = useQueryClient()
  const [prefill] = useState(() =>
    historicalClinicalDraftsFromPatient(patient, followUpId ?? undefined),
  )

  const [scheduledOn, setScheduledOn] = useState(
    () =>
      toDateInputValue(existingFollowUp?.scheduledOn) ||
      initial?.scheduledOn ||
      "",
  )
  const [completedOn, setCompletedOn] = useState(
    () =>
      toDateInputValue(existingFollowUp?.completedOn) ||
      initial?.completedOn ||
      "",
  )
  const [agentId, setAgentId] = useState(
    () => existingFollowUp?.agentId ?? initial?.agentId ?? "",
  )
  const [type, setType] = useState<FollowUpType>(
    () => existingFollowUp?.type ?? initial?.type ?? "CALL",
  )
  const [purpose, setPurpose] = useState<FollowUpPurpose>(
    () => existingFollowUp?.purpose ?? initial?.purpose ?? "FOLLOW_UP",
  )
  const [status, setStatus] = useState<FollowUpStatus>(
    () => existingFollowUp?.status ?? initial?.status ?? "COMPLETED",
  )
  const [notes, setNotes] = useState(
    () => existingFollowUp?.notes ?? initial?.notes ?? "",
  )
  const [drafts, setDrafts] = useState<ClinicalDrafts>(prefill.drafts)
  const recordIds = prefill.recordIds
  const [error, setError] = useState<string | null>(null)

  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    staleTime: 60_000,
  })

  const saveMutation = useMutation({
    mutationFn: async (): Promise<HistoricalFollowUp> => {
      if (!agentId) throw new Error("Selecciona el agente responsable")
      if (!scheduledOn && !completedOn)
        throw new Error("Indica la fecha programada o la fecha de realización")

      const clinical = buildHistoricalClinicalPayload({
        drafts,
        patientId,
        recordIds,
      })

      if (followUpId) {
        return historicalRecordsApi.updateFollowUp(followUpId, {
          ...clinical,
          agentId,
          type,
          purpose,
          status,
          notes: notes.trim() || undefined,
          scheduledOn: scheduledOn || null,
          completedOn: completedOn || null,
        })
      }

      return historicalRecordsApi.createFollowUp({
        ...clinical,
        subjectPatientId: patientId,
        agentId,
        type,
        purpose,
        status,
        notes: notes.trim() || undefined,
        ...(scheduledOn ? { scheduledOn } : {}),
        ...(completedOn ? { completedOn } : {}),
      })
    },
    onSuccess: async (followUp) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patient-timeline", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-profile", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-follow-ups", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-addresses", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-social-notes", patientId],
        }),
        queryClient.invalidateQueries({ queryKey: ["follow-up", followUp.id] }),
      ])
      toast.success(
        followUpId
          ? "Seguimiento histórico actualizado"
          : "Seguimiento histórico guardado",
      )
      onSaved?.(followUp)
      onClose()
    },
    onError: (cause: Error) => {
      setError(cause.message)
      toast.error("No se pudo guardar el seguimiento histórico", {
        description: cause.message,
      })
    },
  })

  const agentItems = (agentsQuery.data ?? []).map((agent) => ({
    value: agent.id,
    label: agent.fullName ?? agent.id,
  }))

  return (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Fecha programada">
            <Input
              type="date"
              value={scheduledOn}
              onChange={(event) => setScheduledOn(event.target.value)}
              className="bg-card border"
            />
          </Field>
          <Field
            label="Fecha de realización"
            hint="Déjala vacía si el contacto nunca llegó a ocurrir."
          >
            <Input
              type="date"
              value={completedOn}
              onChange={(event) => setCompletedOn(event.target.value)}
              className="bg-card border"
            />
          </Field>
          <SelectField
            label="Agente responsable *"
            value={agentId}
            placeholder="Seleccionar agente"
            items={agentItems}
            onChange={setAgentId}
          />
          <SelectField
            label="Canal"
            value={type}
            placeholder="Seleccionar canal"
            items={FOLLOW_UP_TYPE_OPTIONS}
            onChange={(value) => setType(value as FollowUpType)}
          />
          <SelectField
            label="Propósito"
            value={purpose}
            placeholder="Seleccionar propósito"
            items={FOLLOW_UP_PURPOSE_OPTIONS}
            onChange={(value) => setPurpose(value as FollowUpPurpose)}
          />
          <SelectField
            label="Estado"
            value={status}
            placeholder="Seleccionar estado"
            items={FOLLOW_UP_STATUS_OPTIONS}
            onChange={(value) => setStatus(value as FollowUpStatus)}
          />
          <div className="md:col-span-2">
            <Field label="Notas">
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Contexto del seguimiento"
                className="min-h-20 resize-y"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-muted-foreground mb-3 text-xs">
            Ficha clínica del seguimiento. Cada sección se guarda junto con el
            seguimiento.
          </p>
          <ClinicalDataTabs
            patientId={patientId}
            followUpId={followUpId ?? undefined}
            variant="historical"
            drafts={drafts}
            onDraftsChange={(updater) => setDrafts(updater)}
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>

      <DialogFooter className="shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={saveMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="gap-1.5"
        >
          {saveMutation.isPending && (
            <Loader2 className="size-3.5 animate-spin" />
          )}
          {followUpId ? "Guardar cambios" : "Guardar seguimiento"}
        </Button>
      </DialogFooter>
    </>
  )
}
