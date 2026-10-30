import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell, Brain, CalendarPlus, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import type { Agent } from "@/api/agents"
import { patientsApi } from "@/api/patients"
import { volunteersApi } from "@/api/volunteers"
import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { Button } from "@/components/ds/button"
import { FormModal } from "@/components/ds/form-modal"
import { Modal } from "@/components/ds/modal"
import { QuestionForm } from "@/components/ds/question-form"
import { is, progress, type Group, type Values } from "@/components/ds/questions"
import { catalogLabel, useCatalog } from "@/hooks/use-catalog"
import { alertGroups } from "@/lib/alert-questions"
import { isAvailabilitySlotInFuture } from "@/lib/calendar-helpers"
import { followUpPurposeLabels, followUpTypeLabels } from "@/lib/follow-up-labels"
import { getLocalDateValue, type ScheduleFollowUpFormValues } from "../../_components/schedule-follow-up-schema"
import { compact, text } from "./ficha/answers"
import type { DerivedAction } from "./follow-up-actions"
import { useFollowUpDraftStore } from "../_store/follow-up-draft-store"

// Modales de las acciones que nacen del seguimiento. Lo que se completa queda en
// el borrador y se crea al completar el seguimiento.

const FOOTNOTE = "Se creará al completar el seguimiento"
const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }))

function nextGroups(agents: Agent[] | undefined, requiresAgent: boolean): Group[] {
  return [
    {
      title: "Siguiente seguimiento",
      questions: [
        { id: "date", label: "Fecha", type: "date", required: true },
        { id: "time", label: "Hora", type: "time", required: true },
        { id: "type", label: "Canal", type: "choice", required: true, options: options(followUpTypeLabels), wide: true },
        { id: "purpose", label: "Motivo", type: "select", required: true, options: options(followUpPurposeLabels) },
        ...(requiresAgent ? [{ id: "agentId", label: "Agente responsable", type: "select" as const, required: true, options: (agents ?? []).map((a) => ({ value: a.id, label: a.fullName })) }] : []),
        { id: "notes", label: "Notas", type: "textarea", placeholder: "Opcional" },
      ],
    },
  ]
}

const reminderGroups: Group[] = [
  {
    title: "Recordatorio",
    questions: [
      {
        id: "kind",
        label: "Tipo",
        type: "choice",
        required: true,
        wide: true,
        options: [
          { value: "MEDICAL_APPOINTMENT", label: "Cita médica" },
          { value: "GENERIC", label: "Genérico" },
        ],
      },
      { id: "specialty", label: "Especialidad", type: "select", catalog: "medical_specialty", required: true, showIf: is("kind", "MEDICAL_APPOINTMENT") },
      { id: "center", label: "Establecimiento", type: "select", catalog: HEALTH_CENTER, showIf: is("kind", "MEDICAL_APPOINTMENT") },
      { id: "first", label: "¿Es su primera consulta?", type: "yesno", showIf: is("kind", "MEDICAL_APPOINTMENT") },
      { id: "dueAt", label: "Fecha y hora", type: "datetime", required: true },
      { id: "description", label: "Descripción", type: "text", required: true, placeholder: "Ej: hemograma completo", showIf: is("kind", "GENERIC") },
      { id: "description", label: "Descripción", type: "text", placeholder: "Opcional, se arma con la especialidad", showIf: is("kind", "MEDICAL_APPOINTMENT") },
    ],
  },
]

type Props = {
  action: DerivedAction
  patientId: string
  followUpId: string
  agents: Agent[] | undefined
  requiresAgentSelection: boolean
  onClose: () => void
}

