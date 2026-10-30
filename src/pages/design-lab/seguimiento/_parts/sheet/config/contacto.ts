import { is, type Group, type Option } from "@/components/ds/questions"
import { GENDERS } from "./options"

export function contactoGroups(people: Option[]): Group[] {
  return [
    {
      title: "Contacto para seguimiento",
      description: "Con quién se coordinan los próximos contactos.",
      questions: [
        { id: "contactPerson", label: "Persona de contacto", type: "select", options: [...people, { value: "new", label: "Registrar otra persona" }], wide: true },
        { id: "contactName", label: "Nombre", type: "text", required: true, showIf: is("contactPerson", "new") },
        { id: "contactPhone", label: "Celular principal", type: "text", required: true, placeholder: "9 dígitos", showIf: is("contactPerson", "new") },
        { id: "contactPhone2", label: "Celular auxiliar", type: "text", showIf: is("contactPerson", "new") },
        { id: "contactRelationship", label: "Parentesco", type: "select", catalog: "relationship", showIf: is("contactPerson", "new") },
        { id: "contactGender", label: "Género", type: "choice", options: GENDERS, showIf: is("contactPerson", "new") },
      ],
    },
    {
      title: "Cuidador",
      description: "Quién lo cuida en casa. Puede ser la misma persona de contacto.",
      questions: [
        { id: "caregiver", label: "Cuidador", type: "select", options: [...people.filter((p) => p.value !== "patient"), { value: "new", label: "Registrar otra persona" }, { value: "none", label: "Sin cuidador" }], wide: true },
        { id: "cgName", label: "Nombre", type: "text", required: true, showIf: is("caregiver", "new") },
        { id: "cgPhone", label: "Celular principal", type: "text", required: true, showIf: is("caregiver", "new") },
        { id: "cgRelationship", label: "Parentesco", type: "select", catalog: "relationship", showIf: is("caregiver", "new") },
        { id: "cgGender", label: "Género", type: "choice", options: GENDERS, showIf: is("caregiver", "new") },
      ],
    },
  ]
}
