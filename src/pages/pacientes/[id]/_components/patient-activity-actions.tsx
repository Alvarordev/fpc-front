import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RotateCcw, UserMinus } from "lucide-react"
import { toast } from "sonner"
import { followUpsApi } from "@/api/follow-ups"
import { patientsApi, type DeactivatePatientInput, type PatientDetailsResponse } from "@/api/patients"
import { Button } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { ChoiceGroup, Field, SelectField, TextInput } from "@/components/ds/form"
import { Modal } from "@/components/ds/modal"
import { followUpPurposeLabels } from "@/lib/follow-up-labels"
import { useAuthStore } from "@/store/auth-store"
import { useStartReenrollment } from "../../_hooks/use-start-reenrollment"
import { formatDate } from "../_lib/ficha-format"
import { PatientChangeLog } from "./patient-change-log"

// Baja y reenrolamiento. Un paciente inactivo solo vuelve con un seguimiento de
// reenrolamiento (motivo, canal de ingreso, situación de salud y contacto).

const REASONS: { value: DeactivatePatientInput["reason"]; label: string }[] = [
  { value: "VOLUNTARY", label: "Retiro voluntario" },
  { value: "UNLOCATABLE", label: "No ubicable" },
  { value: "DECEASED", label: "Fallecido" },
  { value: "TRANSFERRED_OUT", label: "Transferido" },
]

const NO_FOLLOW_UP = "none"

export function PatientActivityActions({ patient }: { patient: PatientDetailsResponse }) {
  const role = useAuthStore((state) => state.user?.role)
  const canManage = patient.role === "PATIENT" && (role === "ADMIN" || role === "FOUNDATION" || role === "AGENT")
  const [open, setOpen] = useState(false)
  const reenroll = useStartReenrollment(patient.id)
  if (!canManage) return null
  if (patient.activityStatus === "INACTIVE") {
    return (
      <Button icon={RotateCcw} onClick={() => reenroll.mutate()} disabled={reenroll.isPending}>
        {reenroll.isPending ? "Creando seguimiento..." : "Reenrolar"}
      </Button>
    )
  }
  return (
    <>
      <Button icon={UserMinus} onClick={() => setOpen(true)}>
        Dar de baja
      </Button>
      {open && <DeactivateModal patient={patient} onClose={() => setOpen(false)} />}
    </>
  )
}

function DeactivateModal({ patient, onClose }: { patient: PatientDetailsResponse; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState<DeactivatePatientInput["reason"]>("VOLUNTARY")
  const [deceasedAt, setDeceasedAt] = useState("")
  const [followUpId, setFollowUpId] = useState(NO_FOLLOW_UP)
  const followUps = useQuery({
    queryKey: ["patient-follow-ups", patient.id],
    queryFn: () => followUpsApi.list({ patientId: patient.id }),
  })
  const followUpOptions = [
    { value: NO_FOLLOW_UP, label: "Sin seguimiento asociado" },
    ...(followUps.data ?? []).map((f) => ({
      value: f.id,
      label: `${followUpPurposeLabels[f.purpose]}, ${formatDate(f.scheduledAt ?? f.createdAt)}`,
    })),
  ]
  const mutation = useMutation({
    mutationFn: () =>
      patientsApi.deactivate(patient.id, {
        reason,
        ...(reason === "DECEASED" && deceasedAt ? { deceasedAt } : {}),
        ...(followUpId !== NO_FOLLOW_UP ? { followUpId } : {}),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["patient-profile", patient.id] }),
        queryClient.invalidateQueries({ queryKey: ["patients"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-change-log", patient.id] }),
      ])
      toast.success("Paciente dado de baja")
      onClose()
    },
    onError: (error: Error) => toast.error("No se pudo dar de baja", { description: error.message }),
  })
  const missingDate = reason === "DECEASED" && !deceasedAt
  return (
    <Modal
      open
      onClose={() => !mutation.isPending && onClose()}
      icon={UserMinus}
      title="Dar de baja al paciente"
      description="Elige el motivo. Si falleció, indica la fecha. Asociar un seguimiento es opcional."
      footer={
        <>
          <Button onClick={onClose} disabled={mutation.isPending}>
            Volver
          </Button>
          <Button variant="dark" disabled={mutation.isPending || missingDate} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Guardando..." : "Dar de baja"}
          </Button>
        </>
      }
    >
      <Panel title="Baja">
        <div className="space-y-4">
          <Field label="Motivo *">{() => <ChoiceGroup label="Motivo" value={reason} onChange={setReason} options={REASONS} />}</Field>
          {reason === "DECEASED" && (
            <Field label="Fecha de fallecimiento *">{(id) => <TextInput id={id} type="date" value={deceasedAt} onChange={(e) => setDeceasedAt(e.target.value)} />}</Field>
          )}
          <Field label="Seguimiento en el que se informó">{(id) => <SelectField id={id} value={followUpId} onChange={setFollowUpId} options={followUpOptions} />}</Field>
        </div>
      </Panel>
      <PatientChangeLog patientId={patient.id} title="Historial de bajas y reenrolamientos" description="Cambios de estado anteriores" onlyActivityStatus />
    </Modal>
  )
}
