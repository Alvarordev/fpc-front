import type { Group } from "@/components/ds/questions"
import { DEPARTMENTS } from "./options"

export const addressGroups: Group[] = [
  {
    title: "Ubicación",
    questions: [
      {
        id: "adKind",
        label: "Tipo",
        type: "choice",
        options: [
          { value: "CURRENT", label: "Residencia actual" },
          { value: "TEMPORARY", label: "Residencia temporal" },
        ],
        wide: true,
      },
      { id: "adDepartment", label: "Departamento", type: "select", options: DEPARTMENTS, required: true },
      { id: "adProvince", label: "Provincia", type: "text", placeholder: "Lima" },
      { id: "adDistrict", label: "Distrito", type: "text", required: true, placeholder: "Miraflores" },
      { id: "adLine", label: "Dirección", type: "text", required: true, placeholder: "Av. Principal 123" },
      { id: "adReference", label: "Referencia", type: "text", placeholder: "Frente al parque" },
      { id: "adMap", label: "Ubicación web de la residencia", type: "text", placeholder: "https://maps.google.com/..." },
    ],
  },
  {
    title: "Vigencia",
    questions: [
      { id: "adFrom", label: "Vigente desde", type: "date" },
      { id: "adTo", label: "Vigente hasta", type: "date", hint: "Solo si es temporal." },
    ],
  },
]
