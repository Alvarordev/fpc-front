import { yes, type Group, type Option } from "@/components/ds/questions"


/** Nuevo diagnóstico: en paralelo o reemplazando a uno activo. */
export function newDiagnosisGroups(activeDiagnoses: Option[]): Group[] {
  return [
    {
      title: "Diagnóstico",
      questions: [
        { id: "dxReplaces", label: "¿Este diagnóstico reemplaza a uno actual?", type: "yesno", wide: true, hint: "Si es un cáncer distinto que coexiste, responde No." },
        { id: "dxReplaced", label: "Diagnóstico activo a reemplazar", type: "select", options: activeDiagnoses, required: true, placeholder: "Seleccionar diagnóstico actual", showIf: yes("dxReplaces") },
        { id: "dxName", label: "Diagnóstico", type: "select", catalog: "diagnosis", required: true },
        { id: "dxStage", label: "Etapa", type: "select", catalog: "stage", placeholder: "Seleccionar etapa" },
        { id: "dxDate", label: "Fecha de diagnóstico", type: "date" },
        { id: "dxSpecialty", label: "Especialidad del diagnóstico", type: "select", catalog: "specialty" },
        { id: "dxCenter", label: "Establecimiento de salud", type: "select", catalog: "hospital" },
      ],
    },
    ...diagnosisDetailGroups,
  ]
}

const diagnosisDetailGroups: Group[] = [
  {
    title: "Cómo llegó al diagnóstico",
    questions: [
      { id: "dxFirstSymptoms", label: "Primeros síntomas", type: "date", hint: "Cuándo notó los primeros síntomas." },
      { id: "dxSymptom", label: "Síntoma que llevó a consulta", type: "text", placeholder: "Ej: bulto en el seno" },
      { id: "dxRemembersWait", label: "¿Recuerda el tiempo de espera?", type: "yesno" },
      { id: "dxWait", label: "Tiempo de espera para diagnóstico", type: "duration", showIf: yes("dxRemembersWait") },
    ],
  },
  {
    title: "Respaldo y evolución",
    questions: [
      { id: "dxReport", label: "Tiene informe médico", type: "yesno" },
      { id: "dxSepaReferral", label: "¿Diagnóstico con derivación activa de SEPA?", type: "yesno" },
      { id: "dxEvolution", label: "Evolución de la enfermedad", type: "textarea", placeholder: "Ej: metástasis ósea detectada en tomografía de control" },
    ],
  },
]

/** Corrección de un diagnóstico ya registrado: pide el motivo primero. */
export const correctDiagnosisGroups: Group[] = [
  {
    title: "Motivo",
    description: "La corrección queda en el historial de cambios del paciente.",
    questions: [{ id: "dxCorrectionReason", label: "Motivo de la corrección", type: "text", required: true, placeholder: "Ej: la etapa se cargó mal en el enrolamiento", wide: true }],
  },
  {
    title: "Diagnóstico",
    questions: [
      { id: "dxName", label: "Diagnóstico", type: "select", catalog: "diagnosis", required: true },
      { id: "dxStage", label: "Etapa", type: "select", catalog: "stage" },
      { id: "dxDate", label: "Fecha de diagnóstico", type: "date" },
      { id: "dxSpecialty", label: "Especialidad del diagnóstico", type: "select", catalog: "specialty" },
      { id: "dxCenter", label: "Establecimiento de salud", type: "select", catalog: "hospital" },
    ],
  },
  ...diagnosisDetailGroups,
]
