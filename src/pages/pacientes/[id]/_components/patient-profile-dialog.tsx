import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  patientsApi,
  type PatientDetailsInput,
  type PatientDetailsResponse,
  type PatientHealthPhase,
  type PatientHealthSubcategory,
  type UpdatePatientInput,
} from "@/api/patients"
import { healthCentersApi } from "@/api/health-centers"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEPARTMENTS,
  DEPARTMENT_LABELS,
} from "@/pages/hospitales/_utils/departments"
import { educationLabels, genderLabels } from "../_lib/clinical-labels"
import {
  patientHealthPhaseLabels,
  patientHealthSubcategoryOptions,
  patientHealthSubcategoryPhase,
  requiresActiveDiagnosis,
} from "@/lib/patient-health-subcategory"

type EducationValue = NonNullable<PatientDetailsInput["educationLevel"]>
type HealthPhaseValue = PatientHealthPhase
type HealthSubcategoryValue = PatientHealthSubcategory | "UNASSIGNED"

export type PatientProfileFormValues = {
  fullName: string
  dni: string
  birthDate: string
  gender: string
  primaryPhone: string
  secondaryPhone: string
  hasWhatsapp: boolean
  email: string
  birthDepartment: string
  healthPhase: HealthPhaseValue | ""
  healthSubcategory: HealthSubcategoryValue
  primaryHealthCenterId: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactGender: string
  nativeLanguage: string
  educationLevel: EducationValue | ""
  requiresTranslation: boolean
}

type SelectOption = { value: string; label: string }

const DEFAULT_FORM_VALUES: PatientProfileFormValues = {
  fullName: "",
  dni: "",
  birthDate: "",
  gender: "",
  primaryPhone: "",
  secondaryPhone: "",
  hasWhatsapp: false,
  email: "",
  birthDepartment: "",
  healthPhase: "",
  healthSubcategory: "UNASSIGNED",
  primaryHealthCenterId: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactGender: "",
  nativeLanguage: "",
  educationLevel: "",
  requiresTranslation: false,
}

const GENDER_OPTIONS = Object.entries(genderLabels).map(([value, label]) => ({
  value,
  label,
}))

const EDUCATION_OPTIONS = Object.entries(educationLabels).map(
  ([value, label]) => ({ value, label }),
)

const HEALTH_PHASE_OPTIONS: { value: HealthPhaseValue; label: string }[] = [
  { value: "CANCER_DIAGNOSIS", label: "Diagnóstico de Cáncer" },
  { value: "ANNUAL_CHECKUP", label: "Control Anual" },
  { value: "SIGNS_AND_SYMPTOMS", label: "Signos y Síntomas" },
]

const HEALTH_SUBCATEGORY_OPTIONS = [
  { value: "UNASSIGNED" as const, label: "Sin subcategoría" },
  ...patientHealthSubcategoryOptions.map(({ value, label }) => ({
    value,
    label,
  })),
]

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

function withCurrentOption(
  options: readonly SelectOption[],
  value: string,
  label?: string,
) {
  if (!value || options.some((option) => option.value === value)) {
    return [...options]
  }

  return [{ value, label: label ?? value }, ...options]
}

function formValuesFromPatient(
  patient: PatientDetailsResponse,
): PatientProfileFormValues {
  return {
    fullName: patient.fullName,
    dni: patient.dni ?? "",
    birthDate: patient.birthDate ?? "",
    gender: patient.gender ?? "",
    primaryPhone: patient.primaryPhone ?? "",
    secondaryPhone: patient.secondaryPhone ?? "",
    hasWhatsapp: patient.hasWhatsapp,
    email: patient.email ?? "",
    birthDepartment: patient.details?.birthDepartment ?? "",
    healthPhase: patient.details?.healthPhase ?? "",
    healthSubcategory: patient.details?.healthSubcategory ?? "UNASSIGNED",
    primaryHealthCenterId: patient.details?.primaryHealthCenterId ?? "",
    emergencyContactName: patient.details?.emergencyContactName ?? "",
    emergencyContactPhone: patient.details?.emergencyContactPhone ?? "",
    emergencyContactGender: patient.details?.emergencyContactGender ?? "",
    nativeLanguage: patient.details?.nativeLanguage ?? "",
    educationLevel: patient.details?.educationLevel ?? "",
    requiresTranslation: patient.details?.requiresTranslation ?? false,
  }
}

