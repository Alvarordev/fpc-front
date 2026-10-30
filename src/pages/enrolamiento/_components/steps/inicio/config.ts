import type { Group, Values } from "@/components/ds/questions"

export function inicioGroups(historical: boolean): Group[] {
  return [
    {
      title: "Fecha del hecho",
      description: "Indica cuándo ocurrió el enrolamiento. La fecha de carga se registra aparte.",
      showIf: () => historical,
      questions: [
        {
          id: "historicalDate",
          label: "Fecha real de enrolamiento",
          type: "date",
          required: true,
          hint: "Se conservará como fecha calendario, sin inventar una hora.",
        },
      ],
    },
    {
      title: "Registro de tiempo",
      questions: [
        {
          id: "startTime",
          label: historical ? "Hora de inicio (opcional)" : "Hora de inicio",
          type: "time",
          required: !historical,
          hint: historical ? "Déjala vacía si solo conoces el día." : undefined,
        },
      ],
    },
  ]
}

export function validateInicio(values: Values, historical: boolean): string | null {
  if (historical && !values.historicalDate) return "Indica la fecha real de enrolamiento"
  return null
}
