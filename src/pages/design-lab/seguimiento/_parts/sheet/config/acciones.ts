import { is, yes, type Group, type Option } from "@/components/ds/questions"

// Acciones que nacen del seguimiento. Mismos campos que los diálogos actuales:
// SchedulePsychooncologyDialog, CreateAlertDialog, ScheduleFollowUpDialog y
// ReminderFormDialog (en modo borrador, sin elegir agente).

const AGENTS: Option[] = ["Carla Mendoza", "Jorge Salas", "Lucía Ramírez"].map((a) => ({ value: a, label: a }))

const VOLUNTEERS: Option[] = [
  { value: "mq", label: "Mariela Quispe", sublabel: "Psicooncóloga, atiende a Ana" },
  { value: "rv", label: "Renzo Vargas", sublabel: "Psicooncólogo" },
  { value: "pc", label: "Paola Castro", sublabel: "Psicooncóloga" },
]

const SLOTS: Record<string, Option[]> = {
  mq: [
    { value: "2026-11-05T15:00", label: "Jue 5 nov, 15:00" },
    { value: "2026-11-06T10:00", label: "Vie 6 nov, 10:00" },
    { value: "2026-11-12T15:00", label: "Jue 12 nov, 15:00" },
  ],
  rv: [
    { value: "2026-11-04T09:00", label: "Mié 4 nov, 9:00" },
    { value: "2026-11-09T16:30", label: "Lun 9 nov, 16:30" },
  ],
  pc: [{ value: "2026-11-07T11:00", label: "Sáb 7 nov, 11:00" }],
}

const CHANNELS: Option[] = [
  { value: "CALL", label: "Llamada" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "VIDEO_CALL", label: "Videollamada" },
  { value: "EMAIL", label: "Correo" },
  { value: "IN_PERSON", label: "Presencial" },
  { value: "FACEBOOK", label: "Facebook" },
]

export function psychoGroups(companions: Option[]): Group[] {
  return [
    {
      title: "Beneficiario",
      questions: [
        {
          id: "psFor",
          label: "¿La sesión es para…?",
          type: "choice",
          options: [
            { value: "patient", label: "El paciente" },
            { value: "companion", label: "Un acompañante" },
            { value: "new", label: "Otro familiar" },
          ],
          required: true,
          wide: true,
        },
        { id: "psCompanion", label: "Acompañante", type: "select", options: companions, placeholder: "Seleccionar acompañante", required: true, showIf: is("psFor", "companion") },
        { id: "psName", label: "Nombre completo", type: "text", placeholder: "Nombre y apellido", required: true, showIf: is("psFor", "new") },
        { id: "psRelationship", label: "Parentesco", type: "select", catalog: "relationship", required: true, showIf: is("psFor", "new") },
        { id: "psPhone", label: "Teléfono", type: "text", placeholder: "987654321", showIf: is("psFor", "new") },
      ],
    },
    {
      title: "Sesión",
      questions: [
        { id: "psVolunteer", label: "Psicooncólogo", type: "select", options: VOLUNTEERS, placeholder: "Seleccionar psicooncólogo", required: true },
        { id: "psSlot", label: "Horario disponible", type: "choice", optionsFrom: (v) => slotsFor(v.psVolunteer), required: true, wide: true, hint: "Horarios libres del psicooncólogo elegido.", showIf: (v) => !!v.psVolunteer },
        {
          id: "psModality",
          label: "Modalidad",
          type: "choice",
          options: [
            { value: "CALL", label: "Llamada" },
            { value: "VIDEO_CALL", label: "Videollamada" },
          ],
          required: true,
          wide: true,
        },
        { id: "psZoom", label: "Link de Zoom (opcional)", type: "text", placeholder: "https://zoom.us/j/...", wide: true, showIf: is("psModality", "VIDEO_CALL") },
        { id: "psReason", label: "Motivo de la derivación", type: "textarea", placeholder: "Motivo de la derivación o contexto para la sesión..." },
      ],
    },
    {
      title: "Recordatorio",
      questions: [
        { id: "psRemind", label: "¿Enviar recordatorio de la sesión?", type: "yesno" },
        { id: "psRemindAt", label: "Fecha del recordatorio", type: "datetime", showIf: yes("psRemind") },
      ],
    },
  ]
}

