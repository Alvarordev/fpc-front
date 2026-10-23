import type {
  PatientHealthPhase,
  PatientHealthSubcategory,
} from "@/api/patients"

export const patientHealthPhaseLabels: Record<PatientHealthPhase, string> = {
  CANCER_DIAGNOSIS: "Diagnóstico de Cáncer",
  ANNUAL_CHECKUP: "Control Anual",
  SIGNS_AND_SYMPTOMS: "Signos y Síntomas",
}

export const patientHealthSubcategoryLabels: Record<
  PatientHealthSubcategory,
  string
> = {
  SIGNS_AND_SYMPTOMS_PATIENT: "Paciente Signos y Síntomas",
  ACTIVE_TREATMENT: "Pacientes en Tratamiento Activo",
  UNDER_CONTROLS: "Pacientes en Controles",
  TREATMENT_ABANDONED: "Pacientes que Abandonaron su Tratamiento",
  PALLIATIVE_NO_ACTIVE_TREATMENT:
    "Paciente Paliativo sin Tratamiento Activo",
  CANCER_RULED_OUT: "Pacientes con Descarte",
}

export const patientHealthSubcategoryPhase: Record<
  PatientHealthSubcategory,
  PatientHealthPhase
> = {
  SIGNS_AND_SYMPTOMS_PATIENT: "SIGNS_AND_SYMPTOMS",
  ACTIVE_TREATMENT: "CANCER_DIAGNOSIS",
  UNDER_CONTROLS: "CANCER_DIAGNOSIS",
  TREATMENT_ABANDONED: "CANCER_DIAGNOSIS",
  PALLIATIVE_NO_ACTIVE_TREATMENT: "CANCER_DIAGNOSIS",
  CANCER_RULED_OUT: "ANNUAL_CHECKUP",
}

export const patientHealthSubcategoryColors: Record<
  PatientHealthSubcategory,
  { badge: string; dot: string }
> = {
  SIGNS_AND_SYMPTOMS_PATIENT: {
    badge: "border-yellow-200 bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-500",
  },
  ACTIVE_TREATMENT: {
    badge: "border-red-200 bg-red-100 text-red-800",
    dot: "bg-red-500",
  },
  UNDER_CONTROLS: {
    badge: "border-green-200 bg-green-100 text-green-800",
    dot: "bg-green-500",
  },
  TREATMENT_ABANDONED: {
    badge: "border-orange-200 bg-orange-100 text-orange-800",
    dot: "bg-orange-500",
  },
  PALLIATIVE_NO_ACTIVE_TREATMENT: {
    badge: "border-purple-200 bg-purple-100 text-purple-800",
    dot: "bg-purple-500",
  },
  CANCER_RULED_OUT: {
    badge: "border-blue-950 bg-blue-900 text-white",
    dot: "bg-blue-900",
  },
}

export const patientHealthSubcategoriesByPhase: Record<
  PatientHealthPhase,
  readonly PatientHealthSubcategory[]
> = {
  SIGNS_AND_SYMPTOMS: ["SIGNS_AND_SYMPTOMS_PATIENT"],
  CANCER_DIAGNOSIS: [
    "ACTIVE_TREATMENT",
    "UNDER_CONTROLS",
    "TREATMENT_ABANDONED",
    "PALLIATIVE_NO_ACTIVE_TREATMENT",
  ],
  ANNUAL_CHECKUP: ["CANCER_RULED_OUT"],
}

export interface PatientHealthSubcategoryOption {
  value: PatientHealthSubcategory
  label: string
  phase: PatientHealthPhase
  phaseLabel: string
  frequency: string
  standard: string[]
  personalized: string[]
}

