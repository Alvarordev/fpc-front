import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Pencil, User } from "lucide-react"
import {
  patientsApi,
  type CompanionPatient,
  type CreateCompanionInput,
  type PatientResponse,
  type UpdateCompanionLinkInput,
  type UpdatePatientInput,
} from "@/api/patients"
import { Badge } from "@/components/ui/badge"
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
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { genderLabels, relationshipLabels } from "../_lib/clinical-labels"

type ContactRole = "PRIMARY" | "SECONDARY"

type CompanionFormValues = {
  fullName: string
  dni: string
  birthDate: string
  gender: string
  primaryPhone: string
  secondaryPhone: string
  hasWhatsapp: boolean
  email: string
  relationship: string
  contactRole: ContactRole | ""
  isPrimaryContact: boolean
  isPrimaryInformant: boolean
  isCaregiver: boolean
}

type SelectOption = { value: string; label: string }

const GENDER_OPTIONS = Object.entries(genderLabels).map(([value, label]) => ({
  value,
  label,
}))

const RELATIONSHIP_OPTIONS = Object.entries(relationshipLabels).map(
  ([value, label]) => ({ value, label }),
)

const CONTACT_ROLE_OPTIONS: SelectOption[] = [
  { value: "PRIMARY", label: "Contacto principal" },
  { value: "SECONDARY", label: "Contacto secundario" },
]

const ACTIVITY_STATUS_LABELS: Record<
  PatientResponse["activityStatus"],
  string
> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  REACTIVE: "Reactivo",
}

const STATUS_LABELS: Record<PatientResponse["status"], string> = {
  ENROLLED: "Enrolado",
  UNENROLLED: "No enrolado",
}

const DEACTIVATION_REASON_LABELS: Record<string, string> = {
  DECEASED: "Fallecimiento",
  WITHDREW_CONSENT: "Retiró su consentimiento",
  LOST_CONTACT: "Pérdida de contacto",
  TRANSFERRED_OUT: "Traslado",
  OTHER: "Otro",
}

const DEFAULT_FORM_VALUES: CompanionFormValues = {
  fullName: "",
  dni: "",
  birthDate: "",
  gender: "",
  primaryPhone: "",
  secondaryPhone: "",
  hasWhatsapp: false,
  email: "",
  relationship: "",
  contactRole: "",
  isPrimaryContact: false,
  isPrimaryInformant: false,
  isCaregiver: false,
}

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

function formatDate(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-"
}

function personFromLink(
  link: CompanionPatient,
  person?: PatientResponse,
): CompanionFormValues {
  return {
    fullName: person?.fullName ?? link.companionDisplayName ?? "",
    dni: person?.dni ?? "",
    birthDate: person?.birthDate ?? "",
    gender: person?.gender ?? "",
    primaryPhone: person?.primaryPhone ?? "",
    secondaryPhone: person?.secondaryPhone ?? "",
    hasWhatsapp: person?.hasWhatsapp ?? false,
    email: person?.email ?? "",
    relationship: link.relationship ?? "",
    contactRole: link.contactRole ?? "",
    isPrimaryContact: link.isPrimaryContact,
    isPrimaryInformant: link.isPrimaryInformant,
    isCaregiver: link.isCaregiver,
  }
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string | ReactNode | null | undefined
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{value ?? "-"}</div>
    </div>
  )
}

function companionName(link: CompanionPatient, person?: PatientResponse) {
  return person?.fullName ?? link.companionDisplayName ?? "Acompañante"
}