/** Los horarios dependen del psicooncólogo elegido. */
export function slotsFor(volunteer: string | null) {
  return volunteer ? (SLOTS[volunteer] ?? []) : []
}

export const alertGroups: Group[] = [
  {
    title: "Incidencia",
    description: "Lo que el paciente reporta sobre su atención en el hospital.",
    questions: [
      { id: "alTitle", label: "Título", type: "text", placeholder: "Título resumido de la alerta...", required: true, wide: true },
      { id: "alCategory", label: "Categoría", type: "select", catalog: "alertCategory", required: true },
      { id: "alCenter", label: "Establecimiento", type: "select", catalog: "hospital", required: true },
      {
        id: "alSeverity",
        label: "Prioridad",
        type: "choice",
        options: [
          { value: "HIGH", label: "Alta" },
          { value: "MEDIUM", label: "Media" },
          { value: "LOW", label: "Baja" },
        ],
        required: true,
        wide: true,
      },
      { id: "alDetail", label: "Detalle", type: "textarea", placeholder: "Describe el problema reportado...", required: true },
    ],
  },
]

export const followUpGroups: Group[] = [
  {
    title: "Cuándo",
    questions: [
      { id: "fuDate", label: "Fecha", type: "date", required: true },
      { id: "fuTime", label: "Hora", type: "time", required: true },
    ],
  },
  {
    title: "Contacto",
    questions: [
      { id: "fuType", label: "Tipo", type: "choice", options: CHANNELS, required: true, wide: true },
      {
        id: "fuPurpose",
        label: "Propósito",
        type: "select",
        options: [
          { value: "FOLLOW_UP", label: "Seguimiento" },
          { value: "FIRST_CONTACT", label: "Primer contacto" },
          { value: "PSYCHOONCOLOGY_REFERRAL", label: "Derivación a psicooncología" },
          { value: "OTHER", label: "Otro" },
        ],
        placeholder: "Seleccionar propósito",
        required: true,
      },
      { id: "fuAgent", label: "Agente responsable", type: "select", options: AGENTS, placeholder: "Seleccionar agente", required: true },
      { id: "fuNotes", label: "Notas (opcional)", type: "textarea", placeholder: "Observaciones sobre el agendamiento..." },
    ],
  },
]

export const reminderGroups: Group[] = [
  {
    title: "Qué recordar",
    questions: [
      {
        id: "rmKind",
        label: "Tipo",
        type: "choice",
        options: [
          { value: "MEDICAL_APPOINTMENT", label: "Cita médica" },
          { value: "GENERIC", label: "Otro" },
        ],
        required: true,
        wide: true,
      },
      { id: "rmSpecialty", label: "Especialidad", type: "select", catalog: "specialty", required: true, showIf: is("rmKind", "MEDICAL_APPOINTMENT") },
      { id: "rmCenter", label: "Establecimiento de salud", type: "select", catalog: "hospital", showIf: is("rmKind", "MEDICAL_APPOINTMENT") },
      { id: "rmFirst", label: "¿Es su primera consulta?", type: "yesno", showIf: is("rmKind", "MEDICAL_APPOINTMENT") },
      { id: "rmDescription", label: "Descripción", type: "textarea", placeholder: "Ej: recoger resultados de laboratorio", required: true, showIf: is("rmKind", "GENERIC") },
    ],
  },
  {
    title: "Aviso",
    questions: [
      { id: "rmAt", label: "Fecha y hora de la cita", type: "datetime", required: true },
      {
        id: "rmLead",
        label: "Anticipación",
        type: "choice",
        options: [
          { value: "SAME_DAY", label: "El mismo día" },
          { value: "1D", label: "1 día antes" },
          { value: "2D", label: "2 días antes" },
          { value: "1W", label: "1 semana antes" },
        ],
        required: true,
        wide: true,
      },
      { id: "rmChannel", label: "Canal", type: "choice", options: CHANNELS.filter((c) => ["WHATSAPP", "CALL", "EMAIL"].includes(c.value)), required: true, wide: true },
    ],
  },
]
