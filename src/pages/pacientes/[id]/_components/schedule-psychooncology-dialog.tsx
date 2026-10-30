import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Brain } from "lucide-react"
import { toast } from "sonner"
import { volunteersApi } from "@/api/volunteers"
import { patientsApi } from "@/api/patients"
import type {
  CreatePsychooncologyAppointmentInput,
  PsychooncologyAppointment,
  ReschedulePsychooncologyAppointmentInput,
  UpdatePsychooncologyAppointmentInput,
} from "@/api/psychooncology-appointments"
import { Button } from "@/components/ds/button"
import { Modal } from "@/components/ds/modal"
import { QuestionForm } from "@/components/ds/question-form"
import { is, progress, type Group, type Values } from "@/components/ds/questions"
import { isAvailabilitySlotInFuture } from "@/lib/calendar-helpers"
import { compact } from "../seguimientos/_components/ficha/answers"
import { ENROLLMENT_RATING_OPTIONS } from "./enrollment-rating-options"

export type SchedulePsychooncologySubmitInput =
  | { mode: "create"; input: CreatePsychooncologyAppointmentInput }
  | { mode: "update"; id: string; input: UpdatePsychooncologyAppointmentInput }
  | {
      mode: "reschedule"
      id: string
      input: ReschedulePsychooncologyAppointmentInput
      update?: UpdatePsychooncologyAppointmentInput
    }

interface SchedulePsychooncologyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  followUpId?: string
  ownVolunteerId?: string
  appointment?: PsychooncologyAppointment | null
  additionalSession?: boolean
  completeIntent?: boolean
  isPending: boolean
  onSubmit: (payload: SchedulePsychooncologySubmitInput) => Promise<void>
}

type ReminderMode = NonNullable<CreatePsychooncologyAppointmentInput["reminderMode"]>

const NEW_COMPANION = "new"

/** "Jue 5 nov, 15:00 a 16:00". */
function slotLabel(slot: { date: string; startTime: string; endTime: string }) {
  const date = new Date(`${slot.date}T12:00:00`).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" }).replace(".", "")
  return `${date.charAt(0).toUpperCase()}${date.slice(1)}, ${slot.startTime.slice(0, 5)} a ${slot.endTime.slice(0, 5)}`
}

