import type { Group, Option } from "@/components/ds/questions"

/** Alta y edición de un ítem de catálogo. El padre solo aparece en catálogos jerárquicos. */
export function catalogItemGroups(parent?: { label: string; options: Option[] }): Group[] {
  return [
    {
      title: "",
      questions: [
        ...(parent
          ? [{ id: "parent", label: parent.label, type: "select" as const, required: true, wide: true, options: parent.options }]
          : []),
        { id: "label", label: "Etiqueta", type: "text" as const, required: true, wide: true, placeholder: "Como aparecerá en las listas" },
        { id: "code", label: "Código", type: "text" as const, required: true, hint: "Se propone a partir de la etiqueta. Cámbialo si hace falta." },
        { id: "sortOrder", label: "Orden en listas", type: "number" as const, hint: "Los números menores aparecen primero." },
      ],
    },
  ]
}