export function DerivedActionModal(props: Props) {
  const store = useFollowUpDraftStore()
  const { data: specialties = [] } = useCatalog("medical_specialty")
  const { action, onClose } = props

  if (action === "psico") return <PsychoModal {...props} />

  if (action === "alerta") {
    const a = store.alert
    return (
      <FormModal
        icon={TriangleAlert}
        title="Reportar incidencia hospitalaria"
        description="Medicinas, citas, trato o trámites"
        groups={alertGroups}
        initial={a ? { ...a } : { severity: "MEDIUM" }}
        submitLabel={a ? "Guardar cambios" : "Reportar incidencia"}
        footnote={FOOTNOTE}
        onClose={onClose}
        onSubmit={(v) => {
          if ((v.title ?? "").trim().length < 3) return toast.error("Escribe un título más claro")
          if ((v.description ?? "").trim().length < 5) return toast.error("Detalla un poco más el problema")
          store.setAlert({ healthCenterId: v.healthCenterId!, category: v.category!, severity: v.severity as "HIGH" | "MEDIUM" | "LOW", title: v.title!.trim(), description: v.description!.trim() })
          onClose()
        }}
      />
    )
  }

  if (action === "siguiente") {
    const n = store.nextFollowUp
    return (
      <FormModal
        icon={CalendarPlus}
        title="Agendar siguiente seguimiento"
        description="Fecha, canal y agente"
        groups={nextGroups(props.agents, props.requiresAgentSelection)}
        initial={n ? compact({ ...n }) : { type: "CALL", purpose: "FOLLOW_UP", time: "10:00" }}
        submitLabel={n ? "Guardar cambios" : "Agendar seguimiento"}
        footnote={FOOTNOTE}
        onClose={onClose}
        onSubmit={(v) => {
          if (v.date! < getLocalDateValue()) return toast.error("Elige una fecha de hoy en adelante")
          store.setNextFollowUp({ date: v.date!, time: v.time!, type: v.type as ScheduleFollowUpFormValues["type"], purpose: v.purpose as ScheduleFollowUpFormValues["purpose"], notes: text(v.notes), agentId: v.agentId ?? undefined })
          onClose()
        }}
      />
    )
  }

  return (
    <FormModal
      icon={Bell}
      title="Agregar recordatorio"
      description="Cita médica o tratamiento"
      groups={reminderGroups}
      initial={{ kind: "MEDICAL_APPOINTMENT" }}
      submitLabel="Agregar recordatorio"
      footnote={FOOTNOTE}
      onClose={onClose}
      onSubmit={(v) => {
        if (new Date(v.dueAt!).getTime() <= Date.now()) return toast.error("Elige una fecha y hora futuras")
        const medical = v.kind === "MEDICAL_APPOINTMENT"
        store.addReminder({
          kind: medical ? "MEDICAL_APPOINTMENT" : "GENERIC",
          description: text(v.description) ?? `Cita: ${catalogLabel(specialties, v.specialty)}`,
          dueAt: v.dueAt!,
          medicalAppointment: medical ? { specialty: v.specialty!, healthCenterId: v.center ?? undefined, isFirstConsultation: v.first === "yes" } : undefined,
        })
        onClose()
      }}
    />
  )
}

const NEW_COMPANION = "new"

/** "Jue 5 nov, 15:00". */
function slotLabel(slot: { date: string; startTime: string }) {
  const date = new Date(`${slot.date}T12:00:00`).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" }).replace(".", "")
  return `${date.charAt(0).toUpperCase()}${date.slice(1)}, ${slot.startTime.slice(0, 5)}`
}

