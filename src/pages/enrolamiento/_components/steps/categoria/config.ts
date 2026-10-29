import type { Group, Option, Values } from "@/components/ds/questions"

export function categoriaGroups(options: Option[]): Group[] {
  return [
    {
      title: "Perfil clínico",
      questions: [
        {
          id: "categoria",
          label: "Categorización",
          type: "select",
          required: true,
          wide: true,
          placeholder: "Seleccionar...",
          options: options.filter((option) => option.value !== "ANNUAL_CHECKUP"),
          hint: "La subcategoría se calcula a partir de los tratamientos. Puedes fijarla manualmente si esa situación no coincide con el caso del paciente.",
        },
      ],
    },
  ]
}

export function validateCategoria(values: Values): string | null {
  return values.categoria ? null : "Selecciona una categoría clínica."
}
