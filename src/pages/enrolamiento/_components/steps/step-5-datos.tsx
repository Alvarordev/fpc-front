import { useState, type FormEvent } from "react"
import {
  CreditCard,
  GraduationCap,
  LogIn,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react"
import { DurationInput } from "@/components/duration-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  EducationLevel,
  EnrollmentAddressRequest,
  EnrollmentContactSource,
  EpsProvider,
  InsuranceType,
  PeruDepartment,
} from "@/types"
import {
  genderLabels,
  normalizeZoneType,
  relationshipSelectOptions,
} from "@/pages/pacientes/[id]/_lib/clinical-labels"
import { DEPARTMENTS } from "@/pages/hospitales/_utils/departments"
import { SectionHeader, StepHeader, StepNav } from "../shared"
import {
  type CompanionDraft,
  useEnrollmentStore,
} from "../../_store/enrollment-store"
import { isMinor } from "../../_utils/patient-age"

const fl =
  "text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70"
const ic = "bg-card border"
const sc = "w-full bg-card border"

const EDU: Record<EducationLevel, string> = {
  NONE: "Sin estudios",
  INITIAL: "Inicial",
  PRIMARY_INCOMPLETE: "Primaria incompleta",
  PRIMARY: "Primaria",
  SECONDARY_INCOMPLETE: "Secundaria incompleta",
  SECONDARY: "Secundaria",
  TECHNICAL_INCOMPLETE: "Técnica incompleta",
  TECHNICAL: "Técnica",
  HIGHER_INCOMPLETE: "Superior incompleta",
  HIGHER: "Superior",
}

const INS: Record<InsuranceType, string> = {
  SIS: "SIS",
  ESSALUD: "EsSalud",
  EPS: "EPS",
  FUERZAS_ARMADAS: "Fuerzas Armadas",
  SALUDPOL: "SaludPol",
  NONE: "Ninguno",
}

const EPS_LABELS: Record<EpsProvider, string> = {
  PACIFICO: "Pacífico",
  RIMAC: "Rímac",
  MAPFRE: "Mapfre",
  LA_POSITIVA: "La Positiva",
  SANITAS: "Sanitas",
  ONCOSALUD: "Oncosalud",
  OTHER: "Otro",
}

const ENTRY_POINTS = [
  "Llamada directa",
  "Referido por paciente",
  "Referido por Voluntario",
  "Redes Sociales de FPC",
  "Campaña prevención",
  "Centro de salud/hospital",
  "Otro",
] as const

const ZONE_TYPES = [
  { value: "URBAN", label: "Urbana" },
  { value: "RURAL", label: "Rural" },
] as const

const NATIVE_LANGUAGES = [
  "Castellano",
  "Quechua",
  "Aymara",
  "Lenguaje de Señas",
  "Otros",
] as const

const YES_NO_OPTIONS = [
  { value: "Sí", label: "Sí" },
  { value: "No", label: "No" },
] as const

const CONTACT_SOURCE_LABELS: Record<EnrollmentContactSource, string> = {
  PATIENT: "El paciente",
  CALLER: "La persona que llama",
  NEW: "Registrar un acompañante",
}

const EMPTY_CONTACT: CompanionDraft = {
  fullName: "",
  primaryPhone: "",
}

