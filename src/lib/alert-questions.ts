import { HEALTH_CENTER } from "@/components/app-catalog-source"
import type { Group } from "@/components/ds/questions"

/** Preguntas de una incidencia. El seguimiento y Alertas usan el mismo grupo. */
export const alertGroups: Group[] = [
  {
    title: "",
    questions: [
      { id: "healthCenterId", label: "Establecimiento", type: "select", catalog: HEALTH_CENTER, required: true, wide: true },
      { id: "category", label: "Categoría", type: "select", catalog: "alert_category", required: true },
      {
        id: "severity",
        label: "Severidad",
        type: "choice",
        required: true,
        options: [
          { value: "HIGH", label: "Alta" },
          { value: "MEDIUM", label: "Media" },
          { value: "LOW", label: "Baja" },
        ],
      },
      { id: "title", label: "Título", type: "text", required: true, placeholder: "Ej: no le entregan la quimioterapia", wide: true },
      { id: "description", label: "Qué pasó", type: "textarea", required: true, placeholder: "Detalla el problema que reporta" },
    ],
  },
]
