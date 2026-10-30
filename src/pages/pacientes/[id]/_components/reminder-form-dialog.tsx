import { Bell } from "lucide-react"
import { toast } from "sonner"
import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { FormModal } from "@/components/ds/form-modal"
import { is, type Group, type Question } from "@/components/ds/questions"
import type { MedicalAppointmentFieldsValue } from "@/components/medical-appointment-fields"
import type { Agent } from "@/api/agents"
import type { Reminder, ReminderChannel, ReminderKind, ReminderLead } from "@/api/reminders"
import { REMINDER_CHANNEL_ITEMS, REMINDER_LEAD_ITEMS } from "@/lib/reminder-labels"
import { compact, fromBool } from "../seguimientos/_components/ficha/answers"

function toLocalDateTime(date: string | null) {
  if (!date) return ""
  const value = new Date(date)
  const timezoneOffset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

export interface ReminderFormValues {
  kind: ReminderKind
  description: string
  dueAt: string
  assignedAgentId?: string
  channel: ReminderChannel
  lead: ReminderLead
  remindAt: string
  medicalAppointment: MedicalAppointmentFieldsValue
}

interface ReminderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reminder?: Reminder | null
  agents?: Agent[]
  requiresAgentSelection?: boolean
  hideAgentSelection?: boolean
  isPending: boolean
  draftMode?: boolean
  onSave: (values: ReminderFormValues) => void
}

const medical = is("kind", "MEDICAL_APPOINTMENT")

function groups(isEditing: boolean, agents: Agent[] | null): Group[] {
  const appointment: Question[] = [
    // La especialidad identifica la cita: no se cambia al editar.
    ...(isEditing ? [] : [{ id: "specialty", label: "Especialidad", type: "select" as const, catalog: "medical_specialty", required: true, showIf: medical }]),
    { id: "center", label: "Establecimiento", type: "select", catalog: HEALTH_CENTER, showIf: medical },
    { id: "first", label: "¿Es su primera consulta?", type: "yesno", showIf: medical },
  ]
  return [
    {
      title: "Recordatorio",
      questions: [
        ...(isEditing
          ? []
          : [
              {
                id: "kind",
                label: "Tipo",
                type: "choice" as const,
                required: true,
                wide: true,
                options: [
                  { value: "MEDICAL_APPOINTMENT", label: "Cita médica" },
                  { value: "GENERIC", label: "Genérico" },
                ],
              },
            ]),
        ...appointment,
        { id: "dueAt", label: "Fecha y hora", type: "datetime", required: true },
        { id: "description", label: "Descripción", type: "text", required: true, placeholder: "Ej: hemograma completo", showIf: is("kind", "GENERIC") },
        { id: "description", label: "Descripción", type: "text", placeholder: "Opcional, se arma con la especialidad", showIf: medical },
      ],
    },
    {
      title: "Aviso",
      questions: [
        { id: "channel", label: "Canal", type: "choice", required: true, options: REMINDER_CHANNEL_ITEMS, wide: true },
        { id: "lead", label: "¿Con cuánta anticipación?", type: "choice", required: true, options: REMINDER_LEAD_ITEMS, wide: true, showIf: medical },
        { id: "remindAt", label: "Fecha y hora del aviso", type: "datetime", required: true, showIf: (v) => medical(v) && v.lead === "CUSTOM" },
        ...(agents ? [{ id: "agentId", label: "Agente responsable", type: "select" as const, required: true, options: agents.map((a) => ({ value: a.id, label: a.fullName })) }] : []),
      ],
    },
  ]
}

export function ReminderFormDialog({
  open,
  onOpenChange,
  reminder,
  agents = [],
  requiresAgentSelection = false,
  hideAgentSelection = false,
  isPending,
  draftMode = false,
  onSave,
}: ReminderFormDialogProps) {
  if (!open) return null
  const isEditing = Boolean(reminder)
  const r = reminder
  const appointment = r?.medicalAppointment
  return (
    <FormModal
      icon={Bell}
      title={isEditing ? "Editar recordatorio" : "Nuevo recordatorio"}
      description={isEditing ? "Cambia la fecha, el aviso o el detalle" : "Cita médica o pendiente del paciente"}
      groups={groups(isEditing, requiresAgentSelection && !hideAgentSelection ? agents : null)}
      initial={compact({
        kind: r?.kind ?? "MEDICAL_APPOINTMENT",
        specialty: appointment?.specialty,
        center: appointment?.healthCenterId,
        first: appointment ? fromBool(appointment.isFirstConsultation) : null,
        dueAt: toLocalDateTime(r?.dueAt ?? null),
        description: r?.description,
        channel: r?.channel ?? "EMAIL",
        lead: r?.lead ?? "ONE_DAY",
        remindAt: toLocalDateTime(r?.remindAt ?? null),
        agentId: r?.assignedAgentId,
      })}
      submitLabel={isEditing ? "Guardar cambios" : draftMode ? "Agregar a la lista" : "Crear recordatorio"}
      footnote={draftMode ? "Se guardará al completar el seguimiento" : undefined}
      pending={isPending}
      onClose={() => onOpenChange(false)}
      onSubmit={(v) => {
        // Un recordatorio nuevo siempre es a futuro; lo pasado se registra en carga histórica.
        if (!isEditing && new Date(v.dueAt!) < new Date()) return toast.error("La fecha ya pasó. Elige una fecha y hora futuras.")
        onSave({
          kind: v.kind as ReminderKind,
          description: v.description?.trim() ?? "",
          dueAt: v.dueAt!,
          assignedAgentId: v.agentId ?? r?.assignedAgentId,
          channel: v.channel as ReminderChannel,
          lead: (v.lead as ReminderLead) ?? "ONE_DAY",
          remindAt: v.remindAt ?? "",
          medicalAppointment: {
            specialty: v.specialty ?? appointment?.specialty ?? "",
            healthCenterId: v.center ?? "",
            isFirstConsultation: v.first === "yes",
          },
        })
      }}
    />
  )
}
