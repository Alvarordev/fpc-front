import type { CatalogKind } from "@/api/catalogs"
import type { Group, Option } from "@/components/ds/questions"

/** El único catálogo con padre. La subfuente cuelga de la fuente de ingreso. */
export const CATALOG_PARENT_KIND: Partial<Record<CatalogKind, CatalogKind>> = {
  entry_sub_source: "entry_source",
}

export const CATALOG_PARENT_LABEL: Partial<Record<CatalogKind, string>> = {
  entry_sub_source: "Fuente de ingreso",
}

/** Alta de un ítem. El padre solo aparece en catálogos jerárquicos. */
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

/** Edición: el código no se puede cambiar. El padre solo en catálogos jerárquicos. */
export function catalogItemEditGroups(parent?: { label: string; options: Option[] }): Group[] {
  return [
    {
      title: "",
      questions: [
        ...(parent
          ? [{ id: "parent", label: parent.label, type: "select" as const, required: true, wide: true, options: parent.options }]
          : []),
        { id: "label", label: "Etiqueta", type: "text" as const, required: true, wide: true },
        { id: "sortOrder", label: "Orden en listas", type: "number" as const, hint: "Los números menores aparecen primero." },
      ],
    },
  ]
}
