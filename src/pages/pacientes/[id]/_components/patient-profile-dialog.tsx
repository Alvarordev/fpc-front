import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UserRound } from "lucide-react"
import { toast } from "sonner"
import { patientsApi, type PatientDetailsInput, type PatientDetailsResponse, type PatientHealthPhase, type PatientHealthSubcategory, type UpdatePatientInput } from "@/api/patients"
import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { FormModal } from "@/components/ds/form-modal"
import { is, type Group, type Values } from "@/components/ds/questions"
import { patientHealthPhaseLabels, patientHealthSubcategoriesByPhase, patientHealthSubcategoryLabels, patientHealthSubcategoryPhase, requiresActiveDiagnosis } from "@/lib/patient-health-subcategory"
import { DEPARTMENTS } from "@/pages/hospitales/_utils/departments"
import { UNKNOWN_BIRTH_DEPARTMENT } from "@/types"
import { documentNumberError, IDENTITY_DOCUMENT_OPTIONS, sanitizeDocumentNumber, type IdentityDocumentType } from "@/types/identity-document"
import { genderLabels } from "../_lib/clinical-labels"
import { compact, fromBool, text } from "../seguimientos/_components/ficha/answers"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }))

function groups(withDetails: boolean, hasDiagnosis: boolean): Group[] {
  const basics: Group[] = [
    {
      title: "Datos básicos",
      questions: [
        { id: "fullName", label: "Nombre completo", type: "text", required: true, wide: true },
        { id: "documentType", label: "Tipo de documento", type: "choice", options: IDENTITY_DOCUMENT_OPTIONS },
        { id: "dni", label: "Número de documento", type: "text", placeholder: "Solo dígitos" },
        { id: "birthDate", label: "Fecha de nacimiento", type: "date" },
        { id: "gender", label: "Género", type: "select", options: options(genderLabels) },
      ],
    },
    {
      title: "Contacto",
      questions: [
        { id: "primaryPhone", label: "Teléfono principal", type: "text", required: true },
        { id: "secondaryPhone", label: "Teléfono secundario", type: "text" },
        { id: "email", label: "Correo", type: "text", placeholder: "nombre@correo.com" },
        { id: "hasWhatsapp", label: "¿Tiene WhatsApp?", type: "yesno" },
      ],
    },
  ]
  if (!withDetails) return basics
  return [
    ...basics,
    {
      title: "Procedencia",
      questions: [
        { id: "bornInPeru", label: "¿Nació en el Perú?", type: "yesno" },
        {
          id: "birthDepartment",
          label: "Departamento de nacimiento",
          type: "select",
          options: [...DEPARTMENTS.map((d) => ({ value: d.value, label: d.label })), { value: UNKNOWN_BIRTH_DEPARTMENT, label: "No menciona" }],
          showIf: is("bornInPeru", "yes"),
        },
        { id: "birthCountry", label: "País de nacimiento", type: "select", catalog: "country", showIf: is("bornInPeru", "no") },
        { id: "nativeLanguage", label: "Lengua nativa", type: "select", catalog: "native_language" },
        { id: "translation", label: "¿Requiere traducción?", type: "yesno" },
        { id: "educationLevel", label: "Nivel educativo", type: "select", catalog: "education_level" },
      ],
    },
    {
      title: "Situación de salud",
      description: "La subcategoría se calcula con los tratamientos; cámbiala solo si no coincide con el caso.",
      questions: [
        { id: "primaryHealthCenterId", label: "Centro de salud principal", type: "select", catalog: HEALTH_CENTER, wide: true },
        { id: "healthPhase", label: "Fase de salud", type: "select", options: options(patientHealthPhaseLabels) },
        {
          id: "healthSubcategory",
          label: "Subcategoría",
          type: "select",
          optionsFrom: (v) =>
            (patientHealthSubcategoriesByPhase[v.healthPhase as PatientHealthPhase] ?? [])
              .filter((s) => hasDiagnosis || !requiresActiveDiagnosis(s))
              .map((s) => ({ value: s, label: patientHealthSubcategoryLabels[s] })),
          hint: hasDiagnosis ? undefined : "Las subcategorías oncológicas piden un diagnóstico activo.",
          showIf: (v) => Boolean(v.healthPhase),
        },
      ],
    },
  ]
}

