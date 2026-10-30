import { Stethoscope } from "lucide-react"
import type { CompleteReminderInput, Reminder } from "@/api/reminders"
import { FormModal } from "@/components/ds/form-modal"
import { is, type Group } from "@/components/ds/questions"
import { catalogLabel, useCatalog } from "@/hooks/use-catalog"
import { text, toBool } from "../seguimientos/_components/ficha/answers"

type AppointmentOutcomeStatus = "COMPLETED" | "NO_ANSWER" | "CANCELLED"

interface CompleteMedicalReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reminder: Reminder | null
  isPending: boolean
  onConfirm: (input: CompleteReminderInput) => void
}

const attended = is("status", "COMPLETED")

const groups: Group[] = [
  {
    title: "Resultado",
    questions: [
      {
        id: "status",
        label: "¿Qué pasó con la cita?",
        type: "choice",
        required: true,
        wide: true,
        options: [
          { value: "COMPLETED", label: "Asistió" },
          { value: "NO_ANSWER", label: "No asistió" },
          { value: "CANCELLED", label: "Se canceló" },
        ],
      },
      { id: "difficulties", label: "Dificultades", type: "text", placeholder: "Barreras para asistir o comentarios", wide: true },
      { id: "changeReason", label: "Motivo del registro", type: "text", required: true, placeholder: "Ej: confirmado con el paciente", wide: true },
    ],
  },
  {
    title: "Referencia y próxima cita",
    showIf: attended,
    questions: [
      { id: "sheet", label: "¿Recibió hoja de referencia?", type: "yesno", required: true, wide: true },
      { id: "referredTo", label: "¿A dónde lo refirieron?", type: "text", required: true, placeholder: "Hospital o especialidad", wide: true, showIf: is("sheet", "yes") },
      { id: "noSheetReason", label: "¿Por qué no se la dieron?", type: "text", wide: true, showIf: is("sheet", "no") },
      { id: "nextDate", label: "Fecha de la próxima cita", type: "date" },
      { id: "nextSpecialty", label: "Especialidad de la próxima cita", type: "text" },
      { id: "viaSepa", label: "¿Asistió a la consulta de atención primaria a partir del soporte de SEPA?", type: "yesno", wide: true },
      { id: "referredViaSepa", label: "¿Logró ser referido a mayor complejidad a partir del soporte de SEPA?", type: "yesno", wide: true },
    ],
  },
]

export function CompleteMedicalReminderDialog({ open, onOpenChange, reminder, isPending, onConfirm }: CompleteMedicalReminderDialogProps) {
  const { data: specialties = [] } = useCatalog("medical_specialty")
  if (!open || !reminder) return null
  const specialty = reminder.medicalAppointment?.specialty
  return (
    <FormModal
      key={reminder.id}
      icon={Stethoscope}
      title="Completar cita médica"
      description={specialty ? `Resultado de la cita de ${catalogLabel(specialties, specialty).toLowerCase()}` : "Resultado de la cita médica"}
      groups={groups}
      submitLabel="Completar cita"
      pending={isPending}
      onClose={() => onOpenChange(false)}
      onSubmit={(v) => {
        const status = v.status as AppointmentOutcomeStatus
        const sheet = v.sheet === "yes"
        const viaSepa = toBool(v.viaSepa)
        const referredViaSepa = toBool(v.referredViaSepa)
        onConfirm({
          medicalAppointment: {
            status,
            changeReason: v.changeReason!.trim(),
            difficulties: text(v.difficulties),
            ...(status === "COMPLETED"
              ? {
                  hasReferralSheet: sheet,
                  referredTo: sheet ? text(v.referredTo) : undefined,
                  referralNotProvidedReason: sheet ? undefined : text(v.noSheetReason),
                  nextAppointmentDate: v.nextDate ?? undefined,
                  nextAppointmentSpecialty: text(v.nextSpecialty),
                  ...(viaSepa !== undefined ? { attendedViaSepa: viaSepa } : {}),
                  ...(referredViaSepa !== undefined ? { referredViaSepa } : {}),
                }
              : {}),
          },
        })
      }}
    />
  )
}
