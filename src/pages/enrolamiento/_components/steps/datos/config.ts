import type { Group } from "@/components/ds/questions"

export const datosGroups: Group[] = [
  {
    title: "Autorización de datos",
    questions: [
      {
        id: "dataPolicy",
        label: "Acuerdo con la política de datos",
        type: "choice",
        required: true,
        wide: true,
        hint: "Si el paciente no está de acuerdo, la inscripción no puede continuar.",
        options: [
          { value: "yes", label: "Sí, está de acuerdo" },
          { value: "no", label: "No, no está de acuerdo" },
        ],
      },
    ],
  },
  {
    title: "Tipo de afiliación",
    questions: [
      {
        id: "affiliation",
        label: "¿Afiliación para usted o para un familiar?",
        type: "choice",
        required: true,
        wide: true,
        options: [
          { value: "PATIENT", label: "Para mí — soy el paciente" },
          { value: "FAMILY", label: "Para un tercero — familiar o amigo" },
        ],
      },
    ],
  },
]
