import { is, type Group } from "@/components/ds/questions"
import type { User } from "@/api/users"

export const userRoleLabels: Record<User["role"], string> = {
  ADMIN: "Administrador",
  AGENT: "Agente",
  VOLUNTEER: "Voluntario",
  FOUNDATION: "Fundación",
}

const roleOptions = (Object.entries(userRoleLabels) as [User["role"], string][]).map(([value, label]) => ({
  value,
  label,
}))

const profileIf = is("role", "AGENT", "FOUNDATION", "VOLUNTEER")
const volunteerIf = is("role", "VOLUNTEER")

export function userCreateGroups(): Group[] {
  return [
    {
      title: "Cuenta",
      questions: [
        { id: "email", label: "Correo", type: "text", required: true, wide: true, placeholder: "nombre@fpc.pe" },
        { id: "password", label: "Contraseña", type: "password", required: true, wide: true, hint: "Mínimo 8 caracteres" },
        { id: "role", label: "Rol", type: "choice", required: true, wide: true, options: roleOptions },
      ],
    },
    ...sharedProfileGroups(),
  ]
}

export function userEditGroups(): Group[] {
  return [
    {
      title: "Cuenta",
      questions: [{ id: "email", label: "Correo", type: "text", required: true, wide: true }],
    },
    ...sharedProfileGroups(),
  ]
}

function sharedProfileGroups(): Group[] {
  return [
    {
      title: "Perfil",
      showIf: profileIf,
      questions: [
        { id: "firstName", label: "Nombre", type: "text", required: true },
        { id: "lastName", label: "Apellido", type: "text", required: true },
        { id: "phone", label: "Teléfono", type: "text", required: true, hint: "Mínimo 9 dígitos" },
      ],
    },
    {
      title: "Voluntariado",
      showIf: volunteerIf,
      questions: [
        { id: "specialty", label: "Especialidad", type: "text", required: true, wide: true },
        { id: "birthDate", label: "Fecha de nacimiento", type: "date" },
        { id: "commitmentStartAt", label: "Inicio del acta", type: "date" },
        { id: "commitmentEndAt", label: "Fin del acta", type: "date" },
        { id: "hasVolunteerCertificate", label: "¿Tiene certificado de voluntariado?", type: "yesno", wide: true },
        { id: "completedSustainabilityModule", label: "¿Completó el módulo de sostenibilidad?", type: "yesno", wide: true },
        { id: "completedDesignThinkingModule", label: "¿Completó el módulo de design thinking?", type: "yesno", wide: true },
        { id: "additionalComments", label: "Comentarios", type: "textarea", wide: true },
      ],
    },
  ]
}

export function yesToBool(value: string | null | undefined) {
  return value === "yes"
}

export function boolToYes(value: boolean | null | undefined) {
  if (value == null) return null
  return value ? "yes" : "no"
}
