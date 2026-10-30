import type { Group, Option, Values } from "@/components/ds/questions"

export function cierreGroups(historical: boolean, isAgent: boolean, agents: Option[]): Group[] {
  return [
    {
      title: "Encuesta de satisfacción",
      questions: [
        {
          id: "survey",
          label: "¿El paciente acepta la encuesta?",
          type: "choice",
          wide: true,
          options: [
            { value: "yes", label: "Sí, acepta" },
            { value: "no", label: "No desea" },
          ],
        },
      ],
    },
    {
      title: "Responsable",
      showIf: () => !isAgent,
      questions: [
        {
          id: "agent",
          label: "Agente responsable",
          type: "select",
          required: true,
          wide: true,
          placeholder: "Seleccionar agente...",
          options: agents,
        },
      ],
    },
    {
      title: "Registro de tiempo",
      questions: [
        {
          id: "endTime",
          label: historical ? "Hora de fin (opcional)" : "Hora de fin",
          type: "time",
          required: !historical,
        },
      ],
    },
  ]
}

export function validateCierre(values: Values, isAgent: boolean): string | null {
  if (!isAgent && !values.agent) return "Seleccione un agente responsable antes de finalizar"
  return null
}
