import { is, yes, type Group } from "@/components/ds/questions"


export const seguroGroups: Group[] = [
  {
    title: "Información de seguro",
    questions: [
      { id: "insurance", label: "Tipo de seguro", type: "select", catalog: "insurance", required: true },
      { id: "epsProvider", label: "Proveedor EPS", type: "select", catalog: "eps", showIf: is("insurance", "EPS") },
      { id: "insuranceChange", label: "Motivo del cambio", type: "text", hint: "Solo si cambió de seguro desde el último contacto.", placeholder: "Motivo" },
      { id: "affiliationDate", label: "Fecha de afiliación", type: "date", showIf: is("insurance", "SIS", "ESSALUD", "EPS", "FFAA", "PRIVATE") },
      { id: "sisBySepa", label: "¿Afiliación al SIS desde SEPA?", type: "yesno", showIf: is("insurance", "SIS") },
      { id: "essaludBySepa", label: "¿Afiliación al ESSALUD desde SEPA?", type: "yesno", showIf: is("insurance", "ESSALUD") },
    ],
  },
  {
    title: "Afiliación pendiente",
    showIf: is("insurance", "NONE"),
    questions: [
      { id: "canAffiliateSis", label: "Puede afiliarse al SIS", type: "yesno" },
      { id: "expectedDate", label: "Fecha esperada", type: "date", showIf: yes("canAffiliateSis") },
    ],
  },
]
