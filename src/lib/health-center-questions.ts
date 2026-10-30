import type { Group } from "@/components/ds/questions"
import { CARE_CATEGORIES, HEALTH_CENTER_INSTITUTIONS, HEALTH_CENTER_INSTITUTION_LABELS } from "@/lib/health-center-labels"
import { DEPARTMENTS } from "@/pages/hospitales/_utils/departments"

/** Alta y edición de un hospital. Lo usan la pantalla y el botón de agregar de los formularios. */
export const hospitalGroups: Group[] = [
  {
    title: "",
    questions: [
      { id: "name", label: "Nombre del establecimiento", type: "text", required: true, wide: true },
      { id: "department", label: "Departamento", type: "select", options: DEPARTMENTS, required: true },
      { id: "careCategory", label: "Categoría de atención", type: "select", options: CARE_CATEGORIES.map((item) => ({ value: item, label: item })) },
      { id: "institution", label: "Institución", type: "select", options: HEALTH_CENTER_INSTITUTIONS.map((item) => ({ value: item, label: HEALTH_CENTER_INSTITUTION_LABELS[item] })) },
    ],
  },
]