function isValidLocationUrl(value: string | undefined) {
  if (!value?.trim()) return true
  try {
    const url = new URL(value.trim())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function relationshipSelectValue(relationship?: string) {
  if (!relationship) return ""
  if (relationshipSelectOptions.some((option) => option.value === relationship)) {
    return relationship
  }
  return "OTHER"
}

function relationshipOtherText(relationship?: string) {
  if (!relationship) return ""
  if (relationshipSelectOptions.some((option) => option.value === relationship)) {
    return ""
  }
  return relationship
}

interface ContactPersonFieldsProps {
  person: CompanionDraft
  onChange: (partial: Partial<CompanionDraft>) => void
  title: string
}

function ContactPersonFields({
  person,
  onChange,
  title,
}: ContactPersonFieldsProps) {
  const relationshipValue = relationshipSelectValue(person.relationship)
  const otherText = relationshipOtherText(person.relationship)

  return (
    <div className="border-border/70 bg-muted/20 rounded-xl border p-4">
      <p className="mb-4 text-sm font-semibold">{title}</p>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className={fl}>
              Nombre completo <span className="text-destructive">*</span>
            </Label>
            <Input
              value={person.fullName}
              onChange={(event) => onChange({ fullName: event.target.value })}
              placeholder="Nombre y apellidos"
              className={ic}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className={fl}>
              Parentesco con el paciente{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              items={[...relationshipSelectOptions]}
              value={relationshipValue}
              onValueChange={(value) =>
                onChange({
                  relationship:
                    value === "OTHER"
                      ? otherText || "OTHER"
                      : (value ?? undefined),
                })
              }
            >
              <SelectTrigger className={sc}>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {relationshipSelectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {relationshipValue === "OTHER" && (
              <Input
                value={otherText === "OTHER" ? "" : otherText}
                onChange={(event) =>
                  onChange({
                    relationship: event.target.value.trim() || "OTHER",
                  })
                }
                placeholder="Especifique el parentesco"
                className={ic}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className={fl}>
              Teléfono principal <span className="text-destructive">*</span>
            </Label>
            <Input
              value={person.primaryPhone}
              onChange={(event) =>
                onChange({ primaryPhone: event.target.value })
              }
              placeholder="999 000 777"
              className={ic}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className={fl}>Teléfono adicional o fijo</Label>
            <Input
              value={person.secondaryPhone ?? ""}
              onChange={(event) =>
                onChange({ secondaryPhone: event.target.value || undefined })
              }
              placeholder="01 555 1234"
              className={ic}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className={fl}>DNI</Label>
            <Input
              value={person.dni ?? ""}
              onChange={(event) =>
                onChange({ dni: event.target.value || undefined })
              }
              placeholder="74829304"
              className={ic}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className={fl}>Fecha de nacimiento</Label>
            <Input
              type="date"
              value={person.birthDate ?? ""}
              onChange={(event) =>
                onChange({ birthDate: event.target.value || undefined })
              }
              className={ic}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label className={fl}>Género</Label>
          <Select
            items={Object.entries(genderLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            value={person.gender ?? ""}
            onValueChange={(value) => onChange({ gender: value || undefined })}
          >
            <SelectTrigger className={sc}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(genderLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label className={fl}>¿Tiene WhatsApp?</Label>
          <Select
            items={YES_NO_OPTIONS}
            value={person.hasWhatsapp ? "Sí" : "No"}
            onValueChange={(value) => onChange({ hasWhatsapp: value === "Sí" })}
          >
            <SelectTrigger className={sc}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YES_NO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export function Step5Datos() {
  const { draft, updateDraft, nextStep, prevStep } = useEnrollmentStore()
  const [entryPoint, setEntryPoint] = useState<string>(() => {
    const saved = draft.enrollmentMetadata.programEntryPoint
    if (!saved) return ""
    return (ENTRY_POINTS as readonly string[]).includes(saved) ? saved : "Otro"
  })
  const [customEntryPoint, setCustomEntryPoint] = useState<string>(() => {
    const saved = draft.enrollmentMetadata.programEntryPoint
    if (!saved || (ENTRY_POINTS as readonly string[]).includes(saved)) return ""
    return saved
  })
  const [nativeLanguage, setNativeLanguage] = useState<string>(() => {
    const saved = draft.details.nativeLanguage
    if (!saved) return ""
    return (NATIVE_LANGUAGES as readonly string[]).includes(saved)
      ? saved
      : "Otros"
  })
  const [customNativeLanguage, setCustomNativeLanguage] = useState<string>(
    () => {
      const saved = draft.details.nativeLanguage
      if (!saved || (NATIVE_LANGUAGES as readonly string[]).includes(saved))
        return ""
      return saved
    },
  )
  const [error, setError] = useState<string | null>(null)

  const pd = draft.patientData
  const details = draft.details
  const insurance = draft.insurance
  const meta = draft.enrollmentMetadata
  const caller = draft.companion
  const patientIsMinor = isMinor(pd.birthDate)
  const callerIsComplete = Boolean(
    caller.fullName.trim() &&
    caller.primaryPhone.trim() &&
    caller.relationship?.trim(),
  )
  const selectedPrimarySource =
    draft.primaryContactSource ??
    (patientIsMinor && callerIsComplete ? "CALLER" : "")
  const secondarySource = draft.secondaryContactSource ?? ""
  const hasTemporaryAddress = draft.addresses.length > 1
  const address: EnrollmentAddressRequest = draft.addresses[0] ?? {
    type: "PERMANENT",
    isPrimary: true,
  }
  const temporaryAddress: EnrollmentAddressRequest = {
    ...(draft.addresses[1] ?? { type: "TEMPORARY", isPrimary: false }),
    type: "TEMPORARY",
    isPrimary: false,
  }
  const hasInsurance = insurance.insuranceType !== "NONE"
  const hasCallerOption = callerIsComplete

  function updateAddress(partial: Partial<EnrollmentAddressRequest>) {
    updateDraft({
      addresses: [{ ...address, ...partial }, ...draft.addresses.slice(1)],
    })
  }

  function updateTemporaryAddress(partial: Partial<EnrollmentAddressRequest>) {
    updateDraft({
      addresses: [
        address,
        {
          ...temporaryAddress,
          ...partial,
          type: "TEMPORARY",
          isPrimary: false,
        },
        ...draft.addresses.slice(2),
      ],
    })
  }

  function handleTemporaryAddressChange(value: string | null) {
    if (value === "Sí") {
      updateDraft({
        addresses: [address, temporaryAddress, ...draft.addresses.slice(2)],
      })
      return
    }
    updateDraft({
      addresses:
        draft.addresses.length > 1
          ? [address, ...draft.addresses.slice(2)]
          : draft.addresses,
    })
  }

  function updatePrimarySource(value: string | null) {
    const source = value as EnrollmentContactSource | ""
    updateDraft({
      primaryContactSource: source || undefined,
      primaryContact: source === "NEW" ? draft.primaryContact : EMPTY_CONTACT,
      ...(source === "CALLER" && secondarySource === "CALLER"
        ? {
            secondaryContactSource: "NEW",
            secondaryContact: EMPTY_CONTACT,
          }
        : {}),
    })
  }

  function handleSecondaryToggle(value: string | null) {
    const enabled = value === "Sí"
    const defaultSource =
      hasCallerOption && selectedPrimarySource !== "CALLER" ? "CALLER" : "NEW"
    updateDraft({
      secondaryContactEnabled: enabled,
      secondaryContactSource: enabled ? defaultSource : undefined,
      secondaryContact: enabled ? draft.secondaryContact : EMPTY_CONTACT,
    })
  }

  function validateContact(
    source: EnrollmentContactSource | "",
    person: CompanionDraft,
    role: string,
  ) {
    if (!source) return `Seleccione el contacto ${role}`
    if (source === "PATIENT") return null
    if (source === "CALLER") {
      return callerIsComplete
        ? null
        : "Complete primero los datos de quien llama"
    }
    if (
      !person.fullName.trim() ||
      !person.primaryPhone.trim() ||
      !person.relationship?.trim()
    )
      return `Complete nombre, parentesco y teléfono del ${role}`
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pd.fullName.trim() || !pd.primaryPhone.trim() || !pd.birthDate) {
      setError("Complete nombre, teléfono y fecha de nacimiento del paciente")
      return
    }
    if (
      !isValidLocationUrl(address.locationUrl) ||
      !isValidLocationUrl(temporaryAddress.locationUrl)
    ) {
      setError("La ubicación web debe ser una URL válida http o https")
      return
    }
    if (patientIsMinor && selectedPrimarySource === "PATIENT") {
      setError(
        "Un paciente menor debe tener un acompañante como contacto principal",
      )
      return
    }
    const primaryError = validateContact(
      selectedPrimarySource,
      draft.primaryContact,
      "contacto principal",
    )
    if (primaryError) {
      setError(primaryError)
      return
    }
    if (draft.secondaryContactEnabled) {
      const secondaryError = validateContact(
        secondarySource as EnrollmentContactSource | "",
        draft.secondaryContact,
        "contacto secundario",
      )
      if (secondaryError) {
        setError(secondaryError)
        return
      }
      if (secondarySource === "PATIENT") {
        setError("El paciente solo puede ser contacto principal")
        return
      }
    }
    setError(null)
    nextStep()
  }

  function handleEntryPointChange(value: string) {
    setEntryPoint(value)
    setCustomEntryPoint("")
    updateDraft({
      enrollmentMetadata: {
        ...meta,
        programEntryPoint: value === "Otro" ? undefined : value,
      },
    })
  }

  function handleNativeLanguageChange(value: string) {
    setNativeLanguage(value)
    setCustomNativeLanguage("")
    updateDraft({
      details: {
        ...details,
        nativeLanguage: value === "Otros" ? undefined : value,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <StepHeader
        step={5}
        title="Datos del Paciente"
        description="Complete los datos de identidad, demográficos, contacto y seguro."
      />
      <section className="flex flex-col gap-5">
        <SectionHeader icon={CreditCard} title="Información de Identidad" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className={fl}>DNI</Label>
            <Input
              placeholder="74829304"
              className={ic}
              value={pd.dni ?? ""}
              onChange={(event) =>
                updateDraft({
                  patientData: { ...pd, dni: event.target.value || null },
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className={fl}>
              Fecha de nacimiento <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              className={ic}
              value={pd.birthDate ?? ""}
              onChange={(event) =>
                updateDraft({
                  patientData: { ...pd, birthDate: event.target.value || null },
                })
              }
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label className={fl}>
            Nombre completo <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="Tal como aparece en el DNI"
            className={ic}
            value={pd.fullName}
            onChange={(event) =>
              updateDraft({
                patientData: { ...pd, fullName: event.target.value },
              })
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className={fl}>Género</Label>
          <Select
            items={Object.entries(genderLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            value={pd.gender ?? ""}
            onValueChange={(value) =>
              updateDraft({ patientData: { ...pd, gender: value || null } })
            }
          >
            <SelectTrigger className={sc}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(genderLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {patientIsMinor && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="mb-1 text-[10px] font-bold tracking-widest text-amber-700/80 uppercase">
              Paciente menor de edad
            </p>
            <p className="text-foreground/70 text-sm">
              El contacto principal debe ser un acompañante o tutor.
            </p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          icon={MapPin}
          title="Datos de procedencia y residencia"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className={fl}>Departamento de nacimiento</Label>
            <Select
              items={DEPARTMENTS}
              value={details.birthDepartment ?? ""}
              onValueChange={(value) =>
                updateDraft({
                  details: { ...details, birthDepartment: value || undefined },
                })
              }
            >
              <SelectTrigger className={sc}>
                <SelectValue placeholder="Seleccionar departamento..." />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((department) => (
                  <SelectItem key={department.value} value={department.value}>
                    {department.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className={fl}>Zonificación de residencia</Label>
            <Select
              items={ZONE_TYPES}
              value={normalizeZoneType(details.zoneType) ?? ""}
              onValueChange={(value) =>
                updateDraft({
                  details: { ...details, zoneType: value || undefined },
                })
              }
            >
              <SelectTrigger className={sc}>
                <SelectValue placeholder="Seleccionar zonificación..." />
              </SelectTrigger>
              <SelectContent>
                {ZONE_TYPES.map((zone) => (
                  <SelectItem key={zone.value} value={zone.value}>
                    {zone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label className={fl}>Dirección actual</Label>
          <Input
            placeholder="Av. Principal 123"
            className={ic}
            value={address.address ?? ""}
            onChange={(event) =>
              updateAddress({ address: event.target.value || undefined })
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className={fl}>Distrito</Label>
            <Input
              placeholder="Miraflores"
              className={ic}
              value={address.district ?? ""}
              onChange={(event) =>
                updateAddress({ district: event.target.value || undefined })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className={fl}>Provincia</Label>
            <Input
              placeholder="Lima"
              className={ic}
              value={address.province ?? ""}
              onChange={(event) =>
                updateAddress({ province: event.target.value || undefined })
              }
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label className={fl}>Departamento</Label>
          <Select
            items={DEPARTMENTS}
            value={address.department ?? ""}
            onValueChange={(value) =>
              updateAddress({
                department: (value || undefined) as PeruDepartment | undefined,
              })
            }
          >
            <SelectTrigger className={sc}>
              <SelectValue placeholder="Seleccionar departamento..." />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((department) => (
                <SelectItem key={department.value} value={department.value}>
                  {department.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label className={fl}>Ubicación web de la residencia</Label>
          <Input
            type="url"
            placeholder="https://maps.google.com/..."
            className={ic}
            value={address.locationUrl ?? ""}
            onChange={(event) =>
              updateAddress({ locationUrl: event.target.value || undefined })
            }
          />
          {address.locationUrl && isValidLocationUrl(address.locationUrl) && (
            <a
              href={address.locationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary text-xs underline underline-offset-4"
            >
              Abrir ubicación
            </a>
          )}
          <p className="text-muted-foreground text-xs">
            Pegue un enlace de Google Maps u otro mapa con protocolo http o
            https.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label className={fl}>
            ¿Cuenta con una vivienda provisional adicional?
          </Label>
          <Select
            items={YES_NO_OPTIONS}
            value={hasTemporaryAddress ? "Sí" : "No"}
            onValueChange={handleTemporaryAddressChange}
          >
            <SelectTrigger className={sc}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YES_NO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            Si vive en otra ciudad durante parte del año, registre aquí esa
            segunda dirección.
          </p>
        </div>
        {hasTemporaryAddress && (
          <div className="border-border/70 bg-muted/20 rounded-xl border p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold">Vivienda provisional</p>
              <p className="text-muted-foreground text-xs">
                Por ejemplo, una vivienda en Lima si su domicilio habitual está
                en provincia.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className={fl}>Dirección</Label>
                <Input
                  placeholder="Av. Principal 123"
                  className={ic}
                  value={temporaryAddress.address ?? ""}
                  onChange={(event) =>
                    updateTemporaryAddress({
                      address: event.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label className={fl}>Distrito</Label>
                  <Input
                    placeholder="Miraflores"
                    className={ic}
                    value={temporaryAddress.district ?? ""}
                    onChange={(event) =>
                      updateTemporaryAddress({
                        district: event.target.value || undefined,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className={fl}>Provincia</Label>
                  <Input
                    placeholder="Lima"
                    className={ic}
                    value={temporaryAddress.province ?? ""}
                    onChange={(event) =>
                      updateTemporaryAddress({
                        province: event.target.value || undefined,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>Departamento</Label>
                <Select
                  items={DEPARTMENTS}
                  value={temporaryAddress.department ?? ""}
                  onValueChange={(value) =>
                    updateTemporaryAddress({
                      department: (value || undefined) as
                        | PeruDepartment
                        | undefined,
                    })
                  }
                >
                  <SelectTrigger className={sc}>
                    <SelectValue placeholder="Seleccionar departamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((department) => (
                      <SelectItem
                        key={department.value}
                        value={department.value}
                      >
                        {department.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>Ubicación web de la residencia</Label>
                <Input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  className={ic}
                  value={temporaryAddress.locationUrl ?? ""}
                  onChange={(event) =>
                    updateTemporaryAddress({
                      locationUrl: event.target.value || undefined,
                    })
                  }
                />
                {temporaryAddress.locationUrl &&
                  isValidLocationUrl(temporaryAddress.locationUrl) && (
                    <a
                      href={temporaryAddress.locationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-xs underline underline-offset-4"
                    >
                      Abrir ubicación
                    </a>
                  )}
              </div>
            </div>
          </div>
        )}
        <DurationInput
          label="Tiempo de viaje al hospital"
          units={["MINUTE", "HOUR", "DAY"]}
          defaultUnit="HOUR"
          singleValue
          value={details.travelTimeToHospital}
          onChange={(travelTimeToHospital) =>
            updateDraft({ details: { ...details, travelTimeToHospital } })
          }
        />
        <div className="flex flex-col gap-2">
          <Label className={fl}>¿Dirección DNI coincide con actual?</Label>
          <Select
            items={YES_NO_OPTIONS}
            value={
              address.dniMatchesAddress === true
                ? "Sí"
                : address.dniMatchesAddress === false
                  ? "No"
                  : ""
            }
            onValueChange={(value) =>
              updateAddress({ dniMatchesAddress: value === "Sí" })
            }
          >
            <SelectTrigger className={sc}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {YES_NO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader icon={Phone} title="Contacto del paciente" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className={fl}>
              Teléfono principal <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="987654321"
              className={ic}
              value={pd.primaryPhone}
              onChange={(event) =>
                updateDraft({
                  patientData: { ...pd, primaryPhone: event.target.value },
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className={fl}>Teléfono adicional o fijo</Label>
            <Input
              placeholder="01 555 1234"
              className={ic}
              value={pd.secondaryPhone ?? ""}
              onChange={(event) =>
                updateDraft({
                  patientData: {
                    ...pd,
                    secondaryPhone: event.target.value || null,
                  },
                })
              }
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label className={fl}>¿Tiene WhatsApp?</Label>
          <Select
            items={YES_NO_OPTIONS}
            value={pd.hasWhatsapp ? "Sí" : "No"}
            onValueChange={(value) =>
              updateDraft({
                patientData: { ...pd, hasWhatsapp: value === "Sí" },
              })
            }
          >
            <SelectTrigger className={sc}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YES_NO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader icon={Phone} title="Contacto para seguimiento" />
        <div className="flex flex-col gap-2">
          <Label className={fl}>
            ¿Quién será el contacto principal?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Select
            items={[
              ...(patientIsMinor
                ? []
                : [{ value: "PATIENT", label: CONTACT_SOURCE_LABELS.PATIENT }]),
              ...(hasCallerOption
                ? [{ value: "CALLER", label: CONTACT_SOURCE_LABELS.CALLER }]
                : []),
              { value: "NEW", label: CONTACT_SOURCE_LABELS.NEW },
            ]}
            value={selectedPrimarySource}
            onValueChange={updatePrimarySource}
          >
            <SelectTrigger className={sc}>
              <SelectValue
                placeholder={
                  patientIsMinor
                    ? "Seleccione un acompañante..."
                    : "Seleccionar..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {!patientIsMinor && (
                <SelectItem value="PATIENT">El paciente</SelectItem>
              )}
              {hasCallerOption && (
                <SelectItem value="CALLER">La persona que llama</SelectItem>
              )}
              <SelectItem value="NEW">Registrar un acompañante</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedPrimarySource === "CALLER" && (
          <div className="border-border/70 bg-muted/20 rounded-xl border p-4 text-sm">
            <p className="font-semibold">
              Se reutilizarán los datos de quien llama
            </p>
            <p className="text-muted-foreground mt-1">
              {caller.fullName} · {caller.relationship} · {caller.primaryPhone}
            </p>
          </div>
        )}
        {selectedPrimarySource === "NEW" && (
          <ContactPersonFields
            person={draft.primaryContact}
            title="Datos del contacto principal"
            onChange={(partial) =>
              updateDraft({
                primaryContact: { ...draft.primaryContact, ...partial },
              })
            }
          />
        )}
        <div className="flex flex-col gap-2">
          <Label className={fl}>¿Desea registrar un contacto secundario?</Label>
          <Select
            items={YES_NO_OPTIONS}
            value={draft.secondaryContactEnabled ? "Sí" : "No"}
            onValueChange={handleSecondaryToggle}
          >
            <SelectTrigger className={sc}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YES_NO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {draft.secondaryContactEnabled && (
          <>
            <div className="flex flex-col gap-2">
              <Label className={fl}>Origen del contacto secundario</Label>
              <Select
                items={[
                  ...(hasCallerOption && selectedPrimarySource !== "CALLER"
                    ? [{ value: "CALLER", label: CONTACT_SOURCE_LABELS.CALLER }]
                    : []),
                  { value: "NEW", label: CONTACT_SOURCE_LABELS.NEW },
                ]}
                value={secondarySource}
                onValueChange={(value) =>
                  updateDraft({
                    secondaryContactSource: value as EnrollmentContactSource,
                    secondaryContact:
                      value === "NEW" ? draft.secondaryContact : EMPTY_CONTACT,
                  })
                }
              >
                <SelectTrigger className={sc}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {hasCallerOption && selectedPrimarySource !== "CALLER" && (
                    <SelectItem value="CALLER">La persona que llama</SelectItem>
                  )}
                  <SelectItem value="NEW">Registrar un acompañante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {secondarySource === "CALLER" && (
              <div className="border-border/70 bg-muted/20 rounded-xl border p-4 text-sm">
                <p className="font-semibold">
                  Se reutilizarán los datos de quien llama
                </p>
                <p className="text-muted-foreground mt-1">
                  {caller.fullName} · {caller.relationship} ·{" "}
                  {caller.primaryPhone}
                </p>
              </div>
            )}
            {secondarySource === "NEW" && (
              <ContactPersonFields
                person={draft.secondaryContact}
                title="Datos del contacto secundario"
                onChange={(partial) =>
                  updateDraft({
                    secondaryContact: { ...draft.secondaryContact, ...partial },
                  })
                }
              />
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader icon={GraduationCap} title="Perfil Socioeducativo" />
        <div className="flex flex-col gap-2">
          <Label className={fl}>Nivel educativo</Label>
          <Select
            items={Object.entries(EDU).map(([value, label]) => ({
              value,
              label,
            }))}
            value={details.educationLevel ?? ""}
            onValueChange={(value) =>
              updateDraft({
                details: {
                  ...details,
                  educationLevel: value as EducationLevel,
                },
              })
            }
          >
            <SelectTrigger className={sc}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EDU).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className={fl}>Lengua nativa</Label>
            <Select
              items={NATIVE_LANGUAGES.map((value) => ({ value, label: value }))}
              value={nativeLanguage}
              onValueChange={(value) => handleNativeLanguageChange(value ?? "")}
            >
              <SelectTrigger className={sc}>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {NATIVE_LANGUAGES.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className={fl}>¿Requiere traducción?</Label>
            <Select
              items={YES_NO_OPTIONS}
              value={details.requiresTranslation ? "Sí" : "No"}
              onValueChange={(value) =>
                updateDraft({
                  details: { ...details, requiresTranslation: value === "Sí" },
                })
              }
            >
              <SelectTrigger className={sc}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YES_NO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {nativeLanguage === "Otros" && (
          <div className="flex flex-col gap-2">
            <Label className={fl}>Especificar lengua</Label>
            <Input
              placeholder="Escriba la lengua nativa"
              className={ic}
              value={customNativeLanguage}
              onChange={(event) => {
                setCustomNativeLanguage(event.target.value)
                updateDraft({
                  details: {
                    ...details,
                    nativeLanguage: event.target.value || undefined,
                  },
                })
              }}
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label className={fl}>¿Actualmente trabaja?</Label>
          <Select
            items={YES_NO_OPTIONS}
            value={
              details.isWorking === true
                ? "Sí"
                : details.isWorking === false
                  ? "No"
                  : ""
            }
            onValueChange={(value) =>
              updateDraft({
                details: { ...details, isWorking: value === "Sí" },
              })
            }
          >
            <SelectTrigger className={sc}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {YES_NO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader icon={ShieldCheck} title="Seguro de Salud" />
        <div className="flex flex-col gap-2">
          <Label className={fl}>
            ¿Actualmente cuenta con un seguro de salud?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Select
            items={YES_NO_OPTIONS}
            value={hasInsurance ? "Sí" : "No"}
            onValueChange={(value) => {
              if (value === "No") {
                updateDraft({
                  insurance: {
                    ...insurance,
                    insuranceType: "NONE",
                    epsProvider: undefined,
                  },
                  sisAffiliation: { canAffiliate: true },
                })
              } else {
                updateDraft({
                  insurance: { ...insurance, insuranceType: "SIS" },
                })
              }
            }}
          >
            <SelectTrigger className={sc}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YES_NO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasInsurance && (
          <>
            <div className="flex flex-col gap-2">
              <Label className={fl}>
                Tipo de seguro <span className="text-destructive">*</span>
              </Label>
              <Select
                items={Object.entries(INS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={insurance.insuranceType}
                onValueChange={(value) =>
                  updateDraft({
                    insurance: {
                      ...insurance,
                      insuranceType: value as InsuranceType,
                      epsProvider:
                        value !== "EPS" ? undefined : insurance.epsProvider,
                    },
                  })
                }
              >
                <SelectTrigger className={sc}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {insurance.insuranceType === "EPS" && (
              <div className="flex flex-col gap-2">
                <Label className={fl}>Proveedor EPS</Label>
                <Select
                  items={Object.entries(EPS_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  value={insurance.epsProvider ?? ""}
                  onValueChange={(value) =>
                    updateDraft({
                      insurance: {
                        ...insurance,
                        epsProvider: value as EpsProvider,
                      },
                    })
                  }
                >
                  <SelectTrigger className={sc}>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EPS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader icon={LogIn} title="Punto de Ingreso" />
        <div className="flex flex-col gap-2">
          <Label className={fl}>
            ¿Cuál fue el punto de ingreso al programa?
          </Label>
          <Select
            items={ENTRY_POINTS.map((value) => ({ value, label: value }))}
            value={entryPoint}
            onValueChange={(value) => handleEntryPointChange(value ?? "")}
          >
            <SelectTrigger className={sc}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {ENTRY_POINTS.map((point) => (
                <SelectItem key={point} value={point}>
                  {point}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {entryPoint === "Otro" && (
          <div className="flex flex-col gap-2">
            <Label className={fl}>Especificar</Label>
            <Input
              placeholder="Describa el punto de ingreso"
              className={ic}
              value={customEntryPoint}
              onChange={(event) => {
                setCustomEntryPoint(event.target.value)
                updateDraft({
                  enrollmentMetadata: {
                    ...meta,
                    programEntryPoint: event.target.value || undefined,
                  },
                })
              }}
            />
          </div>
        )}
      </section>

      {error && <p className="text-destructive text-sm">{error}</p>}
      <StepNav currentStep={5} onPrev={prevStep} />
    </form>
  )
}
