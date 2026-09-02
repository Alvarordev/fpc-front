import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  ClipboardList,
  History,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import {
  historicalRecordsApi,
  type CreateHistoricalFollowUpInput,
  type CreateHistoricalMedicalAppointmentInput,
  type CreateHistoricalPsychooncologyAppointmentInput,
  type CreateHistoricalReminderInput,
} from "@/api/historical-records"
import { enrollmentsApi } from "@/api/enrollments"
import { patientsApi } from "@/api/patients"
import {
  patientTimelineApi,
  type PatientTimelineEvent,
} from "@/api/patient-timeline"
import { volunteersApi } from "@/api/volunteers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type RecordType =
  | "FOLLOW_UP"
  | "REMINDER"
  | "MEDICAL_APPOINTMENT"
  | "PSYCHOONCOLOGY_APPOINTMENT"

export type HistoricalRecordDraft =
  | { id: string; type: "FOLLOW_UP"; input: CreateHistoricalFollowUpInput }
  | { id: string; type: "REMINDER"; input: CreateHistoricalReminderInput }
  | {
      id: string
      type: "MEDICAL_APPOINTMENT"
      input: CreateHistoricalMedicalAppointmentInput
    }
  | {
      id: string
      type: "PSYCHOONCOLOGY_APPOINTMENT"
      input: CreateHistoricalPsychooncologyAppointmentInput
    }

const RECORD_TYPE_OPTIONS = [
  { value: "FOLLOW_UP", label: "Seguimiento" },
  { value: "REMINDER", label: "Recordatorio" },
  { value: "MEDICAL_APPOINTMENT", label: "Cita médica" },
  { value: "PSYCHOONCOLOGY_APPOINTMENT", label: "Sesión psicooncológica" },
] satisfies { value: RecordType; label: string }[]

const FOLLOW_UP_TYPE_OPTIONS = [
  { value: "CALL", label: "Llamada" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "VIDEO_CALL", label: "Videollamada" },
  { value: "EMAIL", label: "Correo electrónico" },
  { value: "IN_PERSON", label: "Presencial" },
  { value: "FACEBOOK", label: "Facebook" },
] satisfies { value: CreateHistoricalFollowUpInput["type"]; label: string }[]

const PURPOSE_OPTIONS = [
  { value: "FOLLOW_UP", label: "Seguimiento" },
  { value: "FIRST_CONTACT", label: "Primer contacto" },
  { value: "ENROLLMENT", label: "Enrolamiento" },
  { value: "PSYCHOONCOLOGY_REFERRAL", label: "Derivación a psicooncología" },
  { value: "OTHER", label: "Otro" },
] satisfies { value: CreateHistoricalFollowUpInput["purpose"]; label: string }[]

const FOLLOW_UP_STATUS_OPTIONS = [
  { value: "COMPLETED", label: "Completado" },
  { value: "SCHEDULED", label: "Programado" },
  { value: "NO_ANSWER", label: "Sin respuesta" },
  { value: "CANCELLED", label: "Cancelado" },
] satisfies { value: CreateHistoricalFollowUpInput["status"]; label: string }[]

const REMINDER_STATUS_OPTIONS = [
  { value: "DONE", label: "Realizado" },
  { value: "PENDING", label: "Pendiente" },
  { value: "DISMISSED", label: "Descartado" },
] satisfies { value: CreateHistoricalReminderInput["status"]; label: string }[]

const APPOINTMENT_STATUS_OPTIONS = [
  { value: "COMPLETED", label: "Atendida" },
  { value: "SCHEDULED", label: "Programada" },
  { value: "NO_ANSWER", label: "No asistió" },
  { value: "CANCELLED", label: "Cancelada" },
] satisfies {
  value: CreateHistoricalMedicalAppointmentInput["status"]
  label: string
}[]

const MODALITY_OPTIONS = [
  { value: "CALL", label: "Llamada" },
  { value: "VIDEO_CALL", label: "Videollamada" },
] satisfies {
  value: CreateHistoricalPsychooncologyAppointmentInput["modality"]
  label: string
}[]