function toDateTimeLocal(iso: string) {
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function SchedulePsychooncologyDialog(props: SchedulePsychooncologyDialogProps) {
  if (!props.open) return null
  return <ScheduleModal {...props} />
}

function ScheduleModal({ onOpenChange, patientId, followUpId, ownVolunteerId, appointment: a, additionalSession = false, completeIntent = false, isPending, onSubmit }: SchedulePsychooncologyDialogProps) {
  const isEdit = Boolean(a)
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState<Values>(() =>
    compact({
      psFor: a?.beneficiaryType === "COMPANION" ? "companion" : "patient",
      companion: a?.companionId,
      volunteer: ownVolunteerId ?? a?.volunteerId,
      slot: a?.availabilityId,
      modality: a?.modality ?? "CALL",
      zoom: a?.zoomLink,
      reason: a?.schedulingNotes,
      reminder: a?.reminderMode ?? "ONE_DAY",
      remindAt: a?.remindAt ? toDateTimeLocal(a.remindAt) : null,
      rating: a?.satisfactionRating ? String(a.satisfactionRating) : null,
      comment: a?.satisfactionComment,
    }),
  )

  const volunteers = useQuery({ queryKey: ["volunteers"], queryFn: volunteersApi.list, staleTime: 300_000 })
  const slots = useQuery({ queryKey: ["volunteer-availability", values.volunteer], queryFn: () => volunteersApi.listAvailability(values.volunteer!), enabled: Boolean(values.volunteer) })
  const companions = useQuery({ queryKey: ["patient-companions", patientId], queryFn: () => patientsApi.companions(patientId), staleTime: 30_000 })

  const volunteerOptions = (volunteers.data ?? []).filter((v) => v.isActive || v.id === values.volunteer).map((v) => ({ value: v.id, label: `${v.firstName} ${v.lastName}`, sublabel: v.specialty }))
  const slotOptions = (slots.data ?? [])
    .filter((s) => (s.status === "AVAILABLE" && isAvailabilitySlotInFuture(s)) || s.id === a?.availabilityId)
    .sort((x, y) => `${x.date}${x.startTime}`.localeCompare(`${y.date}${y.startTime}`))
    .map((s) => ({ value: s.id, label: slotLabel(s) }))
  const companionOptions = (companions.data ?? []).map((l) => ({ value: l.companionId, label: l.companion?.fullName ?? l.companionDisplayName ?? "Acompañante" }))
  if (a?.companionId && !companionOptions.some((o) => o.value === a.companionId)) companionOptions.unshift({ value: a.companionId, label: a.companionFullName ?? "Acompañante" })

  const scheduling: Group[] = [
    {
      title: "Beneficiario",
      // Quién recibe la sesión no cambia una vez agendada.
      showIf: () => !isEdit,
      questions: [
        {
          id: "psFor",
          label: "¿La sesión es para…?",
          type: "choice",
          required: true,
          wide: true,
          options: [
            { value: "patient", label: "El paciente" },
            { value: "companion", label: "Un acompañante" },
            { value: NEW_COMPANION, label: "Otro familiar" },
          ],
        },
        { id: "companion", label: "Acompañante", type: "select", required: true, placeholder: "Seleccionar acompañante", options: companionOptions, showIf: is("psFor", "companion") },
        { id: "name", label: "Nombre completo", type: "text", required: true, placeholder: "Nombre y apellido", showIf: is("psFor", NEW_COMPANION) },
        { id: "relationship", label: "Parentesco", type: "select", catalog: "companion_relationship", required: true, showIf: is("psFor", NEW_COMPANION) },
        { id: "phone", label: "Teléfono", type: "text", required: true, placeholder: "987654321", showIf: is("psFor", NEW_COMPANION) },
      ],
    },
    {
      title: "Sesión",
      description: additionalSession ? "Se registra como sesión adicional del ciclo." : undefined,
      questions: [
        ...(ownVolunteerId ? [] : [{ id: "volunteer", label: "Psicooncólogo", type: "select" as const, required: true, placeholder: "Seleccionar psicooncólogo", options: volunteerOptions }]),
        {
          id: "slot",
          label: "Horario disponible",
          type: "choice",
          required: true,
          wide: true,
          options: slotOptions,
          hint: slots.isLoading ? "Cargando horarios…" : slotOptions.length ? "Horarios libres del psicooncólogo." : "No tiene horarios libres. Elige a otro psicooncólogo.",
          showIf: (v) => Boolean(v.volunteer),
        },
        {
          id: "modality",
          label: "Modalidad",
          type: "choice",
          required: true,
          wide: true,
          options: [
            { value: "CALL", label: "Llamada" },
            { value: "VIDEO_CALL", label: "Videollamada" },
          ],
        },
        { id: "zoom", label: "Link de Zoom (opcional)", type: "text", placeholder: "https://zoom.us/j/…", wide: true, showIf: is("modality", "VIDEO_CALL") },
        { id: "reason", label: "Motivo de la derivación", type: "textarea", placeholder: "Motivo de la derivación o contexto para la sesión" },
      ],
    },
    {
      title: "Recordatorio",
      questions: [
        {
          id: "reminder",
          label: "¿Cuándo se le avisa?",
          type: "choice",
          required: true,
          wide: true,
          options: [
            { value: "ONE_DAY", label: "1 día antes" },
            { value: "TWO_HOURS", label: "2 horas antes" },
            { value: "CUSTOM", label: "Otra fecha" },
            { value: "MANUAL", label: "Le aviso yo" },
          ],
        },
        { id: "remindAt", label: "Fecha y hora del aviso", type: "datetime", required: true, showIf: is("reminder", "CUSTOM") },
      ],
    },
  ]
  const survey: Group[] = [
    {
      title: "Encuesta de satisfacción",
      questions: [
        { id: "rating", label: "¿Cómo calificó la sesión?", type: "choice", options: [...ENROLLMENT_RATING_OPTIONS], wide: true },
        { id: "comment", label: "Comentario", type: "textarea", placeholder: "Lo que dijo el paciente sobre la sesión" },
      ],
    },
  ]
  const groups = completeIntent ? survey : a?.status === "COMPLETED" ? [...scheduling, ...survey] : scheduling
  const { missingRequired } = progress(groups, values)
  const busy = isPending || submitting

  async function resolveCompanion(): Promise<string | null> {
    if (values.psFor === "patient") return null
    if (values.psFor === "companion") return values.companion ?? null
    const companion = await patientsApi.createCompanion(patientId, { fullName: values.name!.trim(), primaryPhone: values.phone!.trim(), relationship: values.relationship! })
    await queryClient.invalidateQueries({ queryKey: ["patient-companions", patientId] })
    return companion.id
  }

  async function submit() {
    const volunteerId = values.volunteer
    const slotId = values.slot
    if (!volunteerId || !slotId) return
    const reminderMode = values.reminder as ReminderMode
    const remindAt = reminderMode === "CUSTOM" && values.remindAt ? new Date(values.remindAt).toISOString() : undefined
    const zoom = values.modality === "VIDEO_CALL" ? values.zoom?.trim() || null : null
    const notes = values.reason?.trim() || null
    const modality = values.modality as "CALL" | "VIDEO_CALL"

    setSubmitting(true)
    try {
      let companionId: string | null
      try {
        companionId = isEdit ? (a!.companionId ?? null) : await resolveCompanion()
      } catch (error) {
        toast.error("No se pudo agregar el acompañante", { description: error instanceof Error ? error.message : "Error inesperado" })
        return
      }

      if (a) {
        const slotChanged = !completeIntent && slotId !== a.availabilityId
        const patch: UpdatePsychooncologyAppointmentInput = {}
        if (!slotChanged) {
          patch.modality = modality
          patch.zoomLink = zoom
          patch.schedulingNotes = notes
          patch.reminderMode = reminderMode
          if (remindAt) patch.remindAt = remindAt
        }
        if (completeIntent) {
          patch.status = "COMPLETED"
          if (values.rating) patch.satisfactionRating = Number(values.rating)
          if (values.comment?.trim()) patch.satisfactionComment = values.comment.trim()
        }
        if (slotChanged) {
          await onSubmit({
            mode: "reschedule",
            id: a.id,
            input: { availabilityId: slotId, modality, zoomLink: zoom ?? undefined, schedulingNotes: notes ?? undefined, reminderMode, remindAt },
            update: Object.keys(patch).length > 0 ? patch : undefined,
          })
        } else {
          await onSubmit({ mode: "update", id: a.id, input: patch })
        }
      } else {
        await onSubmit({
          mode: "create",
          input: {
            patientId,
            beneficiaryType: companionId ? "COMPANION" : "PATIENT",
            companionId,
            availabilityId: slotId,
            followUpId,
            modality,
            reminderMode,
            remindAt,
            isAdditionalSession: additionalSession || undefined,
            zoomLink: zoom ?? undefined,
            schedulingNotes: notes ?? undefined,
          },
        })
      }
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => !busy && onOpenChange(false)
  return (
    <Modal
      open
      onClose={close}
      icon={Brain}
      title={completeIntent ? "Completar sesión de psicooncología" : isEdit ? "Editar sesión de psicooncología" : "Agendar sesión de psicooncología"}
      description={completeIntent ? "Registra la encuesta y confirma la sesión" : isEdit ? "Cambia el horario, la modalidad o el aviso" : followUpId ? "Queda vinculada al seguimiento actual" : "Beneficiario, psicooncólogo y horario"}
      footer={
        <>
          <span className="mr-auto self-center text-[13px] text-zinc-500">{missingRequired ? (missingRequired === 1 ? "Falta 1 dato obligatorio" : `Faltan ${missingRequired} datos obligatorios`) : null}</span>
          <Button onClick={close} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="dark" onClick={submit} disabled={missingRequired > 0 || busy}>
            {busy ? "Guardando…" : completeIntent ? "Completar sesión" : isEdit ? "Guardar cambios" : "Agendar sesión"}
          </Button>
        </>
      }
    >
      <QuestionForm
        framed
        groups={groups}
        values={values}
        onChange={(id, v) => setValues((prev) => ({ ...prev, [id]: v, ...(id === "volunteer" ? { slot: null } : {}) }))}
      />
    </Modal>
  )
}
