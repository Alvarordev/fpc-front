import { is, yes, type Group } from "@/components/ds/questions"


export const antecedentesGroups: Group[] = [
  {
    title: "Salud mental",
    questions: [{ id: "psychiatry", label: "¿Tiene antecedentes de psiquiatría?", type: "tri" }],
  },
]

export const comorbidityGroups: Group[] = [
  {
    title: "Comorbilidad",
    questions: [
      { id: "cmName", label: "Comorbilidad", type: "text", required: true, placeholder: "Ej: hipertensión" },
      { id: "cmTreatment", label: "Tratamiento actual", type: "text", placeholder: "Ej: losartán 50 mg" },
      { id: "cmSpecialty", label: "Especialidad de seguimiento", type: "select", catalog: "specialty" },
    ],
  },
]

export const limitationGroups: Group[] = [
  {
    title: "Limitación",
    questions: [
      { id: "lmDescription", label: "Limitación", type: "text", required: true, placeholder: "Describe la limitación" },
      { id: "lmCause", label: "Causa", type: "text" },
    ],
  },
]

export const familyHistoryGroups: Group[] = [
  {
    title: "Antecedente familiar de cáncer",
    questions: [
      { id: "fhRelationship", label: "Parentesco", type: "select", catalog: "relationship", required: true },
      { id: "fhCancer", label: "Tipo de cáncer", type: "select", catalog: "diagnosis", required: true },
    ],
  },
]

export const nonOncologicalGroups: Group[] = [
  {
    title: "Diagnóstico",
    questions: [
      { id: "noDx", label: "Diagnóstico no oncológico", type: "text", required: true, placeholder: "Ej: gastritis, anemia, hipertensión" },
      { id: "noDate", label: "Fecha del hecho", type: "date" },
    ],
  },
  {
    title: "Tratamiento",
    questions: [
      { id: "noTreated", label: "¿Recibe tratamiento?", type: "yesno", wide: true },
      { id: "noTreatment", label: "Nombre del tratamiento", type: "text", showIf: yes("noTreated") },
      { id: "noMedication", label: "Medicación", type: "text", showIf: yes("noTreated") },
      { id: "noFrequency", label: "Frecuencia del tratamiento", type: "text", placeholder: "Ej: una vez al día", showIf: yes("noTreated") },
    ],
  },
  {
    title: "Controles",
    questions: [
      { id: "noControls", label: "¿Mantiene controles?", type: "yesno", wide: true },
      { id: "noControlSpecialty", label: "Especialidad de control", type: "select", catalog: "specialty", required: true, showIf: yes("noControls") },
      { id: "noPeriodicity", label: "Periodicidad de controles", type: "duration", showIf: yes("noControls") },
      {
        id: "noStatus",
        label: "Estado",
        type: "choice",
        options: [
          { value: "ACTIVE", label: "Activo" },
          { value: "DISCHARGED", label: "Dado de alta" },
        ],
        wide: true,
      },
      { id: "noDischargeDate", label: "Fecha del alta", type: "date", showIf: is("noStatus", "DISCHARGED") },
      { id: "noDischargeReason", label: "Motivo del alta", type: "text", required: true, showIf: is("noStatus", "DISCHARGED") },
    ],
  },
]