function initialValues(p: PatientDetailsResponse): Values {
  const d = p.details
  return compact({
    fullName: p.fullName,
    documentType: p.documentType ?? "DNI",
    dni: p.dni,
    birthDate: p.birthDate,
    gender: p.gender,
    primaryPhone: p.primaryPhone,
    secondaryPhone: p.secondaryPhone,
    email: p.email,
    hasWhatsapp: fromBool(p.hasWhatsapp),
    bornInPeru: d?.birthCountry ? "no" : d?.birthDepartment ? "yes" : null,
    birthDepartment: d?.birthDepartment,
    birthCountry: d?.birthCountry,
    nativeLanguage: d?.nativeLanguage,
    translation: fromBool(d?.requiresTranslation ?? false),
    educationLevel: d?.educationLevel,
    primaryHealthCenterId: d?.primaryHealthCenterId,
    healthPhase: d?.healthPhase,
    healthSubcategory: d?.healthSubcategory,
  })
}

interface PatientProfileDialogProps {
  patient: PatientDetailsResponse
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PatientProfileDialog({ patient, open, onOpenChange }: PatientProfileDialogProps) {
  const queryClient = useQueryClient()
  const withDetails = patient.role === "PATIENT"
  const hasDiagnosis = patient.diagnoses.some((d) => d.isCurrent)

  const mutation = useMutation({
    mutationFn: async (v: Values) => {
      const documentType = (v.documentType ?? "DNI") as IdentityDocumentType
      const dni = text(v.dni)
      const patientInput: UpdatePatientInput = {
        fullName: v.fullName!.trim(),
        primaryPhone: v.primaryPhone!.trim(),
        secondaryPhone: text(v.secondaryPhone),
        ...(dni ? { documentType, dni } : { dni }),
        birthDate: v.birthDate ?? undefined,
        gender: v.gender ?? undefined,
        hasWhatsapp: v.hasWhatsapp === "yes",
        email: text(v.email),
      }
      await patientsApi.update(patient.id, patientInput)
      if (!withDetails) return
      const detailsInput: PatientDetailsInput = {
        ...(v.bornInPeru === "no" ? { birthCountry: v.birthCountry ?? undefined, birthDepartment: null } : v.bornInPeru === "yes" ? { birthDepartment: v.birthDepartment ?? undefined, birthCountry: null } : {}),
        // Solo si cambió: enviarla sin cambios la fijaría como manual.
        ...(v.healthPhase !== (patient.details?.healthPhase ?? null) || v.healthSubcategory !== (patient.details?.healthSubcategory ?? null)
          ? { healthPhase: (v.healthPhase as PatientHealthPhase) ?? undefined, healthSubcategory: (v.healthSubcategory as PatientHealthSubcategory) ?? null }
          : {}),
        primaryHealthCenterId: v.primaryHealthCenterId ?? undefined,
        nativeLanguage: v.nativeLanguage ?? undefined,
        educationLevel: (v.educationLevel ?? undefined) as PatientDetailsInput["educationLevel"],
        requiresTranslation: v.translation === "yes",
      }
      await patientsApi.updateDetails(patient.id, detailsInput)
    },
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["patient-profile", patient.id] }), queryClient.invalidateQueries({ queryKey: ["patients"] })])
      onOpenChange(false)
      toast.success("Perfil del paciente actualizado")
    },
    onError: (error) => toast.error("No se pudo actualizar el perfil", { description: error instanceof Error ? error.message : "Error inesperado" }),
  })

  if (!open) return null
  return (
    <FormModal
      icon={UserRound}
      title="Editar perfil del paciente"
      description="Identificación, contacto y procedencia"
      groups={groups(withDetails, hasDiagnosis)}
      initial={initialValues(patient)}
      submitLabel="Guardar cambios"
      pending={mutation.isPending}
      derive={(id, next) => {
        if (id === "dni" || id === "documentType") return { ...next, dni: next.dni ? sanitizeDocumentNumber((next.documentType ?? "DNI") as IdentityDocumentType, next.dni) : null }
        // Al cambiar de fase, la subcategoría anterior deja de aplicar.
        if (id === "healthPhase" && next.healthSubcategory && patientHealthSubcategoryPhase[next.healthSubcategory as PatientHealthSubcategory] !== next.healthPhase) return { ...next, healthSubcategory: null }
        return next
      }}
      onClose={() => onOpenChange(false)}
      onSubmit={(v) => {
        const documentError = documentNumberError((v.documentType ?? "DNI") as IdentityDocumentType, v.dni)
        if (documentError) return toast.error(documentError)
        if (v.email && !EMAIL.test(v.email.trim())) return toast.error("El correo no es válido. Revisa que tenga @ y dominio.")
        mutation.mutate(v)
      }}
    />
  )
}
