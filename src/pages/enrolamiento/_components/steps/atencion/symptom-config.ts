import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { yes, type Group } from "@/components/ds/questions"
import { TRI_MENTION } from "@/pages/pacientes/[id]/seguimientos/_components/ficha/answers"

const consulted = (v: { consulted?: string | null }) => v.consulted === "yes"

export const symptomGroups: Group[] = [
  {
    title: "Malestar",
    questions: [
      { id: "discomfort", label: "¿Presenta algún malestar o dolor?", type: "tri", options: TRI_MENTION, required: true, wide: true },
      { id: "signs", label: "Descripción de signos y síntomas", type: "textarea", placeholder: "Describa los signos o síntomas...", showIf: yes("discomfort") },
      { id: "motivation", label: "¿Qué lo motivó a realizarse su examen médico?", type: "textarea", required: true, placeholder: "Motivo del examen médico", showIf: (v) => v.discomfort === "no" },
    ],
  },
  {
    title: "Consulta",
    questions: [
      { id: "consulted", label: "¿Actualmente ha solicitado o asistió a una consulta médica?", type: "yesno", required: true, wide: true },
      { id: "noConsult", label: "¿Sabe por qué no ha solicitado ni asistido a una consulta médica?", type: "textarea", required: true, showIf: (v) => v.consulted === "no" },
      { id: "center", label: "¿En qué establecimiento de salud?", type: "select", catalog: HEALTH_CENTER, required: true, wide: true, showIf: consulted },
      { id: "specialty", label: "¿Con qué especialidad?", type: "select", catalog: "medical_specialty", required: true, showIf: consulted },
      { id: "firstDate", label: "¿Cuándo fue la 1ra consulta que tuvo?", type: "date", required: true, showIf: consulted },
      { id: "searchDuration", label: "¿Hace cuánto tiempo está esperando o está en búsqueda de un diagnóstico?", type: "duration", units: ["DAY", "WEEK", "MONTH", "YEAR"], showIf: consulted },
      { id: "referral", label: "¿Le han brindado una hoja de referencia?", type: "tri", options: TRI_MENTION, required: true, wide: true, showIf: consulted },
      { id: "referredCenter", label: "¿A dónde lo han referido?", type: "select", catalog: HEALTH_CENTER, required: true, wide: true, showIf: (v) => consulted(v) && v.referral === "yes" },
      { id: "referralReason", label: "¿Sabe por qué o el motivo de no haberle brindado la hoja de referencia?", type: "textarea", required: true, showIf: (v) => consulted(v) && v.referral === "no" },
      { id: "hasReceived", label: "¿Le han brindado algún diagnóstico?", type: "yesno", required: true, showIf: consulted },
      { id: "nonOnc", label: "¿Es un diagnóstico no oncológico?", type: "yesno", showIf: (v) => consulted(v) && v.hasReceived === "yes" },
      { id: "reported", label: "¿Cuál?", type: "select", catalog: "cancer_diagnosis", required: true, showIf: (v) => consulted(v) && v.hasReceived === "yes" && v.nonOnc !== "yes" },
      {
        id: "reportedText",
        label: "Diagnóstico no oncológico",
        type: "text",
        required: true,
        hint: "No se agrega al catálogo de cáncer.",
        showIf: (v) => consulted(v) && v.hasReceived === "yes" && v.nonOnc === "yes",
      },
      { id: "nextDate", label: "¿Cuándo es su siguiente consulta médica?", type: "date", showIf: consulted },
      { id: "nextSpecialty", label: "Especialidad de la siguiente consulta", type: "select", catalog: "medical_specialty", required: true, showIf: (v) => consulted(v) && Boolean(v.nextDate) },
      { id: "nextNote", label: "Nota del recordatorio", type: "textarea", placeholder: "Indicaciones, preparación o contexto para el agente", showIf: consulted },
    ],
  },
  {
    title: "Tratamiento informado",
    questions: [
      { id: "receiving", label: "¿Actualmente le han brindado algún tratamiento?", type: "yesno", wide: true },
      { id: "reportedTreatment", label: "Tratamiento informado", type: "select", catalog: "treatment_type", required: true, showIf: yes("receiving") },
      { id: "reportedFrequency", label: "Frecuencia del tratamiento informado", type: "duration", units: ["DAY", "WEEK", "MONTH", "YEAR"], showIf: yes("receiving") },
      { id: "notReceiving", label: "Motivo por el que no recibe tratamiento", type: "textarea", required: true, showIf: (v) => v.receiving === "no" },
    ],
  },
]
