import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { QuestionForm } from "@/components/ds/question-form"
import { yes, type Group, type Values } from "@/components/ds/questions"
import { compact } from "@/pages/pacientes/[id]/seguimientos/_components/ficha/answers"
import type { AddMedicalAppointmentRequest } from "@/types"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import { SectionBlock } from "../section-block"

const groups: Group[] = [
  {
    title: "Consultas",
    questions: [
      { id: "attends", label: "¿Actualmente asiste a sus consultas médicas?", type: "yesno", required: true, wide: true },
      { id: "center", label: "Establecimiento de las consultas médicas", type: "select", catalog: HEALTH_CENTER, required: true, wide: true, showIf: yes("attends") },
      { id: "lastDate", label: "Si asiste: ¿cuándo fue su última consulta?", type: "date", showIf: yes("attends") },
      { id: "specialty", label: "Especialidad de la consulta", type: "select", catalog: "medical_specialty", required: true, showIf: yes("attends") },
      { id: "nextDate", label: "¿Cuándo es su siguiente consulta?", type: "date", showIf: yes("attends") },
      { id: "nextSpecialty", label: "Especialidad de la siguiente consulta", type: "select", catalog: "medical_specialty", showIf: yes("attends") },
      { id: "difficulties", label: "¿Tiene alguna dificultad para sus consultas médicas?", type: "textarea", showIf: yes("attends") },
      { id: "absentNote", label: "Notas sobre la no asistencia a consultas médicas", type: "textarea", required: true, showIf: (v) => v.attends === "no" },
    ],
  },
]

const EMPTY: AddMedicalAppointmentRequest = {}

export function ConsultsSection({ embedded = false }: { embedded?: boolean }) {
  const { draft, updateDraft } = useEnrollmentStore()
  const meta = draft.enrollmentMetadata
  const appointment = draft.medicalAppointments[0] ?? EMPTY
  const values = compact({
    attends: meta.currentlyAttendingConsultations === true ? "yes" : meta.currentlyAttendingConsultations === false ? "no" : null,
    center: appointment.healthCenterId,
    lastDate: appointment.appointmentDate,
    specialty: appointment.specialty,
    nextDate: appointment.nextAppointmentDate,
    nextSpecialty: appointment.nextAppointmentSpecialty,
    difficulties: appointment.difficulties,
    absentNote: meta.notAttendingConsultationsNote,
  })

  function onChange(id: string, value: string | null) {
    if (id === "attends") {
      const attends = value === "yes"
      updateDraft({
        enrollmentMetadata: {
          ...meta,
          currentlyAttendingConsultations: value == null ? null : attends,
          notAttendingConsultationsNote: attends ? null : meta.notAttendingConsultationsNote,
        },
        medicalAppointments: attends ? [{ ...appointment }] : [],
      })
      return
    }
    if (id === "absentNote") {
      updateDraft({ enrollmentMetadata: { ...meta, notAttendingConsultationsNote: value } })
      return
    }
    const patch: Partial<AddMedicalAppointmentRequest> = {
      center: { healthCenterId: value },
      lastDate: { appointmentDate: value },
      specialty: { specialty: value },
      nextDate: { nextAppointmentDate: value },
      nextSpecialty: { nextAppointmentSpecialty: value },
      difficulties: { difficulties: value },
    }[id] ?? {}
    updateDraft({ medicalAppointments: [{ ...appointment, ...patch }] })
  }

  return (
    <SectionBlock embedded={embedded} title="Consultas médicas">
      <QuestionForm groups={groups} values={values as Values} showMissing={false} onChange={onChange} />
    </SectionBlock>
  )
}