export const patientHealthSubcategoryOptions: PatientHealthSubcategoryOption[] =
  [
    {
      value: "SIGNS_AND_SYMPTOMS_PATIENT",
      label: patientHealthSubcategoryLabels.SIGNS_AND_SYMPTOMS_PATIENT,
      phase: "SIGNS_AND_SYMPTOMS",
      phaseLabel: patientHealthPhaseLabels.SIGNS_AND_SYMPTOMS,
      frequency: "Cada 15 días",
      standard: [
        "Brindar orientación hacia su centro de salud cuando todavía no ha iniciado exámenes médicos.",
        "Si ya inició sus exámenes y está a la espera de resultados, programar el contacto al día siguiente de la fecha informada.",
      ],
      personalized: [
        "Si ya realizó sus exámenes y está a la espera de resultados, mantener el acompañamiento hasta recibirlos.",
        "Si ya realizó el examen para determinar el tipo de cáncer y desea continuar con chequeos de evaluación, seguir la programación de exámenes indicada.",
      ],
    },
    {
      value: "ACTIVE_TREATMENT",
      label: patientHealthSubcategoryLabels.ACTIVE_TREATMENT,
      phase: "CANCER_DIAGNOSIS",
      phaseLabel: patientHealthPhaseLabels.CANCER_DIAGNOSIS,
      frequency: "Cada 15 días",
      standard: [
        "Pacientes en condición de crisis médica activa y tratamiento activo.",
      ],
      personalized: [
        "Si se encuentra emocionalmente en crisis o en un estado tenso, abordar el aspecto emocional sin invadir su espacio personal.",
        "Si está en atención y seguimiento oportuno de su tratamiento, las llamadas pueden mantenerse en el intervalo estándar de 15 días.",
        "Si tiene tratamiento mensual, realizar seguimiento mensual.",
        "Modificar la frecuencia sólo si presenta dificultades o espera un examen adicional con otra especialidad.",
      ],
    },
    {
      value: "UNDER_CONTROLS",
      label: patientHealthSubcategoryLabels.UNDER_CONTROLS,
      phase: "CANCER_DIAGNOSIS",
      phaseLabel: patientHealthPhaseLabels.CANCER_DIAGNOSIS,
      frequency: "Seguimiento mensual",
      standard: ["Pacientes en condición de controles mensuales."],
      personalized: [
        "Si tiene controles cada 3 meses o más, alternar llamadas y mensajes de WhatsApp para no saturar ni alterar su retorno a las actividades cotidianas.",
      ],
    },
    {
      value: "TREATMENT_ABANDONED",
      label: patientHealthSubcategoryLabels.TREATMENT_ABANDONED,
      phase: "CANCER_DIAGNOSIS",
      phaseLabel: patientHealthPhaseLabels.CANCER_DIAGNOSIS,
      frequency: "Cada 3 meses",
      standard: [
        "Pacientes que no han llevado el tratamiento por voluntad propia; continuar brindando acompañamiento y orientación por si requieren retomar sus atenciones.",
      ],
      personalized: [
        "Modificar la frecuencia sólo si acepta el soporte emocional o retorna a su atención médica.",
      ],
    },
    {
      value: "CANCER_RULED_OUT",
      label: patientHealthSubcategoryLabels.CANCER_RULED_OUT,
      phase: "ANNUAL_CHECKUP",
      phaseLabel: patientHealthPhaseLabels.ANNUAL_CHECKUP,
      frequency: "Cada 3 a 4 semanas",
      standard: [
        "Si se encuentra en estado participativo (progresión), la comunicación puede darse con un familiar o con el paciente.",
      ],
      personalized: [],
    },
    {
      value: "PALLIATIVE_NO_ACTIVE_TREATMENT",
      label: patientHealthSubcategoryLabels.PALLIATIVE_NO_ACTIVE_TREATMENT,
      phase: "CANCER_DIAGNOSIS",
      phaseLabel: patientHealthPhaseLabels.CANCER_DIAGNOSIS,
      frequency: "Cada 3 a 4 semanas",
      standard: [
        "Si se encuentra en estado paliativo (progresión), la comunicación puede darse con un familiar o con el paciente.",
      ],
      personalized: [
        "Modificar la frecuencia sólo si el paciente o la familia acepta el soporte emocional o solicita un acompañamiento más continuo.",
      ],
    },
  ]

export function getPatientHealthSubcategoryOption(
  value: PatientHealthSubcategory | null | undefined,
) {
  return patientHealthSubcategoryOptions.find((option) => option.value === value)
}

export function requiresActiveDiagnosis(
  value: PatientHealthSubcategory | null | undefined,
) {
  return (
    value === "ACTIVE_TREATMENT" ||
    value === "UNDER_CONTROLS" ||
    value === "TREATMENT_ABANDONED" ||
    value === "PALLIATIVE_NO_ACTIVE_TREATMENT"
  )
}