/** Sesión de psicooncología: los horarios dependen del psicooncólogo elegido. */
function PsychoModal({ patientId, followUpId, onClose }: Props) {
  const queryClient = useQueryClient()
  const setPsico = useFollowUpDraftStore((s) => s.setPsico)
  const [values, setValues] = useState<Values>({ psFor: "patient", modality: "CALL", remind: "yes", remindWhen: "ONE_DAY" })
  const [saving, setSaving] = useState(false)
  const volunteers = useQuery({ queryKey: ["volunteers"], queryFn: volunteersApi.list, staleTime: 300_000 })
  const slots = useQuery({ queryKey: ["volunteer-availability", values.volunteer], queryFn: () => volunteersApi.listAvailability(values.volunteer!), enabled: Boolean(values.volunteer) })
  const companions = useQuery({ queryKey: ["patient-companions", patientId], queryFn: () => patientsApi.companions(patientId), staleTime: 30_000 })

  const volunteerOptions = (volunteers.data ?? []).filter((v) => v.isActive).map((v) => ({ value: v.id, label: `${v.firstName} ${v.lastName}`, sublabel: v.specialty }))
  const slotOptions = (slots.data ?? [])
    .filter((s) => s.status === "AVAILABLE" && isAvailabilitySlotInFuture(s))
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
    .map((s) => ({ value: s.id, label: slotLabel(s) }))
  const groups: Group[] = [
    {
      title: "Beneficiario",
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
        {
          id: "companion",
          label: "Acompañante",
          type: "select",
          required: true,
          placeholder: "Seleccionar acompañante",
          options: (companions.data ?? []).map((l) => ({ value: l.companionId, label: l.companion?.fullName ?? l.companionDisplayName ?? "Acompañante" })),
          showIf: is("psFor", "companion"),
        },
        { id: "name", label: "Nombre completo", type: "text", required: true, placeholder: "Nombre y apellido", showIf: is("psFor", NEW_COMPANION) },
        { id: "relationship", label: "Parentesco", type: "select", catalog: "companion_relationship", required: true, showIf: is("psFor", NEW_COMPANION) },
        { id: "phone", label: "Teléfono", type: "text", required: true, placeholder: "987654321", showIf: is("psFor", NEW_COMPANION) },
      ],
    },
    {
      title: "Sesión",
      questions: [
        { id: "volunteer", label: "Psicooncólogo", type: "select", required: true, placeholder: "Seleccionar psicooncólogo", options: volunteerOptions },
        {
          id: "slot",
          label: "Horario disponible",
          type: "choice",
          required: true,
          wide: true,
          options: slotOptions,
          hint: slots.isLoading ? "Cargando horarios…" : slotOptions.length ? "Horarios libres del psicooncólogo elegido." : "No tiene horarios libres. Elige a otro psicooncólogo.",
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
        { id: "reason", label: "Motivo de la derivación", type: "textarea", placeholder: "Motivo de la derivación o contexto para la sesión…" },
      ],
    },
    {
      title: "Recordatorio",
      questions: [
        { id: "remind", label: "¿Enviar recordatorio de la sesión?", type: "yesno", required: true },
        {
          id: "remindWhen",
          label: "¿Cuándo?",
          type: "choice",
          required: true,
          options: [
            { value: "ONE_DAY", label: "1 día antes" },
            { value: "TWO_HOURS", label: "2 horas antes" },
            { value: "CUSTOM", label: "En otra fecha" },
          ],
          showIf: is("remind", "yes"),
        },
        { id: "remindAt", label: "Fecha del recordatorio", type: "datetime", required: true, showIf: (v) => v.remind === "yes" && v.remindWhen === "CUSTOM" },
      ],
    },
  ]
  const { missingRequired } = progress(groups, values)

  async function submit() {
    setSaving(true)
    try {
      let companionId: string | null = null
      if (values.psFor === "companion") companionId = values.companion!
      if (values.psFor === NEW_COMPANION) {
        const created = await patientsApi.createCompanion(patientId, { fullName: values.name!.trim(), primaryPhone: values.phone!.trim(), relationship: values.relationship! })
        await queryClient.invalidateQueries({ queryKey: ["patient-companions", patientId] })
        companionId = created.id
      }
      const reminderMode = values.remind === "yes" ? (values.remindWhen as "TWO_HOURS" | "ONE_DAY" | "CUSTOM") : "MANUAL"
      const volunteer = volunteerOptions.find((v) => v.value === values.volunteer)?.label
      const slot = slotOptions.find((s) => s.value === values.slot)?.label
      setPsico(
        {
          patientId,
          beneficiaryType: companionId ? "COMPANION" : "PATIENT",
          companionId,
          availabilityId: values.slot!,
          followUpId,
          modality: values.modality as "CALL" | "VIDEO_CALL",
          reminderMode,
          remindAt: reminderMode === "CUSTOM" ? new Date(values.remindAt!).toISOString() : undefined,
          zoomLink: values.modality === "VIDEO_CALL" ? text(values.zoom) : undefined,
          schedulingNotes: text(values.reason),
        },
        [slot, volunteer, values.modality === "VIDEO_CALL" ? "videollamada" : "llamada"].filter(Boolean).join(", "),
      )
      onClose()
    } catch (error) {
      toast.error("No se pudo registrar al familiar", { description: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      icon={Brain}
      title="Derivar a psicooncología"
      description="Agenda una sesión con un voluntario"
      footer={
        <>
          <span className="mr-auto self-center text-[13px] text-zinc-500">{missingRequired ? (missingRequired === 1 ? "Falta 1 dato obligatorio" : `Faltan ${missingRequired} datos obligatorios`) : FOOTNOTE}</span>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="dark" disabled={missingRequired > 0 || saving} onClick={() => void submit()}>
            {saving ? "Guardando…" : "Agendar sesión"}
          </Button>
        </>
      }
    >
      <QuestionForm framed groups={groups} values={values} onChange={(id, v) => setValues((prev) => ({ ...prev, [id]: v, ...(id === "volunteer" ? { slot: null } : {}) }))} />
    </Modal>
  )
}

