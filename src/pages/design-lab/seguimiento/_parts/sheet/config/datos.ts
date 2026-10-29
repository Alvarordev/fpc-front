import { is, type Group } from "@/components/ds/questions"
import { HEALTH_PHASES, SEARCH_RESULTS } from "./options"

export const datosGroups: Group[] = [
  {
    title: "Situación de salud",
    description: "La fase decide qué preguntas de síntomas aparecen.",
    questions: [
      { id: "phase", label: "Fase de salud", type: "select", options: HEALTH_PHASES, required: true },
      { id: "subcategory", label: "Subcategoría del paciente", type: "select", catalog: "subcategory", required: true },
    ],
  },
  {
    title: "Resultado de la búsqueda diagnóstica",
    description: "Solo para pacientes en signos y síntomas.",
    showIf: is("phase", "SIGNS_AND_SYMPTOMS"),
    questions: [
      { id: "searchResult", label: "Resultado de la búsqueda", type: "select", options: SEARCH_RESULTS },
      { id: "formalDiagnosis", label: "Diagnóstico formal", type: "text", required: true, placeholder: "Escribe el diagnóstico confirmado", showIf: is("searchResult", "CONFIRMED") },
      { id: "nonOncological", label: "¿Cuál?", type: "text", required: true, placeholder: "Escribe el diagnóstico no oncológico", showIf: is("searchResult", "NON_ONCOLOGICAL") },
      { id: "sepaSupported", label: "¿Soportado por SEPA?", type: "yesno", showIf: is("searchResult", "CONFIRMED", "NON_ONCOLOGICAL", "DISCARDED") },
      { id: "searchNotes", label: "Detalle del cambio de estado", type: "textarea", placeholder: "Opcional", showIf: is("searchResult", "CONFIRMED", "NON_ONCOLOGICAL", "DISCARDED") },
    ],
  },
  {
    title: "Datos generales",
    questions: [
      { id: "translation", label: "Requiere traducción", type: "yesno" },
      { id: "travelTime", label: "Tiempo de viaje al hospital", type: "duration", hint: "Desde su casa hasta el hospital donde se atiende." },
    ],
  },
]