interface PatientProfileDialogProps {
  patient: PatientDetailsResponse
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PatientProfileDialog({
  patient,
  open,
  onOpenChange,
}: PatientProfileDialogProps) {
  const queryClient = useQueryClient()
  const canEditDetails = patient.role === "PATIENT"
  const { data: healthCenters = [] } = useQuery({
    queryKey: ["health-centers"],
    queryFn: () => healthCentersApi.list(),
    enabled: open && canEditDetails,
    staleTime: 5 * 60 * 1000,
  })
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PatientProfileFormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
  })

  const formValues = useWatch({ control })
  const gender = formValues.gender ?? ""
  const birthDepartment = formValues.birthDepartment ?? ""
  const healthPhase = formValues.healthPhase ?? ""
  const healthSubcategory = formValues.healthSubcategory ?? "UNASSIGNED"
  const primaryHealthCenterId = formValues.primaryHealthCenterId ?? ""
  const educationLevel = formValues.educationLevel ?? ""
  const hasWhatsapp = formValues.hasWhatsapp ?? false
  const requiresTranslation = formValues.requiresTranslation ?? false
  const hasActiveDiagnosis = patient.diagnoses.some(
    (diagnosis) => diagnosis.isCurrent,
  )

  const genderItems = withCurrentOption(
    GENDER_OPTIONS,
    gender,
    genderLabels[gender],
  )
  const departmentItems = withCurrentOption(
    DEPARTMENTS,
    birthDepartment,
    DEPARTMENT_LABELS[birthDepartment],
  )
  const educationItems = withCurrentOption(EDUCATION_OPTIONS, educationLevel)
  const healthCenterItems = withCurrentOption(
    healthCenters
      .filter((center) => center.isActive)
      .map((center) => ({
        value: center.id,
        label: `${center.name} - ${DEPARTMENT_LABELS[center.department] ?? center.department}`,
      })),
    primaryHealthCenterId,
    patient.details?.primaryHealthCenterName ?? "Centro actual",
  )

  useEffect(() => {
    if (open) reset(formValuesFromPatient(patient))
  }, [open, patient, reset])

  const updateMutation = useMutation({
    mutationFn: async (values: PatientProfileFormValues) => {
      const patientInput: UpdatePatientInput = {
        fullName: values.fullName.trim(),
        primaryPhone: values.primaryPhone.trim(),
        secondaryPhone: optionalText(values.secondaryPhone),
        dni: optionalText(values.dni),
        birthDate: optionalText(values.birthDate),
        gender: optionalText(values.gender),
        hasWhatsapp: values.hasWhatsapp,
        email: optionalText(values.email),
      }

      await patientsApi.update(patient.id, patientInput)

      if (canEditDetails) {
        const detailsInput: PatientDetailsInput = {
          birthDepartment: optionalText(values.birthDepartment),
          healthPhase: values.healthPhase || undefined,
          healthSubcategory:
            values.healthSubcategory === "UNASSIGNED"
              ? null
              : values.healthSubcategory,
          primaryHealthCenterId: optionalText(values.primaryHealthCenterId),
          emergencyContactName: optionalText(values.emergencyContactName),
          emergencyContactPhone: optionalText(values.emergencyContactPhone),
          emergencyContactGender: optionalText(values.emergencyContactGender),
          nativeLanguage: optionalText(values.nativeLanguage),
          educationLevel: values.educationLevel || undefined,
          requiresTranslation: values.requiresTranslation,
        }

        await patientsApi.updateDetails(patient.id, detailsInput)
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patient-profile", patient.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["patients"] }),
      ])
      onOpenChange(false)
      toast.success("Perfil del paciente actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el perfil", {
        description:
          error instanceof Error ? error.message : "Error inesperado",
      })
    },
  })

  function handleDialogChange(nextOpen: boolean) {
    if (!updateMutation.isPending) onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar perfil del paciente</DialogTitle>
          <DialogDescription>
            Corrige los datos de identificación y contacto registrados.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
          className="space-y-5"
        >
          <section className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Datos básicos
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="patient-full-name">Nombre completo</Label>
                <Input
                  id="patient-full-name"
                  autoFocus
                  {...register("fullName", {
                    required: "El nombre completo es obligatorio",
                    validate: (value) =>
                      value.trim().length > 0 ||
                      "El nombre completo es obligatorio",
                  })}
                />
                {errors.fullName && (
                  <p className="text-destructive text-xs">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-dni">DNI</Label>
                <Input id="patient-dni" {...register("dni")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-birth-date">Fecha de nacimiento</Label>
                <Input
                  id="patient-birth-date"
                  type="date"
                  {...register("birthDate")}
                />
              </div>
              <div className="space-y-2">
                <Label>Género</Label>
                <Select
                  items={genderItems}
                  value={gender}
                  onValueChange={(value) => setValue("gender", value ?? "")}
                >
                  <SelectTrigger id="patient-gender">
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Contacto
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patient-primary-phone">
                  Teléfono principal
                </Label>
                <Input
                  id="patient-primary-phone"
                  {...register("primaryPhone", {
                    required: "El teléfono principal es obligatorio",
                    validate: (value) =>
                      value.trim().length > 0 ||
                      "El teléfono principal es obligatorio",
                  })}
                />
                {errors.primaryPhone && (
                  <p className="text-destructive text-xs">
                    {errors.primaryPhone.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-secondary-phone">
                  Teléfono secundario
                </Label>
                <Input
                  id="patient-secondary-phone"
                  {...register("secondaryPhone")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="patient-email">Email</Label>
                <Input
                  id="patient-email"
                  type="email"
                  {...register("email", {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Ingresa un email válido",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-destructive text-xs">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <Checkbox
                  checked={hasWhatsapp}
                  onCheckedChange={(checked) =>
                    setValue("hasWhatsapp", checked === true)
                  }
                />
                Tiene WhatsApp
              </label>
            </div>
          </section>

          {canEditDetails && (
            <section className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Datos de procedencia y residencia
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Departamento de nacimiento</Label>
                  <Select
                    items={departmentItems}
                    value={birthDepartment}
                    onValueChange={(value) =>
                      setValue("birthDepartment", value ?? "")
                    }
                  >
                    <SelectTrigger id="patient-birth-department">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {departmentItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Centro de salud principal</Label>
                  <Select
                    items={healthCenterItems}
                    value={primaryHealthCenterId}
                    onValueChange={(value) =>
                      setValue("primaryHealthCenterId", value ?? "")
                    }
                  >
                    <SelectTrigger id="patient-primary-health-center">
                      <SelectValue placeholder="Seleccionar centro" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {healthCenterItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fase de salud</Label>
                  <Select
                    items={HEALTH_PHASE_OPTIONS}
                    value={healthPhase}
                    onValueChange={(value) => {
                      const nextPhase = (value ?? "") as HealthPhaseValue | ""
                      setValue("healthPhase", nextPhase)
                      if (
                        nextPhase &&
                        healthSubcategory !== "UNASSIGNED" &&
                        patientHealthSubcategoryPhase[healthSubcategory] !==
                          nextPhase
                      ) {
                        setValue("healthSubcategory", "UNASSIGNED")
                      }
                    }}
                  >
                    <SelectTrigger id="patient-health-phase">
                      <SelectValue placeholder="Seleccionar fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEALTH_PHASE_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategoría</Label>
                  <Select
                    items={HEALTH_SUBCATEGORY_OPTIONS}
                    value={healthSubcategory}
                    onValueChange={(value) => {
                      if (!value || value === "UNASSIGNED") {
                        setValue("healthSubcategory", "UNASSIGNED")
                        return
                      }
                      const nextSubcategory = value as PatientHealthSubcategory
                      setValue("healthSubcategory", nextSubcategory)
                      setValue(
                        "healthPhase",
                        patientHealthSubcategoryPhase[nextSubcategory],
                      )
                    }}
                  >
                    <SelectTrigger id="patient-health-subcategory">
                      <SelectValue placeholder="Seleccionar subcategoría" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {HEALTH_SUBCATEGORY_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={
                            option.value !== "UNASSIGNED" &&
                            requiresActiveDiagnosis(option.value) &&
                            !hasActiveDiagnosis
                          }
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Fase de salud:{" "}
                    {healthPhase
                      ? patientHealthPhaseLabels[healthPhase]
                      : "Sin clasificar"}
                  </p>
                  {!hasActiveDiagnosis && (
                    <p className="text-muted-foreground text-xs">
                      Agrega un diagnóstico activo para usar las subcategorías
                      oncológicas.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Nivel educativo</Label>
                  <Select
                    items={educationItems}
                    value={educationLevel}
                    onValueChange={(value) =>
                      setValue(
                        "educationLevel",
                        (value ?? "") as EducationValue | "",
                      )
                    }
                  >
                    <SelectTrigger id="patient-education-level">
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {educationItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient-native-language">Lengua nativa</Label>
                  <Input
                    id="patient-native-language"
                    {...register("nativeLanguage")}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={requiresTranslation}
                  onCheckedChange={(checked) =>
                    setValue("requiresTranslation", checked === true)
                  }
                />
                Requiere traducción
              </label>
            </section>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