interface PatientCompanionDialogProps {
  patientId: string
  companion: CompanionPatient | null
  existingCompanions: CompanionPatient[]
  canEdit: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

function contactRoleTaken(
  companions: CompanionPatient[],
  role: ContactRole,
  excludeLinkId?: string,
) {
  return companions.some(
    (link) =>
      link.id !== excludeLinkId &&
      (link.contactRole === role ||
        (role === "PRIMARY" && link.isPrimaryContact)),
  )
}

function buildCompanionInput(values: CompanionFormValues): CreateCompanionInput {
  return {
    fullName: values.fullName.trim(),
    primaryPhone: values.primaryPhone.trim(),
    secondaryPhone: optionalText(values.secondaryPhone),
    dni: optionalText(values.dni),
    birthDate: optionalText(values.birthDate),
    gender: optionalText(values.gender),
    hasWhatsapp: values.hasWhatsapp,
    email: optionalText(values.email),
    relationship: optionalText(values.relationship),
    contactRole: values.contactRole || null,
    isPrimaryContact: values.isPrimaryContact,
    isPrimaryInformant: values.isPrimaryInformant,
    isCaregiver: values.isCaregiver,
  }
}

export function PatientCompanionDialog({
  patientId,
  companion,
  existingCompanions,
  canEdit,
  open,
  onOpenChange,
}: PatientCompanionDialogProps) {
  const isCreateMode = companion === null
  const queryClient = useQueryClient()
  const companionQuery = useQuery({
    queryKey: ["patient-profile", companion?.companionId],
    queryFn: async () => {
      const result = await patientsApi.getById(companion!.companionId)
      return result
    },
    enabled: open && !isCreateMode && !companion?.companion,
    staleTime: 30_000,
  })
  const person = companion?.companion ?? companionQuery.data

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CompanionFormValues>({ defaultValues: DEFAULT_FORM_VALUES })
  const gender = useWatch({ control, name: "gender" }) ?? ""
  const relationship = useWatch({ control, name: "relationship" }) ?? ""
  const contactRole = useWatch({ control, name: "contactRole" }) ?? ""
  const hasWhatsapp = useWatch({ control, name: "hasWhatsapp" }) ?? false
  const isPrimaryContact =
    useWatch({ control, name: "isPrimaryContact" }) ?? false
  const isPrimaryInformant =
    useWatch({ control, name: "isPrimaryInformant" }) ?? false
  const isCaregiver = useWatch({ control, name: "isCaregiver" }) ?? false
  const [isEditing, setIsEditing] = useState(isCreateMode)

  useEffect(() => {
    if (open) {
      if (isCreateMode) {
        reset(DEFAULT_FORM_VALUES)
        setIsEditing(true)
      } else if (companion) {
        reset(personFromLink(companion, person))
        setIsEditing(false)
      }
    }
  }, [companion, isCreateMode, open, person, reset])

  const genderItems = withCurrentOption(GENDER_OPTIONS, gender)
  const relationshipItems = withCurrentOption(
    RELATIONSHIP_OPTIONS,
    relationship,
  )
  const availableContactRoles = CONTACT_ROLE_OPTIONS.filter((option) => {
    if (
      option.value === "PRIMARY" &&
      contactRoleTaken(existingCompanions, "PRIMARY", companion?.id)
    ) {
      return false
    }
    if (
      option.value === "SECONDARY" &&
      contactRoleTaken(existingCompanions, "SECONDARY", companion?.id)
    ) {
      return false
    }
    return true
  })

  const invalidateCompanionQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["patient-profile", patientId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["patient-companions", patientId],
      }),
      queryClient.invalidateQueries({ queryKey: ["patients"] }),
      ...(companion
        ? [
            queryClient.invalidateQueries({
              queryKey: ["patient-profile", companion.companionId],
            }),
          ]
        : []),
    ])
  }

  const createMutation = useMutation({
    mutationFn: async (values: CompanionFormValues) => {
      if (
        values.contactRole === "PRIMARY" &&
        contactRoleTaken(existingCompanions, "PRIMARY")
      ) {
        throw new Error("Ya existe un contacto principal para este paciente")
      }
      if (
        values.contactRole === "SECONDARY" &&
        contactRoleTaken(existingCompanions, "SECONDARY")
      ) {
        throw new Error("Ya existe un contacto secundario para este paciente")
      }
      await patientsApi.createCompanion(patientId, buildCompanionInput(values))
    },
    onSuccess: async () => {
      await invalidateCompanionQueries()
      onOpenChange(false)
      toast.success("Acompañante agregado")
    },
    onError: (error) => {
      toast.error("No se pudo agregar el acompañante", {
        description:
          error instanceof Error ? error.message : "Error inesperado",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (values: CompanionFormValues) => {
      if (!companion) return
      if (
        values.contactRole === "PRIMARY" &&
        contactRoleTaken(existingCompanions, "PRIMARY", companion.id)
      ) {
        throw new Error("Ya existe un contacto principal para este paciente")
      }
      if (
        values.contactRole === "SECONDARY" &&
        contactRoleTaken(existingCompanions, "SECONDARY", companion.id)
      ) {
        throw new Error("Ya existe un contacto secundario para este paciente")
      }
      const personInput: UpdatePatientInput = {
        fullName: values.fullName.trim(),
        primaryPhone: values.primaryPhone.trim(),
        secondaryPhone: optionalText(values.secondaryPhone),
        dni: optionalText(values.dni),
        birthDate: optionalText(values.birthDate),
        gender: optionalText(values.gender),
        hasWhatsapp: values.hasWhatsapp,
        email: optionalText(values.email),
      }
      const linkInput: UpdateCompanionLinkInput = {
        relationship: optionalText(values.relationship),
        contactRole: values.contactRole || null,
        isPrimaryContact: values.isPrimaryContact,
        isPrimaryInformant: values.isPrimaryInformant,
        isCaregiver: values.isCaregiver,
      }

      await patientsApi.update(companion.companionId, personInput)
      await patientsApi.updateCompanionLink(patientId, companion.id, linkInput)
    },
    onSuccess: async () => {
      await invalidateCompanionQueries()
      setIsEditing(false)
      onOpenChange(false)
      toast.success("Acompañante actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el acompañante", {
        description:
          error instanceof Error ? error.message : "Error inesperado",
      })
    },
  })

  function handleDialogChange(nextOpen: boolean) {
    if (!updateMutation.isPending && !createMutation.isPending) onOpenChange(nextOpen)
  }

  function cancelEditing() {
    if (isCreateMode) {
      onOpenChange(false)
      return
    }
    if (companion) reset(personFromLink(companion, person))
    setIsEditing(false)
  }

  const isPending = updateMutation.isPending || createMutation.isPending
  const isLoadingPerson = !isCreateMode && !person && companionQuery.isLoading
  const hasPersonError = !isCreateMode && !person && companionQuery.isError
  const name = companion ? companionName(companion, person) : "Nuevo acompañante"

  const formContent = (
    <form
      onSubmit={handleSubmit((values) => {
        if (isCreateMode && !values.relationship.trim()) {
          setError("relationship", {
            type: "required",
            message: "El parentesco es obligatorio",
          })
          return
        }
        if (isCreateMode) {
          createMutation.mutate(values)
        } else {
          updateMutation.mutate(values)
        }
      })}
      className="space-y-5"
    >
            <section className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Datos personales
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companion-full-name">Nombre completo</Label>
                  <Input
                    id="companion-full-name"
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
                  <Label htmlFor="companion-dni">DNI</Label>
                  <Input id="companion-dni" {...register("dni")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companion-birth-date">
                    Fecha de nacimiento
                  </Label>
                  <Input
                    id="companion-birth-date"
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
                    <SelectTrigger id="companion-gender">
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
                  <Label htmlFor="companion-primary-phone">
                    Teléfono principal
                  </Label>
                  <Input
                    id="companion-primary-phone"
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
                  <Label htmlFor="companion-secondary-phone">
                    Teléfono secundario
                  </Label>
                  <Input
                    id="companion-secondary-phone"
                    {...register("secondaryPhone")}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companion-email">Email</Label>
                  <Input
                    id="companion-email"
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

            <section className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Relación con el paciente
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Parentesco</Label>
                  <Select
                    items={relationshipItems}
                    value={relationship}
                    onValueChange={(value) =>
                      setValue("relationship", value ?? "", {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="companion-relationship">
                      <SelectValue placeholder="Seleccionar parentesco" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {relationshipItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.relationship && (
                    <p className="text-destructive text-xs">
                      {errors.relationship.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Rol de contacto</Label>
                  <Select
                    items={availableContactRoles}
                    value={contactRole}
                    onValueChange={(value) =>
                      setValue("contactRole", (value ?? "") as ContactRole | "")
                    }
                  >
                    <SelectTrigger id="companion-contact-role">
                      <SelectValue placeholder="Sin rol de contacto" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableContactRoles.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-5">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={isPrimaryContact}
                    onCheckedChange={(checked) =>
                      setValue("isPrimaryContact", checked === true)
                    }
                  />
                  Contacto principal
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={isPrimaryInformant}
                    onCheckedChange={(checked) =>
                      setValue("isPrimaryInformant", checked === true)
                    }
                  />
                  Informante principal
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={isCaregiver}
                    onCheckedChange={(checked) =>
                      setValue("isCaregiver", checked === true)
                    }
                  />
                  Cuidador
                </label>
              </div>
            </section>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={cancelEditing}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Guardando..."
                  : isCreateMode
                    ? "Agregar acompañante"
                    : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
  )

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isCreateMode
              ? "Agregar acompañante"
              : isEditing
                ? "Editar acompañante"
                : name}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode || isEditing
              ? "Registra los datos personales y la relación con el paciente."
              : "Información personal y relación registrada con este paciente."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingPerson ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Cargando datos del acompañante...
          </div>
        ) : isEditing ? (
          formContent
        ) : companion ? (
          <>
            {hasPersonError ? (
              <p className="text-destructive py-4 text-sm">
                No se pudieron cargar los datos personales del acompañante.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
                    <User className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold">{name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        Acompañante
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {
                          ACTIVITY_STATUS_LABELS[
                            person?.activityStatus ?? "ACTIVE"
                          ]
                        }
                      </Badge>
                    </div>
                  </div>
                </div>

                <section className="space-y-3">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Datos personales y contacto
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Detail label="DNI" value={person?.dni} />
                    <Detail
                      label="Fecha de nacimiento"
                      value={formatDate(person?.birthDate)}
                    />
                    <Detail
                      label="Género"
                      value={
                        person?.gender
                          ? (genderLabels[person.gender] ?? person.gender)
                          : null
                      }
                    />
                    <Detail
                      label="Teléfono principal"
                      value={person?.primaryPhone}
                    />
                    <Detail
                      label="Teléfono secundario"
                      value={person?.secondaryPhone}
                    />
                    <Detail
                      label="WhatsApp"
                      value={person?.hasWhatsapp ? "Sí" : "No"}
                    />
                    <Detail label="Email" value={person?.email} />
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Relación con el paciente
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Detail
                      label="Parentesco"
                      value={
                        companion.relationship
                          ? (relationshipLabels[companion.relationship] ??
                            companion.relationship)
                          : null
                      }
                    />
                    <Detail
                      label="Rol de contacto"
                      value={
                        companion.contactRole === "PRIMARY"
                          ? "Contacto principal"
                          : companion.contactRole === "SECONDARY"
                            ? "Contacto secundario"
                            : null
                      }
                    />
                    <Detail
                      label="Contacto principal"
                      value={companion.isPrimaryContact ? "Sí" : "No"}
                    />
                    <Detail
                      label="Informante principal"
                      value={companion.isPrimaryInformant ? "Sí" : "No"}
                    />
                    <Detail
                      label="Cuidador"
                      value={companion.isCaregiver ? "Sí" : "No"}
                    />
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Estado del registro
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Detail
                      label="Estado de enrolamiento"
                      value={
                        person?.status ? STATUS_LABELS[person.status] : null
                      }
                    />
                    <Detail
                      label="Registrado"
                      value={formatDate(person?.createdAt)}
                    />
                    <Detail
                      label="Última actualización"
                      value={formatDate(person?.updatedAt)}
                    />
                    {person?.deactivationReason && (
                      <Detail
                        label="Motivo de desactivación"
                        value={
                          DEACTIVATION_REASON_LABELS[
                            person.deactivationReason
                          ] ?? person.deactivationReason
                        }
                      />
                    )}
                    {person?.deactivationReasonDetail && (
                      <Detail
                        label="Detalle de desactivación"
                        value={person.deactivationReasonDetail}
                      />
                    )}
                    {person?.deactivatedAt && (
                      <Detail
                        label="Fecha de desactivación"
                        value={formatDate(person.deactivatedAt)}
                      />
                    )}
                    {person?.deceasedAt && (
                      <Detail
                        label="Fecha de fallecimiento"
                        value={formatDate(person.deceasedAt)}
                      />
                    )}
                  </div>
                </section>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
              >
                Cerrar
              </Button>
              {canEdit && person && (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={hasPersonError}
                >
                  <Pencil className="size-3.5" />
                  Editar acompañante
                </Button>
              )}
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
