import { is, yes, type Group } from "@/components/ds/questions"


export const socialGroups: Group[] = [
  {
    title: "Hogar y familia",
    questions: [
      { id: "zone", label: "Zonificación de residencia", type: "select", catalog: "zone" },
      { id: "education", label: "Grado de instrucción", type: "select", catalog: "education" },
      { id: "language", label: "Lengua materna/originaria", type: "select", catalog: "language" },
      { id: "children", label: "¿Cuántos hijos tiene?", type: "number", placeholder: "Indicar cantidad" },
      { id: "violence", label: "¿Se evidencia violencia intrafamiliar?", type: "yesno" },
      { id: "woodStove", label: "Usa cocina a leña", type: "yesno" },
      { id: "working", label: "¿Trabaja?", type: "yesno" },
      { id: "financialSupport", label: "¿Recibe ayuda económica?", type: "yesno" },
    ],
  },
  {
    title: "Apoyo social",
    questions: [
      { id: "socialWork", label: "Derivado a trabajo social", type: "yesno" },
      { id: "conadis", label: "Tiene carnet CONADIS", type: "yesno" },
      { id: "fissal", label: "Conoce FISSAL", type: "yesno" },
    ],
  },
  {
    title: "Beneficios gestionados por SEPA",
    questions: [
      { id: "transport", label: "¿Accedió al beneficio de traslado por gestión de SEPA?", type: "yesno", wide: true },
      { id: "transportProvider", label: "Proveedor de traslado SEPA", type: "select", catalog: "transport", showIf: yes("transport") },
      { id: "transportOther", label: "Otro proveedor de traslado", type: "text", placeholder: "Nombre del proveedor", showIf: is("transportProvider", "Otro") },
      { id: "shelter", label: "¿Accedió a un servicio de albergue por orientación de SEPA?", type: "yesno", wide: true },
      { id: "shelterProvider", label: "Albergue o proveedor SEPA", type: "select", catalog: "shelter", showIf: yes("shelter") },
      { id: "shelterOther", label: "Otro albergue", type: "text", placeholder: "Nombre del albergue", showIf: is("shelterProvider", "Otro") },
      { id: "talk", label: "¿Asistió a charla o taller educativo de FPC?", type: "yesno", wide: true },
      { id: "talkDate", label: "Fecha de la charla educativa", type: "date", showIf: yes("talk") },
      { id: "socialNotes", label: "Notas de estado", type: "textarea" },
    ],
  },
]
