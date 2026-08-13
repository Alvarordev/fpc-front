import { useState } from "react"
import { useForm } from "react-hook-form"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { DurationInput } from "@/components/duration-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { healthCentersApi } from "@/api/health-centers"
import type {
  CreatePatientAddressInput,
  CreatePatientTreatmentInput,
  CreateTreatmentMedicationInput,
  CreatePatientSymptomReportInput,
  PatientAddress,
  PatientDetailsInput,
} from "@/api/patients"
import {
  calculateDurationBetweenDates,
  toDurationInput,
  type DurationDraft,
} from "@/types/duration"
import { usePatientAddresses } from "../../_hooks/use-patient-records"
import {
  Activity,
  MapPin,
  Minus,
  Pill,
  Plus,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react"
import { usePatient } from "../../_hooks/use-patient"
import {
  cancerStageLabels as cancerStageOptions,
  educationLabels as educationOptions,
  epsLabels as epsOptions,
  genderLabels as genderOptions,
  insuranceLabels as insuranceOptions,
  type CancerStage,
  type EducationLevel,
  type EpsProvider,
  type InsuranceType,
} from "../../_lib/clinical-labels"
import {
  DRAFT_DIAGNOSIS_ID,
  type ClinicalDrafts,
  type DiagnosisDraft,
  type InsuranceDraft,
  type SisAffiliationDraft,
  type SymptomReportDraft,
  type TreatmentDraft,
} from "./clinical-drafts"

// ── Tri-state Sí/No/— select ──

const TRI_UNSET = "SIN_DATO"

const TREATMENT_SITUATIONS = [
  { value: "EN_CURSO", label: "En curso" },
  { value: "PENDIENTE_DE_INICIO", label: "Pendiente de inicio" },
  { value: "INTERRUMPIDO", label: "Interrumpido" },
  { value: "FINALIZADO", label: "Finalizado" },
] as const

const DOSE_UNITS = [
  { value: "MG", label: "mg" },
  { value: "G", label: "g" },
  { value: "ML", label: "ml" },
  { value: "UI", label: "UI" },
  { value: "TABLET", label: "Tableta" },
  { value: "DROP", label: "Gota" },
  { value: "OTHER", label: "Otro" },
] as const

const MEDICATION_ROUTES = [
  { value: "ORAL", label: "Oral" },
  { value: "IV", label: "Intravenosa" },
  { value: "IM", label: "Intramuscular" },
  { value: "SUBCUTANEOUS", label: "Subcutánea" },
  { value: "TOPICAL", label: "Tópica" },
  { value: "OTHER", label: "Otra" },
] as const

function triLabel(value: boolean | undefined): string {
  if (value === true) return "Sí"
  if (value === false) return "No"
  return "—"
}

function TriSelect({
  value,
  onChange,
  label,
}: {
  value: boolean | undefined
  onChange: (value: boolean | undefined) => void
  label: string
}) {
  const raw = value === undefined ? TRI_UNSET : value ? "SI" : "NO"
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={raw}
        onValueChange={(v) =>
          onChange(v === TRI_UNSET ? undefined : v === "SI")
        }
      >
        <SelectTrigger className="h-9">
          <SelectValue>{triLabel(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TRI_UNSET}>—</SelectItem>
          <SelectItem value="SI">Sí</SelectItem>
          <SelectItem value="NO">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function DraftBadge({ saved }: { saved: boolean }) {
  if (!saved) return null
  return (
    <p className="text-xs text-emerald-600">
      ✓ Guardado en el borrador. Se registrará al completar el seguimiento.
    </p>
  )
}

interface ClinicalDataTabsProps {
  patientId: string
  drafts: ClinicalDrafts
  onDraftsChange: (updater: (prev: ClinicalDrafts) => ClinicalDrafts) => void
}

export function ClinicalDataTabs({
  patientId,
  drafts,
  onDraftsChange,
}: ClinicalDataTabsProps) {
  const [activeTab, setActiveTab] = useState("datos")
  const { data: patient } = usePatient(patientId)
  const { data: hospitals = [] } = useQuery({
    queryKey: ["health-centers"],
    queryFn: () => healthCentersApi.list(),
    staleTime: 5 * 60 * 1000,
  })
  const { data: addresses = [] } = usePatientAddresses(patientId)

  const diagnoses = patient?.diagnoses ?? []
  const currentDiagnosis = diagnoses.find((d) => d.isCurrent)

  return (
    <Tabs
      orientation="vertical"
      value={activeTab}
      onValueChange={(value) => setActiveTab(String(value))}
      className="min-h-0 flex-1 flex-col items-stretch gap-3 lg:flex-row"
    >
      <TabsList className="border-border/60 bg-muted/40 h-fit w-full shrink-0 justify-start gap-1 overflow-x-auto rounded-xl border p-1 lg:w-48 lg:flex-col lg:overflow-visible">
        <TabsTrigger
          value="datos"
          className="min-h-10 flex-none justify-start gap-2"
        >
          <UserRound className="size-4 text-sky-600" />
          <span>Datos generales</span>
          {drafts.details && <DraftDot />}
        </TabsTrigger>
        <TabsTrigger
          value="sintomas"
          className="min-h-10 flex-none justify-start gap-2"
        >
          <Activity className="size-4 text-rose-600" />
          <span>Síntomas</span>
          {drafts.symptomReport && <DraftDot />}
        </TabsTrigger>
        <TabsTrigger
          value="direcciones"
          className="min-h-10 flex-none justify-start gap-2"
        >
          <MapPin className="size-4 text-emerald-600" />
          <span>Direcciones</span>
          {drafts.address && <DraftDot />}
        </TabsTrigger>
        <TabsTrigger
          value="diagnostico"
          className="min-h-10 flex-none justify-start gap-2"
        >
          <Stethoscope className="size-4 text-violet-600" />
          <span>Diagnóstico</span>
          {drafts.diagnosis && <DraftDot />}
        </TabsTrigger>
        <TabsTrigger
          value="tratamiento"
          className="min-h-10 flex-none justify-start gap-2"
        >
          <Pill className="size-4 text-amber-600" />
          <span>Tratamiento</span>
          {drafts.treatment && <DraftDot />}
        </TabsTrigger>
        <TabsTrigger
          value="seguro"
          className="min-h-10 flex-none justify-start gap-2"
        >
          <ShieldCheck className="size-4 text-teal-600" />
          <span>Seguro / SIS</span>
          {drafts.insurance && <DraftDot />}
        </TabsTrigger>
        <TabsTrigger
          value="social"
          className="min-h-10 flex-none justify-start gap-2"
        >
          <Users className="size-4 text-orange-600" />
          <span>Seguimiento social</span>
          {drafts.social && <DraftDot />}
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="datos"
        keepMounted
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1"
      >
        <DatosGeneralesForm
          draft={drafts.details}
          onSave={(details) => onDraftsChange((prev) => ({ ...prev, details }))}
        />
      </TabsContent>
      <TabsContent
        value="sintomas"
        keepMounted
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1"
      >
        <SintomasForm
          draft={drafts.symptomReport}
          hospitals={hospitals}
          onSave={(symptomReport) =>
            onDraftsChange((prev) => ({ ...prev, symptomReport }))
          }
        />
      </TabsContent>
      <TabsContent
        value="direcciones"
        keepMounted
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1"
      >
        <AddressForm
          draft={drafts.address}
          addresses={addresses}
          onSave={(address) => onDraftsChange((prev) => ({ ...prev, address }))}
        />
      </TabsContent>
      <TabsContent
        value="diagnostico"
        keepMounted
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1"
      >
        <DiagnosticoForm
          draft={drafts.diagnosis}
          hospitals={hospitals}
          currentDiagnosis={currentDiagnosis}
          onSave={(diagnosis) =>
            onDraftsChange((prev) => ({ ...prev, diagnosis }))
          }
        />
      </TabsContent>
      <TabsContent
        value="tratamiento"
        keepMounted
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1"
      >
        <TratamientoForm
          draft={drafts.treatment}
          hospitals={hospitals}
          diagnoses={diagnoses}
          hasDraftDiagnosis={Boolean(drafts.diagnosis)}
          onSave={(treatment) =>
            onDraftsChange((prev) => ({ ...prev, treatment }))
          }
        />
      </TabsContent>
      <TabsContent
        value="seguro"
        keepMounted
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1"
      >
        <SeguroForm
          insuranceDraft={drafts.insurance}
          sisDraft={drafts.sisAffiliation}
          onSave={(insurance, sisAffiliation) =>
            onDraftsChange((prev) => ({ ...prev, insurance, sisAffiliation }))
          }
        />
      </TabsContent>
      <TabsContent
        value="social"
        keepMounted
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1"
      >
        <SeguimientoSocialForm
          draft={drafts.social}
          onSave={(social) => onDraftsChange((prev) => ({ ...prev, social }))}
        />
      </TabsContent>
    </Tabs>
  )
}

function DraftDot() {
  return (
    <span
      className="bg-primary ml-auto size-1.5 shrink-0 rounded-full"
      aria-label="Cambios pendientes"
    />
  )
}

// ── Direcciones ──

const ADDRESS_TYPES = [
  { value: "PERMANENT", label: "Permanente" },
  { value: "TEMPORARY", label: "Temporal" },
] as const

const DEPARTMENT_OPTIONS = [
  "AMAZONAS",
  "ANCASH",
  "APURIMAC",
  "AREQUIPA",
  "AYACUCHO",
  "CAJAMARCA",
  "CALLAO",
  "CUSCO",
  "HUANCAVELICA",
  "HUANUCO",
  "ICA",
  "JUNIN",
  "LA_LIBERTAD",
  "LAMBAYEQUE",
  "LIMA",
  "LORETO",
  "MADRE_DE_DIOS",
  "MOQUEGUA",
  "PASCO",
  "PIURA",
  "PUNO",
  "SAN_MARTIN",
  "TACNA",
  "TUMBES",
  "UCAYALI",
] as const

type AddressFormValues = Omit<CreatePatientAddressInput, "followUpId">

function AddressForm({
  draft,
  addresses,
  onSave,
}: {
  draft: Omit<CreatePatientAddressInput, "followUpId"> | undefined
  addresses: PatientAddress[]
  onSave: (address: Omit<CreatePatientAddressInput, "followUpId">) => void
}) {
  const { register, handleSubmit, watch, setValue } =
    useForm<AddressFormValues>({
      defaultValues: {
        type: draft?.type ?? "PERMANENT",
        isPrimary: draft?.isPrimary ?? true,
        address: draft?.address ?? "",
        district: draft?.district ?? "",
        province: draft?.province ?? "",
        department: draft?.department,
        reference: draft?.reference ?? "",
        dniMatchesAddress: draft?.dniMatchesAddress,
        validFrom: draft?.validFrom ?? "",
        validTo: draft?.validTo ?? "",
      },
    })

  const addressType = watch("type")
  const isPrimary = watch("isPrimary")
  const dniMatchesAddress = watch("dniMatchesAddress")
  const department = watch("department")

  function submit(values: AddressFormValues) {
    if (!values.address?.trim() && !values.district?.trim()) {
      toast.error("Indica al menos la dirección o el distrito")
      return
    }
    onSave({
      ...values,
      address: values.address?.trim() || undefined,
      district: values.district?.trim() || undefined,
      province: values.province?.trim() || undefined,
      reference: values.reference?.trim() || undefined,
      validFrom: values.validFrom || undefined,
      validTo: values.validTo || undefined,
    })
    toast.success("Dirección guardada en el borrador")
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium">Historial de direcciones</p>
        {addresses.length ? (
          <div className="mt-3 space-y-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm"
              >
                <span className="font-medium">
                  {address.address ?? address.district ?? "Sin detalle"}
                </span>
                <span className="text-muted-foreground">
                  {[address.district, address.province, address.department]
                    .filter(Boolean)
                    .join(", ")}
                </span>
                <span className="ml-auto flex gap-1.5">
                  {address.isPrimary && (
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                      Principal
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${address.isActive ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}
                  >
                    {address.isActive ? "Activa" : "Histórica"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm">
            No hay direcciones registradas.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(submit)} className="space-y-4 border-t pt-4">
        <p className="text-sm font-medium">Nueva dirección</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              items={ADDRESS_TYPES}
              value={addressType}
              onValueChange={(value) =>
                setValue("type", value as AddressFormValues["type"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADDRESS_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Departamento</Label>
            <Select
              items={DEPARTMENT_OPTIONS.map((value) => ({
                value,
                label: value.replaceAll("_", " "),
              }))}
              value={department ?? ""}
              onValueChange={(value) =>
                setValue("department", value as AddressFormValues["department"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENT_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Dirección</Label>
            <Input {...register("address")} placeholder="Av. Principal 123" />
          </div>
          <div className="space-y-2">
            <Label>Distrito</Label>
            <Input {...register("district")} placeholder="Miraflores" />
          </div>
          <div className="space-y-2">
            <Label>Provincia</Label>
            <Input {...register("province")} placeholder="Lima" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Referencia</Label>
            <Input {...register("reference")} placeholder="Frente al parque" />
          </div>
          <div className="space-y-2">
            <Label>Vigente desde</Label>
            <Input type="date" {...register("validFrom")} />
          </div>
          <div className="space-y-2">
            <Label>Vigente hasta</Label>
            <Input type="date" {...register("validTo")} />
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isPrimary}
              onCheckedChange={(value) => setValue("isPrimary", !!value)}
            />
            Dirección principal
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={dniMatchesAddress === true}
              onCheckedChange={(value) =>
                setValue("dniMatchesAddress", value ? true : undefined)
              }
            />
            Coincide con el DNI
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm">
            Guardar dirección
          </Button>
          <DraftBadge saved={Boolean(draft)} />
        </div>
      </form>
    </div>
  )
}

// ── Datos generales ──

interface DatosGeneralesValues {
  emergencyContactName: string
  emergencyContactPhone: string
  nativeLanguage: string
  educationLevel: EducationLevel | undefined
  requiresTranslation: boolean
  travelTimeToHospital: DurationDraft | undefined
}

function DatosGeneralesForm({
  draft,
  onSave,
}: {
  draft: PatientDetailsInput | undefined
  onSave: (details: PatientDetailsInput) => void
}) {
  const { register, handleSubmit, watch, setValue } =
    useForm<DatosGeneralesValues>({
      defaultValues: {
        emergencyContactName: draft?.emergencyContactName ?? "",
        emergencyContactPhone: draft?.emergencyContactPhone ?? "",
        nativeLanguage: draft?.nativeLanguage ?? "",
        educationLevel: draft?.educationLevel,
        requiresTranslation: draft?.requiresTranslation ?? false,
        travelTimeToHospital: draft?.travelTimeToHospital,
      },
    })

  const educationLevel = watch("educationLevel")
  const travelTimeToHospital = watch("travelTimeToHospital")

  function onSubmit(values: DatosGeneralesValues) {
    onSave({
      emergencyContactName: values.emergencyContactName || undefined,
      emergencyContactPhone: values.emergencyContactPhone || undefined,
      nativeLanguage: values.nativeLanguage || undefined,
      educationLevel: values.educationLevel,
      requiresTranslation: values.requiresTranslation,
      travelTimeToHospital: toDurationInput(values.travelTimeToHospital),
    })
    toast.success("Datos generales guardados en el borrador")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Contacto de emergencia</Label>
          <Input
            {...register("emergencyContactName")}
            placeholder="Nombre del contacto"
          />
        </div>
        <div className="space-y-2">
          <Label>Teléfono de emergencia</Label>
          <Input
            {...register("emergencyContactPhone")}
            placeholder="+51999000000"
          />
        </div>
        <div className="space-y-2">
          <Label>Lengua nativa</Label>
          <Input
            {...register("nativeLanguage")}
            placeholder="Español, Quechua..."
          />
        </div>
        <div className="space-y-2">
          <Label>Nivel educativo</Label>
          <Select
            value={educationLevel}
            onValueChange={(v) =>
              setValue("educationLevel", v as EducationLevel)
            }
          >
            <SelectTrigger>
              {educationLevel ? (
                educationOptions[educationLevel]
              ) : (
                <SelectValue placeholder="Seleccionar" />
              )}
            </SelectTrigger>
            <SelectContent>
              {Object.entries(educationOptions).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 space-y-2 pt-2">
          <Checkbox
            checked={watch("requiresTranslation")}
            onCheckedChange={(v) => setValue("requiresTranslation", !!v)}
            id="requiresTranslation"
          />
          <Label htmlFor="requiresTranslation" className="cursor-pointer">
            Requiere traducción
          </Label>
        </div>
        <DurationInput
          label="Tiempo de viaje al hospital"
          units={["MINUTE", "HOUR", "DAY"]}
          defaultUnit="HOUR"
          singleValue
          value={travelTimeToHospital}
          onChange={(value) => setValue("travelTimeToHospital", value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm">
          Guardar datos generales
        </Button>
        <DraftBadge saved={Boolean(draft)} />
      </div>
    </form>
  )
}

// ── Síntomas ──

type SymptomFormValues = Omit<
  CreatePatientSymptomReportInput,
  "followUpId" | "symptomDuration" | "symptomFrequency"
> & {
  symptomDuration: DurationDraft | undefined
  symptomFrequency: DurationDraft | undefined
}

function SintomasForm({
  draft,
  hospitals,
  onSave,
}: {
  draft: SymptomReportDraft | undefined
  hospitals: Array<{ id: string; name: string }>
  onSave: (symptomReport: SymptomReportDraft) => void
}) {
  const { register, handleSubmit, watch, setValue } =
    useForm<SymptomFormValues>({
      defaultValues: {
        hasDiscomfort: draft?.hasDiscomfort,
        signsAndSymptoms: draft?.signsAndSymptoms ?? "",
        indicationsReceived: draft?.indicationsReceived ?? "",
        symptomDuration: draft?.symptomDuration,
        symptomFrequency: draft?.symptomFrequency,
        hasSoughtMedicalConsultation: draft?.hasSoughtMedicalConsultation,
        specialty: draft?.specialty ?? "",
        healthCenterId: draft?.healthCenterId,
        isPainPresent: draft?.isPainPresent,
        painIntensity: draft?.painIntensity,
        painLocation: draft?.painLocation ?? "",
        painDescription: draft?.painDescription ?? "",
      },
    })

  const hasDiscomfort = watch("hasDiscomfort")
  const hasSoughtMedicalConsultation = watch("hasSoughtMedicalConsultation")
  const isPainPresent = watch("isPainPresent")
  const symptomDuration = watch("symptomDuration")
  const symptomFrequency = watch("symptomFrequency")
  const healthCenterId = watch("healthCenterId")

  function onSubmit(values: SymptomFormValues) {
    const normalizedDuration = toDurationInput(values.symptomDuration)
    const normalizedFrequency = toDurationInput(values.symptomFrequency)
    if (values.symptomDuration?.valueMin !== undefined && !normalizedDuration) {
      toast.error("Completa correctamente la duración de los síntomas")
      return
    }
    if (
      values.symptomFrequency?.valueMin !== undefined &&
      !normalizedFrequency
    ) {
      toast.error("Completa correctamente la frecuencia de los síntomas")
      return
    }

    onSave({
      ...values,
      signsAndSymptoms: values.signsAndSymptoms?.trim() || undefined,
      indicationsReceived: values.indicationsReceived?.trim() || undefined,
      specialty: values.specialty?.trim() || undefined,
      painLocation: values.painLocation?.trim() || undefined,
      painDescription: values.painDescription?.trim() || undefined,
      painIntensity: Number.isFinite(values.painIntensity)
        ? values.painIntensity
        : undefined,
      symptomDuration: normalizedDuration,
      symptomFrequency: normalizedFrequency,
    })
    toast.success("Síntomas guardados en el borrador")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TriSelect
          label="¿Presenta malestar o dolor?"
          value={hasDiscomfort}
          onChange={(value) => setValue("hasDiscomfort", value)}
        />
        <TriSelect
          label="¿Ha buscado atención médica?"
          value={hasSoughtMedicalConsultation}
          onChange={(value) => setValue("hasSoughtMedicalConsultation", value)}
        />
        <div className="space-y-2 md:col-span-2">
          <Label>Signos y síntomas</Label>
          <Textarea
            {...register("signsAndSymptoms")}
            placeholder="Describe los signos o síntomas..."
            className="min-h-20"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Indicaciones recibidas</Label>
          <Textarea
            {...register("indicationsReceived")}
            placeholder="Indicaciones de la consulta..."
            className="min-h-16"
          />
        </div>
        <DurationInput
          label="¿Desde hace cuánto presenta los síntomas?"
          units={["DAY", "WEEK", "MONTH", "YEAR"]}
          defaultUnit="DAY"
          singleValue
          value={symptomDuration}
          onChange={(value) => setValue("symptomDuration", value)}
        />
        <DurationInput
          label="¿Cada cuánto se presentan?"
          units={["HOUR", "DAY", "WEEK", "MONTH", "YEAR"]}
          defaultUnit="WEEK"
          singleValue
          value={symptomFrequency}
          onChange={(value) => setValue("symptomFrequency", value)}
        />
        <div className="space-y-2">
          <Label>Especialidad consultada</Label>
          <Input {...register("specialty")} placeholder="Ej: Oncología" />
        </div>
        <div className="space-y-2">
          <Label>Establecimiento de la consulta</Label>
          <Select
            items={hospitals.map((hospital) => ({
              value: hospital.id,
              label: hospital.name,
            }))}
            value={healthCenterId ?? ""}
            onValueChange={(value) =>
              setValue("healthCenterId", value || undefined)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar establecimiento" />
            </SelectTrigger>
            <SelectContent>
              {hospitals.map((hospital) => (
                <SelectItem key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TriSelect
          label="¿El dolor está presente actualmente?"
          value={isPainPresent}
          onChange={(value) => setValue("isPainPresent", value)}
        />
        {isPainPresent && (
          <>
            <div className="space-y-2">
              <Label>Intensidad del dolor (0 a 10)</Label>
              <Input
                type="number"
                min={0}
                max={10}
                step={1}
                {...register("painIntensity", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ubicación del dolor</Label>
              <Input {...register("painLocation")} placeholder="Ej: Abdomen" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descripción del dolor</Label>
              <Textarea
                {...register("painDescription")}
                placeholder="Describe el dolor..."
              />
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm">
          Guardar síntomas
        </Button>
        <DraftBadge saved={Boolean(draft)} />
      </div>
    </form>
  )
}

// ── Diagnóstico ──

interface DiagnosisFormValues {
  diagnosis: string
  cancerStage: CancerStage
  diagnosisDate: string
  firstSymptomsDate: string
  healthCenterId: string | undefined
  symptomLeadingToCheckup: string
  waitTimeForDiagnosis: DurationDraft | undefined
  waitTimeForDiagnosisManuallyEdited: boolean
  hasMedicalReport: boolean
}

function DiagnosticoForm({
  draft,
  hospitals,
  currentDiagnosis,
  onSave,
}: {
  draft: DiagnosisDraft | undefined
  hospitals: Array<{ id: string; name: string }>
  currentDiagnosis?: { diagnosis: string; cancerStage: string | null }
  onSave: (diagnosis: DiagnosisDraft) => void
}) {
  const { register, handleSubmit, watch, setValue } =
    useForm<DiagnosisFormValues>({
      defaultValues: {
        diagnosis: draft?.diagnosis ?? "",
        cancerStage: draft?.cancerStage ?? "UNKNOWN",
        diagnosisDate: draft?.diagnosisDate ?? "",
        firstSymptomsDate: draft?.firstSymptomsDate ?? "",
        healthCenterId: draft?.healthCenterId,
        symptomLeadingToCheckup: draft?.symptomLeadingToCheckup ?? "",
        waitTimeForDiagnosis: draft?.waitTimeForDiagnosis,
        waitTimeForDiagnosisManuallyEdited:
          draft?.waitTimeForDiagnosisManuallyEdited ?? false,
        hasMedicalReport: draft?.hasMedicalReport ?? false,
      },
    })

  const cancerStage = watch("cancerStage")
  const healthCenterId = watch("healthCenterId")
  const diagnosisDate = watch("diagnosisDate")
  const firstSymptomsDate = watch("firstSymptomsDate")
  const waitTimeForDiagnosis = watch("waitTimeForDiagnosis")
  const waitTimeForDiagnosisManuallyEdited = watch(
    "waitTimeForDiagnosisManuallyEdited",
  )
  const calculatedWaitTime = calculateDurationBetweenDates(
    firstSymptomsDate,
    diagnosisDate,
  )
  const visibleWaitTime = waitTimeForDiagnosisManuallyEdited
    ? waitTimeForDiagnosis
    : (calculatedWaitTime ?? waitTimeForDiagnosis)

  function updateDiagnosisDate(
    field: "diagnosisDate" | "firstSymptomsDate",
    value: string,
  ) {
    const nextDiagnosisDate = field === "diagnosisDate" ? value : diagnosisDate
    const nextFirstSymptomsDate =
      field === "firstSymptomsDate" ? value : firstSymptomsDate
    setValue(field, value)
    setValue(
      "waitTimeForDiagnosis",
      calculateDurationBetweenDates(nextFirstSymptomsDate, nextDiagnosisDate),
    )
    setValue("waitTimeForDiagnosisManuallyEdited", false)
  }

  function onSubmit(values: DiagnosisFormValues) {
    if (!values.diagnosis.trim()) {
      toast.error("Ingresá el diagnóstico")
      return
    }

    const normalizedWaitTime = values.waitTimeForDiagnosisManuallyEdited
      ? toDurationInput(values.waitTimeForDiagnosis)
      : values.firstSymptomsDate && values.diagnosisDate
        ? undefined
        : toDurationInput(values.waitTimeForDiagnosis)
    if (
      values.waitTimeForDiagnosis?.valueMin !== undefined &&
      !normalizedWaitTime
    ) {
      toast.error("Completa correctamente el tiempo de espera")
      return
    }

    onSave({
      diagnosis: values.diagnosis.trim(),
      cancerStage: values.cancerStage,
      diagnosisDate: values.diagnosisDate || undefined,
      firstSymptomsDate: values.firstSymptomsDate || undefined,
      healthCenterId: values.healthCenterId,
      symptomLeadingToCheckup: values.symptomLeadingToCheckup || undefined,
      waitTimeForDiagnosis: normalizedWaitTime,
      waitTimeForDiagnosisManuallyEdited:
        values.waitTimeForDiagnosisManuallyEdited,
      hasMedicalReport: values.hasMedicalReport,
    })
    toast.success("Diagnóstico guardado en el borrador")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {currentDiagnosis && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Diagnóstico actual: <strong>{currentDiagnosis.diagnosis}</strong>
          {currentDiagnosis.cancerStage &&
            ` (${cancerStageOptions[currentDiagnosis.cancerStage as CancerStage]})`}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Diagnóstico</Label>
          <Input {...register("diagnosis")} placeholder="Ej: Cáncer de mama" />
        </div>
        <div className="space-y-2">
          <Label>Etapa</Label>
          <Select
            value={cancerStage}
            onValueChange={(v) => setValue("cancerStage", v as CancerStage)}
          >
            <SelectTrigger>{cancerStageOptions[cancerStage]}</SelectTrigger>
            <SelectContent>
              {Object.entries(cancerStageOptions).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fecha de diagnóstico</Label>
          <Input
            type="date"
            value={diagnosisDate}
            onChange={(event) =>
              updateDiagnosisDate("diagnosisDate", event.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Primeros síntomas</Label>
          <Input
            type="date"
            value={firstSymptomsDate}
            onChange={(event) =>
              updateDiagnosisDate("firstSymptomsDate", event.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Establecimiento de salud</Label>
          <Select
            value={healthCenterId}
            onValueChange={(v) => setValue("healthCenterId", v ?? undefined)}
          >
            <SelectTrigger>
              {healthCenterId ? (
                hospitals.find((h) => h.id === healthCenterId)?.name
              ) : (
                <SelectValue placeholder="Seleccionar" />
              )}
            </SelectTrigger>
            <SelectContent>
              {hospitals.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Síntoma que llevó a consulta</Label>
          <Input
            {...register("symptomLeadingToCheckup")}
            placeholder="Ej: Bulto en seno"
          />
        </div>
        {firstSymptomsDate && diagnosisDate && (
          <p className="text-muted-foreground text-xs">
            {calculatedWaitTime
              ? waitTimeForDiagnosisManuallyEdited
                ? "Tiempo ajustado manualmente. Puedes cambiarlo cuando quieras."
                : "Tiempo calculado automáticamente a partir de las fechas. Puedes editarlo."
              : "Las fechas deben estar en orden para calcular el tiempo de espera."}
          </p>
        )}
        <DurationInput
          key={`follow-up-wait-${firstSymptomsDate}-${diagnosisDate}-${waitTimeForDiagnosisManuallyEdited ? "manual" : "auto"}`}
          label="Tiempo de espera para diagnóstico"
          units={["DAY", "WEEK", "MONTH", "YEAR"]}
          defaultUnit="DAY"
          singleValue
          value={visibleWaitTime}
          onChange={(value) => {
            setValue("waitTimeForDiagnosis", value)
            setValue(
              "waitTimeForDiagnosisManuallyEdited",
              value?.valueMin !== undefined,
            )
          }}
        />
        <div className="flex items-center gap-3 space-y-2 pt-2">
          <Checkbox
            checked={watch("hasMedicalReport")}
            onCheckedChange={(v) => setValue("hasMedicalReport", !!v)}
            id="hasReport"
          />
          <Label htmlFor="hasReport" className="cursor-pointer">
            Tiene informe médico
          </Label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm">
          Guardar diagnóstico
        </Button>
        <DraftBadge saved={Boolean(draft)} />
      </div>
    </form>
  )
}

// ── Tratamiento ──

interface TreatmentFormValues {
  diagnosisId: string | undefined
  treatmentType: string
  treatmentFrequency: DurationDraft | undefined
  treatmentSituation:
    | NonNullable<CreatePatientTreatmentInput["treatmentSituation"]>
    | undefined
  isReferred: boolean
  sourceHealthCenterId: string | undefined
  receivingHealthCenterId: string | undefined
  startDate: string
  endDate: string
  notReceivingReason: string
  changeReason: string
  hasLatestPrescription: boolean | undefined
  latestPrescriptionDate: string
  medications: Array<
    Omit<CreateTreatmentMedicationInput, "frequency"> & {
      frequency?: DurationDraft
    }
  >
}

function TratamientoForm({
  draft,
  hospitals,
  diagnoses,
  hasDraftDiagnosis,
  onSave,
}: {
  draft: TreatmentDraft | undefined
  hospitals: Array<{ id: string; name: string }>
  diagnoses: Array<{ id: string; diagnosis: string }>
  hasDraftDiagnosis: boolean
  onSave: (treatment: TreatmentDraft) => void
}) {
  const { register, handleSubmit, watch, setValue } =
    useForm<TreatmentFormValues>({
      defaultValues: {
        diagnosisId: draft?.diagnosisId,
        treatmentType: draft?.treatmentType ?? "",
        treatmentFrequency: draft?.treatmentFrequency,
        treatmentSituation: draft?.treatmentSituation,
        isReferred: draft?.isReferred ?? false,
        sourceHealthCenterId: draft?.sourceHealthCenterId ?? undefined,
        receivingHealthCenterId: draft?.receivingHealthCenterId ?? undefined,
        startDate: draft?.startDate ?? "",
        endDate: draft?.endDate ?? "",
        notReceivingReason: draft?.notReceivingReason ?? "",
        changeReason: draft?.changeReason ?? "",
        hasLatestPrescription: draft?.hasLatestPrescription ?? undefined,
        latestPrescriptionDate: draft?.latestPrescriptionDate ?? "",
        medications: draft?.medications ?? [],
      },
    })

  const diagnosisId = watch("diagnosisId")
  const isReferred = watch("isReferred")
  const sourceHealthCenterId = watch("sourceHealthCenterId")
  const receivingHealthCenterId = watch("receivingHealthCenterId")
  const treatmentFrequency = watch("treatmentFrequency")
  const treatmentSituation = watch("treatmentSituation")
  const startDate = watch("startDate")
  const hasLatestPrescription = watch("hasLatestPrescription")
  const medications = watch("medications") ?? []
  const canPickDiagnosis = diagnoses.length > 0 || hasDraftDiagnosis

  function diagnosisLabel(id: string) {
    if (id === DRAFT_DIAGNOSIS_ID)
      return "El diagnóstico que estoy guardando en este seguimiento"
    return diagnoses.find((d) => d.id === id)?.diagnosis
  }

  function updateMedication(
    index: number,
    partial: Partial<TreatmentFormValues["medications"][number]>,
  ) {
    setValue(
      "medications",
      medications.map((medication, medicationIndex) =>
        medicationIndex === index ? { ...medication, ...partial } : medication,
      ),
    )
  }

  function addMedication() {
    setValue("medications", [...medications, { name: "", isActive: true }])
  }

  function removeMedication(index: number) {
    setValue(
      "medications",
      medications.filter((_, medicationIndex) => medicationIndex !== index),
    )
  }

  function onSubmit(values: TreatmentFormValues) {
    if (!values.diagnosisId) {
      toast.error("Seleccioná el diagnóstico asociado")
      return
    }
    if (!values.treatmentType.trim()) {
      toast.error("Ingresá el tipo de tratamiento")
      return
    }

    const normalizedFrequency = toDurationInput(values.treatmentFrequency)
    if (values.treatmentFrequency && !normalizedFrequency) {
      toast.error("Completa correctamente la frecuencia del tratamiento")
      return
    }
    if (
      values.isReferred &&
      (!values.sourceHealthCenterId || !values.receivingHealthCenterId)
    ) {
      toast.error("Seleccioná el hospital de origen y el hospital receptor")
      return
    }
    if (
      values.isReferred &&
      values.sourceHealthCenterId === values.receivingHealthCenterId
    ) {
      toast.error("El hospital de origen y el receptor deben ser diferentes")
      return
    }
    if (
      values.startDate &&
      values.endDate &&
      values.endDate < values.startDate
    ) {
      toast.error(
        "La fecha de fin debe ser posterior o igual a la fecha de inicio",
      )
      return
    }

    const normalizedMedications = [] as NonNullable<
      TreatmentDraft["medications"]
    >
    for (const [index, medication] of values.medications.entries()) {
      if (!medication.name.trim()) {
        toast.error(`Completa el nombre del medicamento ${index + 1}`)
        return
      }
      const frequency = toDurationInput(medication.frequency)
      if (medication.frequency && !frequency) {
        toast.error(`Completa la frecuencia del medicamento ${index + 1}`)
        return
      }
      if (
        medication.startDate &&
        medication.endDate &&
        medication.endDate < medication.startDate
      ) {
        toast.error(`Revisa las fechas del medicamento ${index + 1}`)
        return
      }
      normalizedMedications.push({
        ...medication,
        name: medication.name.trim(),
        frequency,
      })
    }

    onSave({
      diagnosisId: values.diagnosisId,
      treatmentType: values.treatmentType.trim(),
      treatmentFrequency: normalizedFrequency,
      treatmentSituation: values.treatmentSituation,
      isReferred: values.isReferred,
      sourceHealthCenterId: values.isReferred
        ? values.sourceHealthCenterId
        : undefined,
      receivingHealthCenterId: values.receivingHealthCenterId,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      notReceivingReason: values.notReceivingReason.trim() || undefined,
      changeReason: values.changeReason.trim() || undefined,
      hasLatestPrescription: values.hasLatestPrescription,
      latestPrescriptionDate: values.latestPrescriptionDate || undefined,
      ...(normalizedMedications.length
        ? { medications: normalizedMedications }
        : {}),
    })
    toast.success("Tratamiento guardado en el borrador")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Diagnóstico asociado</Label>
          <Select
            value={diagnosisId}
            onValueChange={(v) => setValue("diagnosisId", v ?? undefined)}
          >
            <SelectTrigger>
              {diagnosisId ? (
                diagnosisLabel(diagnosisId)
              ) : (
                <SelectValue placeholder="Seleccionar diagnóstico" />
              )}
            </SelectTrigger>
            <SelectContent>
              {hasDraftDiagnosis && (
                <SelectItem value={DRAFT_DIAGNOSIS_ID}>
                  El diagnóstico que estoy guardando en este seguimiento
                </SelectItem>
              )}
              {diagnoses.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.diagnosis}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!canPickDiagnosis && (
            <p className="text-muted-foreground text-xs">
              Primero registrá un diagnóstico.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Tipo de tratamiento</Label>
          <Input
            {...register("treatmentType")}
            placeholder="Ej: Quimioterapia"
          />
        </div>
        <DurationInput
          label="Frecuencia del tratamiento"
          units={["DAY", "WEEK", "MONTH", "YEAR"]}
          defaultUnit="WEEK"
          singleValue
          value={treatmentFrequency}
          onChange={(value) => setValue("treatmentFrequency", value)}
        />
        <div className="space-y-2">
          <Label>Situación del tratamiento</Label>
          <Select
            items={TREATMENT_SITUATIONS}
            value={treatmentSituation ?? ""}
            onValueChange={(value) =>
              setValue(
                "treatmentSituation",
                value as TreatmentFormValues["treatmentSituation"],
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar situación" />
            </SelectTrigger>
            <SelectContent>
              {TREATMENT_SITUATIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fecha de inicio</Label>
          <Input type="date" {...register("startDate")} />
        </div>
        <div className="space-y-2">
          <Label>Fecha de fin (opcional)</Label>
          <Input
            type="date"
            min={startDate || undefined}
            {...register("endDate")}
          />
        </div>
        <div className="space-y-2">
          <Label>¿Recibe este tratamiento por derivación?</Label>
          <Select
            value={isReferred ? "Sí" : "No"}
            onValueChange={(v) => setValue("isReferred", v === "Sí")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sí">Sí</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isReferred ? (
          <>
            <div className="space-y-2">
              <Label>Hospital de origen</Label>
              <Select
                items={hospitals.map((h) => ({ value: h.id, label: h.name }))}
                value={sourceHealthCenterId ?? ""}
                onValueChange={(v) =>
                  setValue("sourceHealthCenterId", v ?? undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hospital receptor</Label>
              <Select
                items={hospitals.map((h) => ({ value: h.id, label: h.name }))}
                value={receivingHealthCenterId ?? ""}
                onValueChange={(v) =>
                  setValue("receivingHealthCenterId", v ?? undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar receptor" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Label>Hospital donde recibe el tratamiento</Label>
            <Select
              items={hospitals.map((h) => ({ value: h.id, label: h.name }))}
              value={receivingHealthCenterId ?? ""}
              onValueChange={(v) =>
                setValue("receivingHealthCenterId", v ?? undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <TriSelect
          label="¿Tiene la receta más reciente?"
          value={hasLatestPrescription}
          onChange={(value) => setValue("hasLatestPrescription", value)}
        />
        {hasLatestPrescription && (
          <div className="space-y-2">
            <Label>Fecha de la receta más reciente</Label>
            <Input type="date" {...register("latestPrescriptionDate")} />
          </div>
        )}
        <div className="space-y-2 md:col-span-2">
          <Label>Motivo de no recibir tratamiento</Label>
          <Textarea
            {...register("notReceivingReason")}
            placeholder="Completa si corresponde..."
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Motivo del cambio</Label>
          <Input
            {...register("changeReason")}
            placeholder="Completa si corresponde..."
          />
        </div>
      </div>
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Medicamentos</p>
            <p className="text-muted-foreground text-xs">
              Se guardarán junto con el tratamiento al completar el seguimiento.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={addMedication}
          >
            <Plus className="size-3.5" />
            Agregar
          </Button>
        </div>
        {medications.map((medication, index) => (
          <div
            key={index}
            className="bg-muted/20 space-y-4 rounded-md border p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Medicamento {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8"
                onClick={() => removeMedication(index)}
              >
                <Minus className="size-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={medication.name}
                  onChange={(event) =>
                    updateMedication(index, { name: event.target.value })
                  }
                  placeholder="Ej: Tamoxifeno"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción de dosis</Label>
                <Input
                  value={medication.doseDescription ?? ""}
                  onChange={(event) =>
                    updateMedication(index, {
                      doseDescription: event.target.value || undefined,
                    })
                  }
                  placeholder="Ej: 2 tabletas"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={medication.doseAmount ?? ""}
                    onChange={(event) =>
                      updateMedication(index, {
                        doseAmount: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Select
                    items={DOSE_UNITS}
                    value={medication.doseUnit ?? ""}
                    onValueChange={(value) =>
                      updateMedication(index, {
                        doseUnit: value as NonNullable<
                          CreateTreatmentMedicationInput["doseUnit"]
                        >,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOSE_UNITS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Vía de administración</Label>
                <Select
                  items={MEDICATION_ROUTES}
                  value={medication.route ?? ""}
                  onValueChange={(value) =>
                    updateMedication(index, {
                      route: value as NonNullable<
                        CreateTreatmentMedicationInput["route"]
                      >,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vía" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICATION_ROUTES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DurationInput
              label="Frecuencia del medicamento"
              units={["HOUR", "DAY", "WEEK", "MONTH"]}
              defaultUnit="HOUR"
              singleValue
              value={medication.frequency}
              onChange={(frequency) => updateMedication(index, { frequency })}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha de inicio</Label>
                <Input
                  type="date"
                  value={medication.startDate ?? ""}
                  onChange={(event) =>
                    updateMedication(index, {
                      startDate: event.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de fin</Label>
                <Input
                  type="date"
                  min={medication.startDate ?? undefined}
                  value={medication.endDate ?? ""}
                  onChange={(event) =>
                    updateMedication(index, {
                      endDate: event.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={medication.notes ?? ""}
                onChange={(event) =>
                  updateMedication(index, {
                    notes: event.target.value || undefined,
                  })
                }
                placeholder="Indicaciones adicionales"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={!canPickDiagnosis}>
          Guardar tratamiento
        </Button>
        <DraftBadge saved={Boolean(draft)} />
      </div>
    </form>
  )
}

// ── Seguro / SIS ──

interface InsuranceFormValues {
  insuranceType: InsuranceType | undefined
  epsProvider: EpsProvider | undefined
  changeReason: string
  startDate: string
  canAffiliate: boolean
  expectedDate: string
}

function SeguroForm({
  insuranceDraft,
  sisDraft,
  onSave,
}: {
  insuranceDraft: InsuranceDraft | undefined
  sisDraft: SisAffiliationDraft | undefined
  onSave: (
    insurance: InsuranceDraft,
    sisAffiliation: SisAffiliationDraft | undefined,
  ) => void
}) {
  const { register, handleSubmit, watch, setValue } =
    useForm<InsuranceFormValues>({
      defaultValues: {
        insuranceType: insuranceDraft?.insuranceType,
        epsProvider: insuranceDraft?.epsProvider,
        changeReason: insuranceDraft?.changeReason ?? "",
        startDate: insuranceDraft?.startDate ?? "",
        canAffiliate: sisDraft?.canAffiliate ?? false,
        expectedDate: sisDraft?.expectedDate ?? "",
      },
    })

  const insuranceType = watch("insuranceType")
  const epsProvider = watch("epsProvider")

  function onSubmit(values: InsuranceFormValues) {
    if (!values.insuranceType) {
      toast.error("Seleccioná el tipo de seguro")
      return
    }

    const insurance: InsuranceDraft = {
      insuranceType: values.insuranceType,
      epsProvider:
        values.insuranceType === "EPS" ? values.epsProvider : undefined,
      changeReason: values.changeReason || undefined,
      startDate: values.startDate || undefined,
    }

    const sisAffiliation: SisAffiliationDraft | undefined =
      values.insuranceType === "NONE"
        ? {
            canAffiliate: values.canAffiliate,
            expectedDate: values.expectedDate || undefined,
          }
        : undefined

    onSave(insurance, sisAffiliation)
    toast.success("Seguro guardado en el borrador")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de seguro</Label>
          <Select
            value={insuranceType}
            onValueChange={(v) => setValue("insuranceType", v as InsuranceType)}
          >
            <SelectTrigger>
              {insuranceType ? (
                insuranceOptions[insuranceType]
              ) : (
                <SelectValue placeholder="Seleccionar" />
              )}
            </SelectTrigger>
            <SelectContent>
              {Object.entries(insuranceOptions).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {insuranceType === "EPS" && (
          <div className="space-y-2">
            <Label>Proveedor EPS</Label>
            <Select
              value={epsProvider}
              onValueChange={(v) => setValue("epsProvider", v as EpsProvider)}
            >
              <SelectTrigger>
                {epsProvider ? (
                  epsOptions[epsProvider]
                ) : (
                  <SelectValue placeholder="Seleccionar" />
                )}
              </SelectTrigger>
              <SelectContent>
                {Object.entries(epsOptions).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Motivo del cambio</Label>
          <Input {...register("changeReason")} placeholder="Motivo" />
        </div>
        <div className="space-y-2">
          <Label>Fecha de inicio</Label>
          <Input type="date" {...register("startDate")} />
        </div>
      </div>

      {insuranceType === "NONE" && (
        <div className="border-border/60 mt-2 border-t pt-4">
          <p className="mb-3 text-sm font-medium">Afiliación SIS</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 space-y-2">
              <Checkbox
                checked={watch("canAffiliate")}
                onCheckedChange={(v) => setValue("canAffiliate", !!v)}
                id="canAffiliate"
              />
              <Label htmlFor="canAffiliate" className="cursor-pointer">
                Puede afiliarse al SIS
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Fecha esperada</Label>
              <Input type="date" {...register("expectedDate")} />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm">
          Guardar seguro
        </Button>
        <DraftBadge saved={Boolean(insuranceDraft)} />
      </div>
    </form>
  )
}

// ── Seguimiento social ──

interface SocialFormValues {
  zoneType: string
  emergencyContactGender: string | undefined
  evidenceOfDomesticViolence: boolean | undefined
  usesWoodStove: boolean | undefined
  isWorking: boolean | undefined
  receivesFinancialSupport: boolean | undefined
  referredToSocialWorker: boolean | undefined
  hasConadisCard: boolean | undefined
  knowsAboutFissal: boolean | undefined
  programDropoutDate: string
  programDropoutReason: string
}

function SeguimientoSocialForm({
  draft,
  onSave,
}: {
  draft: PatientDetailsInput | undefined
  onSave: (social: PatientDetailsInput) => void
}) {
  const { register, handleSubmit, watch, setValue } = useForm<SocialFormValues>(
    {
      defaultValues: {
        zoneType: draft?.zoneType ?? "",
        emergencyContactGender: draft?.emergencyContactGender,
        evidenceOfDomesticViolence: draft?.evidenceOfDomesticViolence,
        usesWoodStove: draft?.usesWoodStove,
        isWorking: draft?.isWorking,
        receivesFinancialSupport: draft?.receivesFinancialSupport,
        referredToSocialWorker: draft?.referredToSocialWorker,
        hasConadisCard: draft?.hasConadisCard,
        knowsAboutFissal: draft?.knowsAboutFissal,
        programDropoutDate: draft?.programDropoutDate ?? "",
        programDropoutReason: draft?.programDropoutReason ?? "",
      },
    },
  )

  const emergencyContactGender = watch("emergencyContactGender")

  function onSubmit(values: SocialFormValues) {
    onSave({
      zoneType: values.zoneType || undefined,
      emergencyContactGender: values.emergencyContactGender,
      evidenceOfDomesticViolence: values.evidenceOfDomesticViolence,
      usesWoodStove: values.usesWoodStove,
      isWorking: values.isWorking,
      receivesFinancialSupport: values.receivesFinancialSupport,
      referredToSocialWorker: values.referredToSocialWorker,
      hasConadisCard: values.hasConadisCard,
      knowsAboutFissal: values.knowsAboutFissal,
      programDropoutDate: values.programDropoutDate || undefined,
      programDropoutReason: values.programDropoutReason || undefined,
    })
    toast.success("Seguimiento social guardado en el borrador")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Zona</Label>
          <Input {...register("zoneType")} placeholder="Urbana, Rural..." />
        </div>
        <div className="space-y-2">
          <Label>Género del contacto de emergencia</Label>
          <Select
            value={emergencyContactGender}
            onValueChange={(v) =>
              setValue("emergencyContactGender", v ?? undefined)
            }
          >
            <SelectTrigger>
              {emergencyContactGender ? (
                (genderOptions[emergencyContactGender] ??
                emergencyContactGender)
              ) : (
                <SelectValue placeholder="Seleccionar" />
              )}
            </SelectTrigger>
            <SelectContent>
              {Object.entries(genderOptions).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TriSelect
          label="Evidencia de violencia doméstica"
          value={watch("evidenceOfDomesticViolence")}
          onChange={(v) => setValue("evidenceOfDomesticViolence", v)}
        />
        <TriSelect
          label="Usa cocina a leña"
          value={watch("usesWoodStove")}
          onChange={(v) => setValue("usesWoodStove", v)}
        />
        <TriSelect
          label="Trabaja actualmente"
          value={watch("isWorking")}
          onChange={(v) => setValue("isWorking", v)}
        />
        <TriSelect
          label="Recibe apoyo económico"
          value={watch("receivesFinancialSupport")}
          onChange={(v) => setValue("receivesFinancialSupport", v)}
        />
        <TriSelect
          label="Derivado a trabajo social"
          value={watch("referredToSocialWorker")}
          onChange={(v) => setValue("referredToSocialWorker", v)}
        />
        <TriSelect
          label="Tiene carnet CONADIS"
          value={watch("hasConadisCard")}
          onChange={(v) => setValue("hasConadisCard", v)}
        />
        <TriSelect
          label="Conoce FISSAL"
          value={watch("knowsAboutFissal")}
          onChange={(v) => setValue("knowsAboutFissal", v)}
        />

        <div className="space-y-2">
          <Label>Fecha de abandono del programa</Label>
          <Input type="date" {...register("programDropoutDate")} />
        </div>
        <div className="space-y-2">
          <Label>Motivo de abandono</Label>
          <Input
            {...register("programDropoutReason")}
            placeholder="Motivo..."
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm">
          Guardar seguimiento social
        </Button>
        <DraftBadge saved={Boolean(draft)} />
      </div>
    </form>
  )
}
