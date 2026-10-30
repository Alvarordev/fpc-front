import { no, yes, type Group, type Values } from "@/components/ds/questions"


const signs = (v: Values) => v.phase === "SIGNS_AND_SYMPTOMS"

export const sintomasGroups: Group[] = [
  {
    title: "Malestar y dolor",
    questions: [
      { id: "discomfort", label: "¿Presenta malestar o dolor?", type: "yesno" },
      { id: "signs", label: "Signos y síntomas", type: "textarea", placeholder: "Describe los signos o síntomas", showIf: yes("discomfort") },
      { id: "painNow", label: "¿El dolor está presente actualmente?", type: "yesno", showIf: yes("discomfort") },
      { id: "painIntensity", label: "Intensidad del dolor (0 a 10)", type: "scale", hint: "Pídele que lo califique: 0 es sin dolor y 10 el peor dolor.", showIf: yes("painNow") },
      { id: "painLocation", label: "Ubicación del dolor", type: "text", placeholder: "Ej: abdomen", showIf: yes("painNow") },
      { id: "painDescription", label: "Descripción del dolor", type: "textarea", placeholder: "Cómo es, desde cuándo, qué lo alivia", showIf: yes("painNow") },
    ],
  },
  {
    title: "Consulta médica",
    showIf: signs,
    questions: [
      { id: "consulted", label: "¿Actualmente ha solicitado o asistió a una consulta médica?", type: "yesno", wide: true },
      { id: "examReason", label: "¿Qué lo motivó a realizarse su examen médico?", type: "text", required: true, placeholder: "Motivo del examen médico", showIf: yes("consulted") },
      { id: "consultCenter", label: "¿En qué establecimiento de salud?", type: "select", catalog: "hospital", required: true, showIf: yes("consulted") },
      { id: "consultSpecialty", label: "¿Con qué especialidad?", type: "select", catalog: "specialty", required: true, showIf: yes("consulted") },
      { id: "firstConsult", label: "¿Cuándo fue la 1ra consulta que tuvo?", type: "date", required: true, showIf: yes("consulted") },
      { id: "nextConsult", label: "¿Cuándo es su siguiente consulta médica?", type: "date", showIf: yes("consulted") },
      { id: "indications", label: "Indicaciones recibidas", type: "textarea", placeholder: "Indicaciones de la consulta", showIf: yes("consulted") },
      { id: "noConsultReason", label: "¿Sabe por qué no ha solicitado ni asistido a una consulta médica?", type: "textarea", required: true, placeholder: "Explica el motivo", showIf: no("consulted") },
    ],
  },
  {
    title: "Búsqueda del diagnóstico",
    showIf: signs,
    questions: [
      { id: "waitingDx", label: "¿Está a la espera de un diagnóstico?", type: "yesno" },
      { id: "waitingTime", label: "¿Hace cuánto tiempo está esperando o está en búsqueda de un diagnóstico?", type: "duration", showIf: yes("waitingDx") },
      { id: "referralSheet", label: "¿Le han brindado una hoja de referencia?", type: "yesno" },
      { id: "referredTo", label: "¿A dónde lo han referido?", type: "select", catalog: "hospital", required: true, showIf: yes("referralSheet") },
      { id: "noReferralReason", label: "¿Sabe por qué o el motivo de no haberle brindado la hoja de referencia?", type: "textarea", required: true, showIf: no("referralSheet") },
      { id: "gotDx", label: "¿Le han brindado algún diagnóstico?", type: "yesno" },
    ],
  },
  {
    title: "Soporte del programa",
    showIf: signs,
    questions: [
      { id: "referredBySepa", label: "¿Logró ser referido a un establecimiento de salud de mayor complejidad a partir del soporte del programa?", type: "tri", wide: true },
      { id: "primaryCareBySepa", label: "¿Asistió a su primera consulta médica en atención primaria a partir del soporte del programa?", type: "tri", wide: true },
      { id: "primaryCareDate", label: "¿Cuándo fue su primera consulta médica en atención primaria a partir del soporte del programa?", type: "date", wide: true, showIf: yes("primaryCareBySepa") },
    ],
  },
  {
    title: "Tratamiento informado",
    questions: [
      { id: "givenTreatment", label: "¿Actualmente le han brindado algún tratamiento?", type: "yesno", wide: true },
      { id: "reportedTreatment", label: "Tratamiento informado", type: "text", required: true, showIf: yes("givenTreatment") },
      { id: "reportedFrequency", label: "Frecuencia del tratamiento informado", type: "text", placeholder: "Ej: cada 21 días", showIf: yes("givenTreatment") },
      { id: "noTreatmentReason", label: "Motivo por el que no recibe tratamiento", type: "textarea", required: true, showIf: no("givenTreatment") },
    ],
  },
]
