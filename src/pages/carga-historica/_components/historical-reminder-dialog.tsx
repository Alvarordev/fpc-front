import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import {
  historicalRecordsApi,
  type CreateHistoricalReminderInput,
} from "@/api/historical-records"
import { patientsApi } from "@/api/patients"
import { remindersApi, type Reminder } from "@/api/reminders"
import type { components } from "@/api/schema"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  MedicalAppointmentFields,
  resolveSpecialty,
  type MedicalAppointmentFieldsValue,
} from "@/components/medical-appointment-fields"
import { cn } from "@/lib/utils"
import { Field, SelectField } from "./historical-form-fields"
import {
  APPOINTMENT_STATUS_OPTIONS,
  REMINDER_STATUS_OPTIONS,
  toDateInputValue,
  type SelectOption,
} from "./historical-record-options"

type ReminderKind = NonNullable<CreateHistoricalReminderInput["kind"]>
type ReminderStatus = CreateHistoricalReminderInput["status"]
type AppointmentStatus =
  components["schemas"]["HistoricalReminderMedicalAppointmentDto"]["status"]

const NO_FOLLOW_UP = "__NONE__"
const TRI_UNSET = "SIN_DATO"
const TRI_OPTIONS: SelectOption[] = [
  { value: TRI_UNSET, label: "Sin dato" },
  { value: "SI", label: "Sí" },
  { value: "NO", label: "No" },
]

const EMPTY_APPOINTMENT: MedicalAppointmentFieldsValue = {
  specialty: "",
  customSpecialty: "",
  healthCenterId: "",
  isFirstConsultation: false,
}

function TriField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | undefined
  onChange: (value: boolean | undefined) => void
}) {
  return (
    <SelectField
      label={label}
      value={value === undefined ? TRI_UNSET : value ? "SI" : "NO"}
      placeholder="Sin dato"
      items={TRI_OPTIONS}
      onChange={(next) =>
        onChange(next === TRI_UNSET ? undefined : next === "SI")
      }
    />
  )
}

interface HistoricalReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  /** When set the dialog edits that reminder instead of creating a new one. */
  reminderId?: string | null
  followUpItems: SelectOption[]
  defaultFollowUpId?: string
  onSaved?: () => void
}