const PSYCHO_STATUS_OPTIONS = APPOINTMENT_STATUS_OPTIONS satisfies {
  value: CreateHistoricalPsychooncologyAppointmentInput["status"]
  label: string
}[]

const ANONYMOUS_VOLUNTEER = "__ANONYMOUS__"

function newDraftId() {
  return typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground/70 text-[10px] font-bold tracking-[0.1em] uppercase">
        {label}
      </Label>
      {children}
    </div>
  )
}

function SelectField({
  label,
  value,
  placeholder,
  items,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  items: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <Select
        items={items}
        value={value}
        onValueChange={(next) => onChange(next ?? "")}
      >
        <SelectTrigger className="bg-card w-full border">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function formatDate(value: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.test(value)
  const date = new Date(dateOnly ? `${value}T00:00:00.000Z` : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("es-PE", {
    timeZone: dateOnly ? "UTC" : "America/Lima",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

function eventTitle(event: PatientTimelineEvent) {
  if (event.kind === "FOLLOW_UP") return `Seguimiento · ${event.type}`
  if (event.kind === "REMINDER") return "Recordatorio"
  if (event.kind === "PSYCHOONCOLOGY_APPOINTMENT") {
    return `Sesión psicooncológica · #${event.sessionNumber}`
  }
  return "Nota social"
}

function eventDescription(event: PatientTimelineEvent) {
  if (event.kind === "FOLLOW_UP") return event.notes || "Sin notas"
  if (event.kind === "REMINDER") return event.description
  if (event.kind === "PSYCHOONCOLOGY_APPOINTMENT") {
    return event.modality === "VIDEO_CALL" ? "Videollamada" : "Llamada"
  }
  return event.note
}

function eventStatus(event: PatientTimelineEvent) {
  return event.kind === "SOCIAL_NOTE" ? "NOTA" : event.status
}

function draftTitle(draft: HistoricalRecordDraft) {
  if (draft.type === "FOLLOW_UP") return "Seguimiento"
  if (draft.type === "REMINDER") return "Recordatorio"
  if (draft.type === "MEDICAL_APPOINTMENT") return "Cita médica"
  return "Sesión psicooncológica"
}

function draftDate(draft: HistoricalRecordDraft | null) {
  if (!draft) return undefined
  if (draft.type === "FOLLOW_UP") {
    return draft.input.scheduledOn ?? draft.input.completedOn
  }
  if (draft.type === "REMINDER") {
    return draft.input.dueOn ?? draft.input.completedOn
  }
  if (draft.type === "MEDICAL_APPOINTMENT") return draft.input.appointmentDate
  return draft.input.scheduledOn
}

function draftRelationSummary(draft: HistoricalRecordDraft) {
  if (draft.type === "FOLLOW_UP") return "Nuevo seguimiento"
  const followUpId =
    draft.type === "REMINDER"
      ? draft.input.createdFromFollowUpId
      : draft.input.followUpId
  return followUpId ? "Seguimiento relacionado" : "Sin seguimiento relacionado"
}

function draftSummary(draft: HistoricalRecordDraft) {
  if (draft.type === "FOLLOW_UP") {
    return `${draft.input.type} · ${draft.input.purpose} · ${draft.input.status} · ${draftRelationSummary(draft)}`
  }
  if (draft.type === "REMINDER") {
    return `${draft.input.description} · ${draft.input.status} · ${draftRelationSummary(draft)}`
  }
  if (draft.type === "MEDICAL_APPOINTMENT") {
    return `${draft.input.specialty} · ${draft.input.status} · ${draftRelationSummary(draft)}`
  }
  return `Sesión #${draft.input.sessionNumber} · ${draft.input.modality} · ${draft.input.status} · ${draftRelationSummary(draft)}`
}

function HistoricalRecordComposer({
  patientId,
  enrollmentFollowUpId,
  editingDraft,
  onDraft,
  onCancelEdit,
}: {
  patientId: string
  enrollmentFollowUpId: string | null
  editingDraft: HistoricalRecordDraft | null
  onDraft: (draft: HistoricalRecordDraft) => void
  onCancelEdit: () => void
}) {
  const [recordType, setRecordType] = useState<RecordType>(
    editingDraft?.type ?? "FOLLOW_UP",
  )
  const [date, setDate] = useState(() => draftDate(editingDraft) ?? "")
  const [agentId, setAgentId] = useState(() => {
    if (editingDraft?.type === "FOLLOW_UP") return editingDraft.input.agentId
    if (editingDraft?.type === "REMINDER") {
      return editingDraft.input.assignedAgentId
    }
    return ""
  })
  const [followUpType, setFollowUpType] = useState<
    CreateHistoricalFollowUpInput["type"]
  >(editingDraft?.type === "FOLLOW_UP" ? editingDraft.input.type : "CALL")
  const [purpose, setPurpose] = useState<
    CreateHistoricalFollowUpInput["purpose"]
  >(
    editingDraft?.type === "FOLLOW_UP"
      ? editingDraft.input.purpose
      : "FOLLOW_UP",
  )
  const [followUpStatus, setFollowUpStatus] = useState<
    CreateHistoricalFollowUpInput["status"]
  >(
    editingDraft?.type === "FOLLOW_UP"
      ? editingDraft.input.status
      : "COMPLETED",
  )
  const [notes, setNotes] = useState(() => {
    if (editingDraft?.type === "FOLLOW_UP")
      return editingDraft.input.notes ?? ""
    if (editingDraft?.type === "PSYCHOONCOLOGY_APPOINTMENT") {
      return editingDraft.input.schedulingNotes ?? ""
    }
    return ""
  })
  const [reminderStatus, setReminderStatus] = useState<
    CreateHistoricalReminderInput["status"]
  >(editingDraft?.type === "REMINDER" ? editingDraft.input.status : "DONE")
  const [reminderKind, setReminderKind] = useState<
    NonNullable<CreateHistoricalReminderInput["kind"]>
  >(
    editingDraft?.type === "REMINDER"
      ? (editingDraft.input.kind ?? "GENERIC")
      : "GENERIC",
  )
  const [description, setDescription] = useState(() =>
    editingDraft?.type === "REMINDER" ? editingDraft.input.description : "",
  )
  const [specialty, setSpecialty] = useState(() =>
    editingDraft?.type === "MEDICAL_APPOINTMENT"
      ? editingDraft.input.specialty
      : "",
  )
  const [appointmentTime, setAppointmentTime] = useState(() =>
    editingDraft?.type === "MEDICAL_APPOINTMENT"
      ? (editingDraft.input.appointmentTime ?? "")
      : "",
  )
  const [appointmentStatus, setAppointmentStatus] = useState<
    CreateHistoricalMedicalAppointmentInput["status"]
  >(
    editingDraft?.type === "MEDICAL_APPOINTMENT"
      ? editingDraft.input.status
      : "COMPLETED",
  )
  const [sessionNumber, setSessionNumber] = useState(() =>
    editingDraft?.type === "PSYCHOONCOLOGY_APPOINTMENT"
      ? String(editingDraft.input.sessionNumber)
      : "1",
  )
  const [modality, setModality] = useState<
    CreateHistoricalPsychooncologyAppointmentInput["modality"]
  >(
    editingDraft?.type === "PSYCHOONCOLOGY_APPOINTMENT"
      ? editingDraft.input.modality
      : "CALL",
  )
  const [psychoStatus, setPsychoStatus] = useState<
    CreateHistoricalPsychooncologyAppointmentInput["status"]
  >(
    editingDraft?.type === "PSYCHOONCOLOGY_APPOINTMENT"
      ? editingDraft.input.status
      : "COMPLETED",
  )
  const [volunteerId, setVolunteerId] = useState(() => {
    if (editingDraft?.type !== "PSYCHOONCOLOGY_APPOINTMENT") {
      return ANONYMOUS_VOLUNTEER
    }
    return editingDraft.input.useAnonymousVolunteer
      ? ANONYMOUS_VOLUNTEER
      : (editingDraft.input.volunteerId ?? ANONYMOUS_VOLUNTEER)
  })
  const [medicalAppointmentId, setMedicalAppointmentId] = useState(() =>
    editingDraft?.type === "REMINDER"
      ? (editingDraft.input.medicalAppointmentId ?? "")
      : "",
  )
  const [error, setError] = useState<string | null>(null)

  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    staleTime: 60_000,
  })
  const volunteersQuery = useQuery({
    queryKey: ["volunteers"],
    queryFn: volunteersApi.list,
    staleTime: 300_000,
  })
  const medicalAppointmentsQuery = useQuery({
    queryKey: ["patient-medical-appointments", patientId],
    queryFn: () => patientsApi.listMedicalAppointments(patientId),
    staleTime: 60_000,
  })

  const agentItems = (agentsQuery.data ?? []).map((agent) => ({
    value: agent.id,
    label: agent.fullName ?? agent.id,
  }))
  const volunteerItems = [
    { value: ANONYMOUS_VOLUNTEER, label: "Voluntario no identificado" },
    ...(volunteersQuery.data ?? [])
      .filter((volunteer) => !volunteer.isAnonymous)
      .map((volunteer) => ({
        value: volunteer.id,
        label: `${volunteer.firstName} ${volunteer.lastName} · ${volunteer.specialty}${volunteer.isActive ? "" : " · Inactivo"}`,
      })),
  ]
  const medicalAppointmentItems = (medicalAppointmentsQuery.data ?? []).map(
    (appointment) => ({
      value: appointment.id,
      label: `${appointment.specialty} · ${appointment.appointmentDate ?? "Sin fecha"}`,
    }),
  )

  function resetForm() {
    setRecordType("FOLLOW_UP")
    setDate("")
    setAgentId("")
    setFollowUpType("CALL")
    setPurpose("FOLLOW_UP")
    setFollowUpStatus("COMPLETED")
    setNotes("")
    setReminderStatus("DONE")
    setReminderKind("GENERIC")
    setDescription("")
    setSpecialty("")
    setAppointmentTime("")
    setAppointmentStatus("COMPLETED")
    setSessionNumber("1")
    setModality("CALL")
    setPsychoStatus("COMPLETED")
    setVolunteerId(ANONYMOUS_VOLUNTEER)
    setMedicalAppointmentId("")
    setError(null)
  }

  function submitDraft() {
    if (!date) throw new Error("Indica la fecha real del registro")
    const id = editingDraft?.id ?? newDraftId()

    if (recordType === "FOLLOW_UP") {
      if (!agentId) throw new Error("Selecciona el agente responsable")
      onDraft({
        id,
        type: "FOLLOW_UP",
        input: {
          subjectPatientId: patientId,
          interlocutorId: patientId,
          agentId,
          type: followUpType,
          purpose,
          status: followUpStatus,
          notes: notes.trim() || undefined,
          scheduledOn: date,
          ...(followUpStatus === "COMPLETED" || followUpStatus === "NO_ANSWER"
            ? { completedOn: date }
            : {}),
        },
      })
      return
    }

    if (recordType === "REMINDER") {
      if (!agentId) throw new Error("Selecciona el agente asignado")
      if (!description.trim()) throw new Error("Describe el recordatorio")
      if (reminderKind === "MEDICAL_APPOINTMENT" && !medicalAppointmentId) {
        throw new Error("Selecciona la cita médica relacionada")
      }
      onDraft({
        id,
        type: "REMINDER",
        input: {
          subjectPatientId: patientId,
          dueOn: date,
          completedOn: reminderStatus === "DONE" ? date : undefined,
          assignedAgentId: agentId,
          description: description.trim(),
          kind: reminderKind,
          createdFromFollowUpId: enrollmentFollowUpId || undefined,
          status: reminderStatus,
          medicalAppointmentId:
            reminderKind === "MEDICAL_APPOINTMENT"
              ? medicalAppointmentId
              : undefined,
        },
      })
      return
    }

    if (recordType === "MEDICAL_APPOINTMENT") {
      if (!enrollmentFollowUpId)
        throw new Error("No hay un seguimiento histórico relacionado")
      if (!specialty.trim()) throw new Error("Indica la especialidad")
      onDraft({
        id,
        type: "MEDICAL_APPOINTMENT",
        input: {
          patientId,
          followUpId: enrollmentFollowUpId,
          specialty: specialty.trim(),
          appointmentDate: date,
          appointmentTime: appointmentTime || undefined,
          status: appointmentStatus,
        },
      })
      return
    }

    const parsedSessionNumber = Number(sessionNumber)
    if (!Number.isInteger(parsedSessionNumber) || parsedSessionNumber < 1) {
      throw new Error("El número de sesión debe ser un entero positivo")
    }
    onDraft({
      id,
      type: "PSYCHOONCOLOGY_APPOINTMENT",
      input: {
        patientId,
        followUpId: enrollmentFollowUpId ?? undefined,
        volunteerId:
          volunteerId === ANONYMOUS_VOLUNTEER ? undefined : volunteerId,
        useAnonymousVolunteer: volunteerId === ANONYMOUS_VOLUNTEER,
        sessionNumber: parsedSessionNumber,
        modality,
        status: psychoStatus,
        scheduledOn: date,
        completedOn: psychoStatus === "COMPLETED" ? date : undefined,
        schedulingNotes: notes.trim() || undefined,
      },
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    try {
      submitDraft()
      resetForm()
      onCancelEdit()
    } catch (cause) {
      setError((cause as Error).message)
    }
  }

  /*
   * The composer only prepares a draft. Persisting it is deliberately handled
   * by the panel so the operator can review, edit, or remove it first.
   */
  const composerTitle = editingDraft
    ? "Editar borrador histórico"
    : "Agregar registro histórico"

  return (
    <Card className="border-primary/20">
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="text-primary size-4" />
          {composerTitle}
        </CardTitle>
        <CardDescription>
          Las fechas corresponden al hecho original. Revise el borrador antes de
          guardarlo; no se crean tareas ni notificaciones operativas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Tipo de registro"
              value={recordType}
              placeholder="Seleccionar tipo"
              items={RECORD_TYPE_OPTIONS}
              onChange={(value) => setRecordType(value as RecordType)}
            />
            <Field label="Fecha del hecho *">
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="bg-card border"
              />
            </Field>
          </div>

          {recordType === "FOLLOW_UP" && (
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Agente responsable *"
                value={agentId}
                placeholder="Seleccionar agente"
                items={agentItems}
                onChange={setAgentId}
              />
              <SelectField
                label="Canal"
                value={followUpType}
                placeholder="Seleccionar canal"
                items={FOLLOW_UP_TYPE_OPTIONS}
                onChange={(value) =>
                  setFollowUpType(
                    value as CreateHistoricalFollowUpInput["type"],
                  )
                }
              />
              <SelectField
                label="Propósito"
                value={purpose}
                placeholder="Seleccionar propósito"
                items={PURPOSE_OPTIONS}
                onChange={(value) =>
                  setPurpose(value as CreateHistoricalFollowUpInput["purpose"])
                }
              />
              <SelectField
                label="Estado"
                value={followUpStatus}
                placeholder="Seleccionar estado"
                items={FOLLOW_UP_STATUS_OPTIONS}
                onChange={(value) =>
                  setFollowUpStatus(
                    value as CreateHistoricalFollowUpInput["status"],
                  )
                }
              />
              <div className="md:col-span-2">
                <Field label="Notas">
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Contexto del seguimiento"
                  />
                </Field>
              </div>
            </div>
          )}

          {recordType === "REMINDER" && (
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Agente asignado *"
                value={agentId}
                placeholder="Seleccionar agente"
                items={agentItems}
                onChange={setAgentId}
              />
              <SelectField
                label="Estado"
                value={reminderStatus}
                placeholder="Seleccionar estado"
                items={REMINDER_STATUS_OPTIONS}
                onChange={(value) =>
                  setReminderStatus(
                    value as CreateHistoricalReminderInput["status"],
                  )
                }
              />
              <SelectField
                label="Tipo"
                value={reminderKind}
                placeholder="Seleccionar tipo"
                items={[
                  { value: "GENERIC", label: "General" },
                  { value: "MEDICAL_APPOINTMENT", label: "Cita médica" },
                ]}
                onChange={(value) =>
                  setReminderKind(
                    value as NonNullable<CreateHistoricalReminderInput["kind"]>,
                  )
                }
              />
              {reminderKind === "MEDICAL_APPOINTMENT" && (
                <SelectField
                  label="Cita relacionada *"
                  value={medicalAppointmentId}
                  placeholder="Seleccionar cita"
                  items={medicalAppointmentItems}
                  onChange={setMedicalAppointmentId}
                />
              )}
              <div className="md:col-span-2">
                <Field label="Descripción *">
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Qué debía recordarse"
                  />
                </Field>
              </div>
            </div>
          )}

          {recordType === "MEDICAL_APPOINTMENT" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Especialidad *">
                <Input
                  value={specialty}
                  onChange={(event) => setSpecialty(event.target.value)}
                  placeholder="Oncología"
                  className="bg-card border"
                />
              </Field>
              <SelectField
                label="Estado"
                value={appointmentStatus}
                placeholder="Seleccionar estado"
                items={APPOINTMENT_STATUS_OPTIONS}
                onChange={(value) =>
                  setAppointmentStatus(
                    value as CreateHistoricalMedicalAppointmentInput["status"],
                  )
                }
              />
              <Field label="Hora (opcional)">
                <Input
                  type="time"
                  value={appointmentTime}
                  onChange={(event) => setAppointmentTime(event.target.value)}
                  className="bg-card border"
                />
              </Field>
            </div>
          )}

          {recordType === "PSYCHOONCOLOGY_APPOINTMENT" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Número de sesión *">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={sessionNumber}
                  onChange={(event) => setSessionNumber(event.target.value)}
                  className="bg-card border"
                />
              </Field>
              <SelectField
                label="Modalidad"
                value={modality}
                placeholder="Seleccionar modalidad"
                items={MODALITY_OPTIONS}
                onChange={(value) =>
                  setModality(
                    value as CreateHistoricalPsychooncologyAppointmentInput["modality"],
                  )
                }
              />
              <SelectField
                label="Estado"
                value={psychoStatus}
                placeholder="Seleccionar estado"
                items={PSYCHO_STATUS_OPTIONS}
                onChange={(value) =>
                  setPsychoStatus(
                    value as CreateHistoricalPsychooncologyAppointmentInput["status"],
                  )
                }
              />
              <SelectField
                label="Voluntario original"
                value={volunteerId}
                placeholder="Seleccionar voluntario"
                items={volunteerItems}
                onChange={setVolunteerId}
              />
              <div className="md:col-span-2">
                <Field label="Notas de programación">
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Observaciones de la sesión"
                  />
                </Field>
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            {editingDraft && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  resetForm()
                  onCancelEdit()
                }}
              >
                Cancelar edición
              </Button>
            )}
            <Button type="submit">
              {editingDraft ? "Actualizar borrador" : "Añadir al borrador"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function HistoricalRecordsPanel({
  patientId,
  enrollmentFollowUpId,
}: {
  patientId: string
  enrollmentFollowUpId?: string | null
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<HistoricalRecordDraft[]>([])
  const [editingDraft, setEditingDraft] =
    useState<HistoricalRecordDraft | null>(null)
  const [selectedFollowUpId, setSelectedFollowUpId] = useState(
    enrollmentFollowUpId ?? "",
  )
  const patientQuery = useQuery({
    queryKey: ["patient-profile", patientId],
    queryFn: () => patientsApi.getById(patientId),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
  const enrollmentsQuery = useQuery({
    queryKey: ["patient-enrollments", patientId],
    queryFn: () => enrollmentsApi.listByPatient(patientId),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
  const timelineQuery = useQuery({
    queryKey: ["patient-timeline", patientId],
    queryFn: () => patientTimelineApi.list(patientId),
    enabled: Boolean(patientId),
  })

  const enrollmentFollowUpIds = new Set(
    (enrollmentsQuery.data ?? []).map((enrollment) => enrollment.followUpId),
  )
  const followUpEvents =
    timelineQuery.data?.data.filter((event) => event.kind === "FOLLOW_UP") ?? []
  const followUpItems = [
    ...(enrollmentsQuery.data ?? []).map((enrollment) => ({
      value: enrollment.followUpId,
      label: `Enrolamiento · ${formatDate(enrollment.enrolledOn)}`,
    })),
    ...followUpEvents
      .filter((event) => !enrollmentFollowUpIds.has(event.followUpId))
      .map((event) => ({
        value: event.followUpId,
        label: `${optionLabel(PURPOSE_OPTIONS, event.purpose)} · ${formatDate(event.occurredAt)}`,
      })),
  ]
  const defaultFollowUpId = followUpItems[0]?.value

  const effectiveFollowUpId =
    selectedFollowUpId || enrollmentFollowUpId || defaultFollowUpId || ""
  const selectableFollowUpItems =
    effectiveFollowUpId &&
    !followUpItems.some((item) => item.value === effectiveFollowUpId)
      ? [
          ...followUpItems,
          { value: effectiveFollowUpId, label: "Seguimiento seleccionado" },
        ]
      : followUpItems

  const saveMutation = useMutation<unknown, Error, HistoricalRecordDraft>({
    mutationFn: async (draft: HistoricalRecordDraft) => {
      if (draft.type === "FOLLOW_UP")
        return historicalRecordsApi.createFollowUp(draft.input)
      if (draft.type === "REMINDER")
        return historicalRecordsApi.createReminder(draft.input)
      if (draft.type === "MEDICAL_APPOINTMENT") {
        return historicalRecordsApi.createMedicalAppointment(draft.input)
      }
      return historicalRecordsApi.createPsychooncologyAppointment(draft.input)
    },
    onSuccess: (result, savedDraft) => {
      setDrafts((current) =>
        current.filter((draft) => draft.id !== savedDraft.id),
      )
      if (editingDraft?.id === savedDraft.id) setEditingDraft(null)
      if (
        savedDraft.type === "FOLLOW_UP" &&
        result &&
        typeof result === "object" &&
        "id" in result &&
        typeof result.id === "string"
      ) {
        setSelectedFollowUpId(result.id)
      }
      void queryClient.invalidateQueries({
        queryKey: ["patient-timeline", patientId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["patient-medical-appointments", patientId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["patient-enrollments", patientId],
      })
      toast.success("Registro histórico guardado")
    },
    onError: (cause: Error) => {
      toast.error("No se pudo guardar el registro histórico", {
        description: cause.message,
      })
    },
  })

  function upsertDraft(draft: HistoricalRecordDraft) {
    setDrafts((current) => {
      const existingIndex = current.findIndex((item) => item.id === draft.id)
      if (existingIndex === -1) return [...current, draft]
      return current.map((item) => (item.id === draft.id ? draft : item))
    })
    setEditingDraft(null)
    toast.success("Borrador actualizado")
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2 gap-1.5 text-xs"
            onClick={() => navigate("/carga-historica")}
          >
            <ArrowLeft className="size-3.5" />
            Buscar otro paciente
          </Button>
          <p className="text-primary mb-1 text-[10px] font-bold tracking-[0.18em] uppercase">
            Carga histórica
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Perfil histórico
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Revise la historia registrada y agregue hechos anteriores sin crear
            actividad operativa futura.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={() => navigate("/carga-historica/nuevo")}
        >
          <Plus className="size-4" />
          Nuevo paciente histórico
        </Button>
      </div>

      {patientQuery.isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" /> Cargando perfil...
        </div>
      )}
      {patientQuery.isError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="text-destructive p-4 text-sm">
            No se pudo cargar el paciente. Regrese a la búsqueda e inténtelo de
            nuevo.
          </CardContent>
        </Card>
      )}
      {patientQuery.data && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
              <UserRound className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{patientQuery.data.fullName}</p>
              <p className="text-muted-foreground text-xs">
                {patientQuery.data.dni
                  ? `DNI ${patientQuery.data.dni}`
                  : "Sin DNI registrado"}
                {patientQuery.data.primaryPhone
                  ? ` · ${patientQuery.data.primaryPhone}`
                  : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="text-primary size-4" />
            Seguimiento de contexto
          </CardTitle>
          <CardDescription>
            Seleccione el seguimiento al que pertenecen las citas, sesiones y
            recordatorios que agregue a continuación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectableFollowUpItems.length > 0 ? (
            <Select
              items={selectableFollowUpItems}
              value={effectiveFollowUpId}
              onValueChange={(value) => setSelectedFollowUpId(value ?? "")}
            >
              <SelectTrigger className="bg-card w-full border">
                <SelectValue placeholder="Seleccionar seguimiento..." />
              </SelectTrigger>
              <SelectContent>
                {selectableFollowUpItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
              Este paciente todavía no tiene seguimientos disponibles. Agregue
              primero un seguimiento para poder relacionar citas o sesiones.
            </p>
          )}
        </CardContent>
      </Card>

      <HistoricalRecordComposer
        key={editingDraft?.id ?? "new"}
        patientId={patientId}
        enrollmentFollowUpId={effectiveFollowUpId || null}
        editingDraft={editingDraft}
        onDraft={upsertDraft}
        onCancelEdit={() => setEditingDraft(null)}
      />

      {drafts.length > 0 && (
        <Card className="border-amber-400/30 bg-amber-400/[0.03]">
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-amber-600" />
              Revisión de borradores
              <Badge variant="secondary">{drafts.length}</Badge>
            </CardTitle>
            <CardDescription>
              Estos registros todavía no están guardados. Revise sus fechas y
              relaciones antes de persistirlos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-background flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{draftTitle(draft)}</p>
                    <Badge variant="outline">
                      {draftDate(draft)
                        ? formatDate(draftDate(draft)!)
                        : "Sin fecha"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 truncate text-xs">
                    {draftSummary(draft)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingDraft(draft)}
                    disabled={saveMutation.isPending}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDrafts((current) =>
                        current.filter((item) => item.id !== draft.id),
                      )
                    }
                    disabled={saveMutation.isPending}
                  >
                    <Trash2 className="size-3.5" />
                    Eliminar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => saveMutation.mutate(draft)}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending && (
                      <Loader2 className="size-3.5 animate-spin" />
                    )}
                    <Save className="size-3.5" />
                    Guardar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="text-primary size-4" />
            Línea de tiempo
          </CardTitle>
          <CardDescription>
            Los registros aparecen ordenados por la fecha efectiva del hecho
            cuando está disponible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timelineQuery.isLoading && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" /> Cargando historial...
            </div>
          )}
          {timelineQuery.isError && (
            <p className="text-destructive text-sm">
              No se pudo cargar la línea de tiempo.
            </p>
          )}
          {!timelineQuery.isLoading &&
            !timelineQuery.isError &&
            timelineQuery.data?.data.length === 0 && (
              <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
                <ClipboardList className="size-8 opacity-50" />
                Todavía no hay registros visibles para este paciente.
              </div>
            )}
          {timelineQuery.data?.data.length ? (
            <div className="before:bg-border relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-px">
              {timelineQuery.data.data.map((event) => (
                <div
                  key={`${event.kind}-${event.id}`}
                  className="relative flex gap-3 pl-1"
                >
                  <div className="border-background bg-primary ring-primary/30 z-10 mt-1 flex size-3 shrink-0 rounded-full border-2 ring-1" />
                  <div className="bg-card min-w-0 flex-1 rounded-xl border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{eventTitle(event)}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{eventStatus(event)}</Badge>
                        <span className="text-muted-foreground text-xs">
                          {event.occurredAtIsApproximate &&
                            "Fecha aproximada · "}
                          {formatDate(event.occurredAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {eventDescription(event)}
                    </p>
                    {event.kind === "FOLLOW_UP" &&
                      event.outcomes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {event.outcomes.map((outcome) => (
                            <Badge
                              key={`${outcome.type}-${outcome.recordId}`}
                              variant="secondary"
                            >
                              {outcome.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    <div className="text-muted-foreground/80 mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t pt-2 text-[11px]">
                      <span>
                        Creado en CRM: {formatDateTime(event.createdAt)}
                      </span>
                      <span>
                        Actualizado: {formatDateTime(event.updatedAt)}
                      </span>
                      {event.historicalLoadedByEmail && (
                        <span>
                          Usuario de carga: {event.historicalLoadedByEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
