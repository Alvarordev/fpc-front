import type { Group, Values } from "@/components/ds/questions"

const GENDER = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "OTHER", label: "Otro" },
]

const family = (values: Values) => values.affiliation === "FAMILY"
const patient = (values: Values) => values.affiliation === "PATIENT"

export const identificacionGroups: Group[] = [
  {
    title: "Relación con el paciente",
    questions: [
      {
        id: "isPatient",
        label: "¿Usted es paciente oncológico?",
        type: "choice",
        wide: true,
        showIf: patient,
        options: [
          { value: "yes", label: "Sí, soy paciente oncológico" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "isFamily",
        label: "¿Usted es familiar del paciente oncológico?",
        type: "choice",
        wide: true,
        showIf: family,
        options: [
          { value: "yes", label: "Sí, soy familiar" },
          { value: "no", label: "No, soy amigo u otra persona" },
        ],
      },
      { id: "callerName", label: "Nombre completo de quien llama", type: "text", required: true, placeholder: "Nombre y apellidos", showIf: family },
      { id: "callerRelationship", label: "Parentesco con el paciente", type: "select", catalog: "companion_relationship", required: true, placeholder: "Seleccionar...", showIf: family },
      { id: "callerDni", label: "DNI", type: "text", placeholder: "74829304", showIf: family },
      { id: "callerBirth", label: "Fecha de nacimiento", type: "date", showIf: family },
      { id: "callerGender", label: "Género de quien llama", type: "choice", options: GENDER, showIf: family },
      { id: "callerPhone", label: "Teléfono principal", type: "text", required: true, placeholder: "999 000 777", showIf: family },
      { id: "callerPhone2", label: "Teléfono adicional o fijo", type: "text", placeholder: "01 555 1234", showIf: family },
      {
        id: "callerWhatsapp",
        label: "¿Tiene WhatsApp?",
        type: "choice",
        showIf: family,
        options: [
          { value: "yes", label: "Sí" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },
]

export function validateIdentificacion(values: Values): string | null {
  if (values.affiliation !== "FAMILY") return null
  const whitespace =
    (!!values.callerName && !values.callerName.trim()) ||
    (!!values.callerPhone && !values.callerPhone.trim()) ||
    (!!values.callerRelationship && !values.callerRelationship.trim())
  return whitespace ? "Ingrese el nombre, teléfono y parentesco de quien llama" : null
}