export function HistoricalReminderDialog({
  open,
  onOpenChange,
  patientId,
  reminderId,
  followUpItems,
  defaultFollowUpId,
  onSaved,
}: HistoricalReminderDialogProps) {
  const isEditing = Boolean(reminderId)
  const remindersQuery = useQuery({
    queryKey: ["patient-reminders", patientId],
    queryFn: () => remindersApi.list({ patientId }),
    enabled: open && isEditing,
  })

  const existing = isEditing
    ? remindersQuery.data?.find((reminder) => reminder.id === reminderId)
    : undefined
  const isReady = !isEditing || Boolean(existing)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editar recordatorio histórico"
              : "Agregar recordatorio histórico"}
          </DialogTitle>
          <DialogDescription>
            Registrá un recordatorio genérico o una cita médica ya ocurrida, con
            su resultado.
          </DialogDescription>
        </DialogHeader>

        {isReady ? (
          <HistoricalReminderForm
            patientId={patientId}
            reminderId={reminderId ?? null}
            existing={existing}
            followUpItems={followUpItems}
            defaultFollowUpId={defaultFollowUpId}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        ) : (
          <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
            <Loader2 className="size-4 animate-spin" /> Cargando recordatorio...
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
function HistoricalReminderForm({
  patientId,
  reminderId,
  existing,
  followUpItems,
  defaultFollowUpId,
  onClose,
  onSaved,
}: {
  patientId: string
  reminderId: string | null
  existing?: Reminder
  followUpItems: SelectOption[]
  defaultFollowUpId?: string
  onClose: () => void
  onSaved?: () => void
}) {
  const queryClient = useQueryClient()
  const medical = existing?.medicalAppointment

  const [kind, setKind] = useState<ReminderKind>(
    () => existing?.kind ?? "GENERIC",
  )
  const [dueOn, setDueOn] = useState(() =>
    toDateInputValue(existing?.dueOn ?? existing?.dueAt),
  )
  const [completedOn, setCompletedOn] = useState(() =>
    toDateInputValue(existing?.completedOn ?? existing?.completedAt),
  )
  const [assignedAgentId, setAssignedAgentId] = useState(
    () => existing?.assignedAgentId ?? "",
  )
  const [status, setStatus] = useState<ReminderStatus>(
    () => existing?.status ?? "DONE",
  )
  const [description, setDescription] = useState(
    () => existing?.description ?? "",
  )
  const [createdFromFollowUpId, setCreatedFromFollowUpId] = useState(
    () => existing?.createdFromFollowUpId ?? defaultFollowUpId ?? "",
  )
  const [appointment, setAppointment] = useState<MedicalAppointmentFieldsValue>(
    () =>
      medical
        ? {
            specialty: medical.specialty,
            customSpecialty: "",
            healthCenterId: medical.healthCenterId ?? "",
            isFirstConsultation: medical.isFirstConsultation,
          }
        : EMPTY_APPOINTMENT,
  )
  const [appointmentDate, setAppointmentDate] = useState(() =>
    toDateInputValue(medical?.appointmentDate),
  )
  const [appointmentTime, setAppointmentTime] = useState(
    () => medical?.appointmentTime?.slice(0, 5) ?? "",
  )
  const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatus>(
    () => medical?.status ?? "COMPLETED",
  )
  const [hasReferralSheet, setHasReferralSheet] = useState(false)
  const [referredTo, setReferredTo] = useState("")
  const [referralNotProvidedReason, setReferralNotProvidedReason] = useState("")
  const [difficulties, setDifficulties] = useState("")
  const [nextAppointmentDate, setNextAppointmentDate] = useState("")
  const [nextAppointmentSpecialty, setNextAppointmentSpecialty] = useState("")
  const [changeReason, setChangeReason] = useState("")
  const [attendedViaSepa, setAttendedViaSepa] = useState<boolean | undefined>()
  const [referredViaSepa, setReferredViaSepa] = useState<boolean | undefined>()
  const [error, setError] = useState<string | null>(null)

  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    staleTime: 60_000,
  })
  const medicalAppointmentsQuery = useQuery({
    queryKey: ["patient-medical-appointments", patientId],
    queryFn: () => patientsApi.listMedicalAppointments(patientId),
    enabled: Boolean(existing?.medicalAppointmentId),
    staleTime: 30_000,
  })

  useEffect(() => {
    const appointmentId = existing?.medicalAppointmentId
    if (!appointmentId || !medicalAppointmentsQuery.data) return
    const full = medicalAppointmentsQuery.data.find(
      (item) => item.id === appointmentId,
    )
    if (!full) return
    setAppointment({
      specialty: full.specialty,
      customSpecialty: "",
      healthCenterId: full.healthCenterId ?? "",
      isFirstConsultation: full.isFirstConsultation,
    })
    setAppointmentDate(toDateInputValue(full.appointmentDate))
    setAppointmentTime(full.appointmentTime?.slice(0, 5) ?? "")
    setAppointmentStatus(full.status)
    setHasReferralSheet(full.hasReferralSheet === true)
    setReferredTo(full.referredTo ?? "")
    setReferralNotProvidedReason(full.referralNotProvidedReason ?? "")
    setDifficulties(full.difficulties ?? "")
    setNextAppointmentDate(toDateInputValue(full.nextAppointmentDate))
    setNextAppointmentSpecialty(full.nextAppointmentSpecialty ?? "")
    setChangeReason(full.changeReason ?? "")
    setAttendedViaSepa(
      full.attendedViaSepa === null ? undefined : full.attendedViaSepa,
    )
    setReferredViaSepa(
      full.referredViaSepa === null ? undefined : full.referredViaSepa,
    )
  }, [existing?.medicalAppointmentId, medicalAppointmentsQuery.data])

  const isMedical = kind === "MEDICAL_APPOINTMENT"
  const specialty = resolveSpecialty(appointment)

  function buildMedicalAppointment() {
    return {
      specialty,
      healthCenterId: appointment.healthCenterId || undefined,
      isFirstConsultation: appointment.isFirstConsultation,
      appointmentDate: appointmentDate || undefined,
      appointmentTime: appointmentTime || undefined,
      status: appointmentStatus,
      difficulties: difficulties.trim() || undefined,
      changeReason: changeReason.trim() || undefined,
      nextAppointmentDate: nextAppointmentDate || undefined,
      nextAppointmentSpecialty: nextAppointmentSpecialty.trim() || undefined,
      ...(appointmentStatus === "COMPLETED"
        ? {
            hasReferralSheet,
            referredTo: hasReferralSheet
              ? referredTo.trim() || undefined
              : undefined,
            referralNotProvidedReason: hasReferralSheet
              ? undefined
              : referralNotProvidedReason.trim() || undefined,
            ...(attendedViaSepa !== undefined ? { attendedViaSepa } : {}),
            ...(referredViaSepa !== undefined ? { referredViaSepa } : {}),
          }
        : {}),
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!dueOn && !completedOn)
        throw new Error("Indica la fecha prevista o la fecha de realización")
      if (!assignedAgentId) throw new Error("Selecciona el agente asignado")
      if (isMedical && !specialty)
        throw new Error("Indica la especialidad de la cita médica")
      const finalDescription = isMedical
        ? description.trim() || `Cita: ${specialty}`
        : description.trim()
      if (!finalDescription) throw new Error("Describe el recordatorio")

      const medicalAppointment = isMedical
        ? buildMedicalAppointment()
        : undefined

      if (reminderId) {
        return historicalRecordsApi.updateReminder(reminderId, {
          assignedAgentId,
          dueOn: dueOn || null,
          completedOn: completedOn || null,
          description: finalDescription,
          status,
          createdFromFollowUpId: createdFromFollowUpId || null,
          ...(medicalAppointment ? { medicalAppointment } : {}),
        })
      }

      return historicalRecordsApi.createReminder({
        subjectPatientId: patientId,
        assignedAgentId,
        description: finalDescription,
        status,
        kind,
        ...(dueOn ? { dueOn } : {}),
        ...(completedOn ? { completedOn } : {}),
        ...(createdFromFollowUpId ? { createdFromFollowUpId } : {}),
        ...(medicalAppointment ? { medicalAppointment } : {}),
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patient-timeline", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-reminders", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-medical-appointments", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-profile", patientId],
        }),
      ])
      toast.success(
        reminderId
          ? "Recordatorio histórico actualizado"
          : "Recordatorio histórico guardado",
      )
      onSaved?.()
      onClose()
    },
    onError: (cause: Error) => {
      setError(cause.message)
      toast.error("No se pudo guardar el recordatorio histórico", {
        description: cause.message,
      })
    },
  })

  const agentItems = (agentsQuery.data ?? []).map((agent) => ({
    value: agent.id,
    label: agent.fullName ?? agent.id,
  }))
  const followUpSelectItems: SelectOption[] = [
    { value: NO_FOLLOW_UP, label: "Sin seguimiento relacionado" },
    ...followUpItems,
  ]

  return (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        {!reminderId && (
          <div className="flex gap-2">
            {(
              [
                ["GENERIC", "Genérico"],
                ["MEDICAL_APPOINTMENT", "Cita médica"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  kind === value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted/50",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Fecha prevista">
            <Input
              type="date"
              value={dueOn}
              onChange={(event) => setDueOn(event.target.value)}
              className="bg-card border"
            />
          </Field>
          <Field label="Fecha de realización">
            <Input
              type="date"
              value={completedOn}
              onChange={(event) => setCompletedOn(event.target.value)}
              className="bg-card border"
            />
          </Field>
          <SelectField
            label="Agente asignado *"
            value={assignedAgentId}
            placeholder="Seleccionar agente"
            items={agentItems}
            onChange={setAssignedAgentId}
          />
          <SelectField
            label="Estado"
            value={status}
            placeholder="Seleccionar estado"
            items={REMINDER_STATUS_OPTIONS}
            onChange={(value) => setStatus(value as ReminderStatus)}
          />
          <div className="md:col-span-2">
            <SelectField
              label="Seguimiento relacionado"
              value={createdFromFollowUpId || NO_FOLLOW_UP}
              placeholder="Seleccionar seguimiento"
              items={followUpSelectItems}
              onChange={(value) =>
                setCreatedFromFollowUpId(value === NO_FOLLOW_UP ? "" : value)
              }
            />
          </div>
          <div className="md:col-span-2">
            <Field
              label={isMedical ? "Descripción" : "Descripción *"}
              hint={
                isMedical
                  ? "Opcional — se genera desde la especialidad."
                  : undefined
              }
            >
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Qué debía recordarse"
                className="min-h-16 resize-y"
              />
            </Field>
          </div>
        </div>

        {isMedical && (
          <div className="space-y-4 rounded-xl border p-3">
            <MedicalAppointmentFields
              value={appointment}
              onChange={setAppointment}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fecha de la cita">
                <Input
                  type="date"
                  value={appointmentDate}
                  onChange={(event) => setAppointmentDate(event.target.value)}
                  className="bg-card border"
                />
              </Field>
              <Field label="Hora de la cita">
                <Input
                  type="time"
                  value={appointmentTime}
                  onChange={(event) => setAppointmentTime(event.target.value)}
                  className="bg-card border"
                />
              </Field>
              <SelectField
                label="¿Qué pasó con la cita?"
                value={appointmentStatus}
                placeholder="Seleccionar estado"
                items={APPOINTMENT_STATUS_OPTIONS}
                onChange={(value) =>
                  setAppointmentStatus(value as AppointmentStatus)
                }
              />
              <Field label="Motivo del registro">
                <Input
                  value={changeReason}
                  onChange={(event) => setChangeReason(event.target.value)}
                  placeholder="Ej: Confirmado con el paciente"
                  className="bg-card border"
                />
              </Field>
            </div>

            {appointmentStatus === "COMPLETED" && (
              <div className="space-y-3 rounded-lg border border-dashed p-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasReferralSheet}
                    onChange={(event) =>
                      setHasReferralSheet(event.target.checked)
                    }
                    className="size-4 rounded"
                  />
                  <span className="text-sm">Recibió hoja de referencia</span>
                </label>
                {hasReferralSheet ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="historical-referred-to">Referido a</Label>
                    <Input
                      id="historical-referred-to"
                      value={referredTo}
                      onChange={(event) => setReferredTo(event.target.value)}
                      placeholder="Hospital / especialidad"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="historical-referral-reason">
                      Motivo sin hoja de referencia
                    </Label>
                    <Input
                      id="historical-referral-reason"
                      value={referralNotProvidedReason}
                      onChange={(event) =>
                        setReferralNotProvidedReason(event.target.value)
                      }
                    />
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <TriField
                    label="¿Asistió a atención primaria vía SEPA?"
                    value={attendedViaSepa}
                    onChange={setAttendedViaSepa}
                  />
                  <TriField
                    label="¿Fue referido a mayor complejidad vía SEPA?"
                    value={referredViaSepa}
                    onChange={setReferredViaSepa}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Próxima cita">
                <Input
                  type="date"
                  value={nextAppointmentDate}
                  onChange={(event) =>
                    setNextAppointmentDate(event.target.value)
                  }
                  className="bg-card border"
                />
              </Field>
              <Field label="Especialidad de la próxima cita">
                <Input
                  value={nextAppointmentSpecialty}
                  onChange={(event) =>
                    setNextAppointmentSpecialty(event.target.value)
                  }
                  className="bg-card border"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Dificultades">
                  <Input
                    value={difficulties}
                    onChange={(event) => setDifficulties(event.target.value)}
                    placeholder="Barreras para asistir o comentarios"
                    className="bg-card border"
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

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
          {reminderId ? "Guardar cambios" : "Guardar recordatorio"}
        </Button>
      </DialogFooter>
    </>
  )
}
