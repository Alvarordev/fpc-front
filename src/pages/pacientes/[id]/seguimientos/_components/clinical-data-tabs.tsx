import { useEffect, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
  PatientDetailsResponse,
  PatientSocialNote,
  PatientTreatment,
} from "@/api/patients"
import { patientsApi } from "@/api/patients"
import { followUpsApi } from "@/api/follow-ups"
import {
  calculateDurationBetweenDates,
  toDurationInput,
  type DurationDraft,
} from "@/types/duration"
import { DEPARTMENTS } from "@/pages/hospitales/_utils/departments"
import {
  usePatientAddresses,
  usePatientSocialNotes,
  useTreatmentMedications,
} from "../../_hooks/use-patient-records"
import {
  Activity,
  MapPin,
  Minus,
  Pencil,
  Pill,
  Plus,
  Phone,
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
  insuranceLabels as insuranceOptions,
  normalizeZoneType,
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
  type TreatmentDecisionMode,
  type SocialNoteDraft,
  type SocialNoteType,
} from "./clinical-drafts"
import {
  FollowUpContactForm,
  type FollowUpContactValues,
} from "./follow-up-contact-form"

// ── Tri-state Sí/No/— select ──

const TRI_UNSET = "SIN_DATO"

const TRI_OPTIONS = [
  { value: TRI_UNSET, label: "—" },
  { value: "SI", label: "Sí" },
  { value: "NO", label: "No" },
] as const

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
        items={TRI_OPTIONS}
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
  followUpId: string
  drafts: ClinicalDrafts
  onDraftsChange: (updater: (prev: ClinicalDrafts) => ClinicalDrafts) => void
}

export function ClinicalDataTabs({
  patientId,
  followUpId,
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
  const { data: socialNotes = [] } = usePatientSocialNotes(patientId)
  const { data: companions = [] } = useQuery({
    queryKey: ["patient-companions", patientId],
    queryFn: () => patientsApi.companions(patientId),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
  const queryClient = useQueryClient()
  const contactMutation = useMutation({
    mutationFn: async (values: FollowUpContactValues) => {
      if (values.kind === "NEW_CAREGIVER") {
        await patientsApi.createCompanion(patientId, {
          fullName: values.fullName.trim(),
          primaryPhone: values.primaryPhone.trim(),
          secondaryPhone: values.secondaryPhone.trim() || undefined,
          gender: values.gender || undefined,
          relationship: values.relationship || undefined,
          isCaregiver: true,
        })
        await followUpsApi.update(followUpId, { interlocutorId: patientId })
        return
      }
      if (values.kind === "PATIENT") {
        await patientsApi.update(patientId, {
          primaryPhone: values.primaryPhone.trim(),
          secondaryPhone: values.secondaryPhone.trim() || undefined,
        })
        await Promise.all(
          companions
            .filter((link) => link.isPrimaryContact)
            .map((link) =>
              patientsApi.updateCompanionLink(patientId, link.id, {
                isPrimaryContact: false,
              }),
            ),
        )
        await followUpsApi.update(followUpId, { interlocutorId: patientId })
        return
      }

      await patientsApi.update(values.companionId, {
        fullName: values.fullName.trim(),
        primaryPhone: values.primaryPhone.trim(),
        secondaryPhone: values.secondaryPhone.trim() || undefined,
        gender: values.gender || undefined,
      })
      await patientsApi.updateCompanionLink(patientId, values.linkId, {
        relationship: values.relationship || undefined,
        isPrimaryContact: values.isPrimaryContact,
        isCaregiver: values.isCaregiver,
      })
      await followUpsApi.update(followUpId, {
        interlocutorId: values.companionId,
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patient-profile", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-companions", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-follow-ups", patientId],
        }),
      ])
      toast.success("Información de contacto actualizada")
    },
    onError: (error: Error) =>
      toast.error("No se pudo actualizar la información de contacto", {
        description: error.message,
      }),
  })

  const diagnoses = patient?.diagnoses ?? []
  const currentDiagnosis = diagnoses.find((d) => d.isCurrent)

  return (
    <Tabs
      orientation="vertical"
      value={activeTab}
      onValueChange={(value) => setActiveTab(String(value))}
      className="flex-col items-stretch gap-3 lg:flex-row"
    >
      <TabsList className="border-border/60 bg-muted/40 h-fit w-full shrink-0 justify-start gap-1 overflow-x-auto rounded-xl border p-1 lg:w-48 lg:flex-col lg:overflow-visible">
        <TabsTrigger
          value="datos"
          className="min-h-10 flex-none justify-start gap-2"
        >
          <UserRound className="size-4 text-sky-600" />
          <span>Datos clínicos</span>
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
          value="contacto"
          className="min-h-10 flex-none justify-start gap-2"
        >
          <Phone className="size-4 text-cyan-600" />
          <span>Contacto</span>
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
          <span>Tratamientos</span>
          {drafts.treatments?.length ? <DraftDot /> : null}
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
          {(drafts.social || drafts.socialNotes?.length) && <DraftDot />}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="datos" keepMounted className="min-w-0 flex-1 pr-1">
        <DatosGeneralesForm
          draft={drafts.details}
          currentDetails={patient?.details ?? null}
          onSave={(details) => onDraftsChange((prev) => ({ ...prev, details }))}
        />
      </TabsContent>
      <TabsContent value="sintomas" keepMounted className="min-w-0 flex-1 pr-1">
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
        className="min-w-0 flex-1 pr-1"
      >
        <AddressForm
          draft={drafts.address}
          addresses={addresses}
          onSave={(address) => onDraftsChange((prev) => ({ ...prev, address }))}
        />
      </TabsContent>
      <TabsContent value="contacto" keepMounted className="min-w-0 flex-1 pr-1">
        {patient ? (
          <FollowUpContactForm
            key={companions.map((link) => link.id).join(",")}
            patient={patient}
            companions={companions}
            isPending={contactMutation.isPending}
            onSubmit={async (values) => contactMutation.mutateAsync(values)}
          />
        ) : (
          <p className="text-muted-foreground text-sm">Cargando contacto...</p>
        )}
      </TabsContent>
      <TabsContent
        value="diagnostico"
        keepMounted
        className="min-w-0 flex-1 pr-1"
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
        className="min-w-0 flex-1 pr-1"
      >
        <TratamientosForm
          draft={drafts.treatments}
          hospitals={hospitals}
          diagnoses={diagnoses}
          treatments={patient?.treatments ?? []}
          hasDraftDiagnosis={Boolean(drafts.diagnosis)}
          onSave={(treatments) =>
            onDraftsChange((prev) => ({ ...prev, treatments }))
          }
        />
      </TabsContent>
      <TabsContent value="seguro" keepMounted className="min-w-0 flex-1 pr-1">
        <SeguroForm
          insuranceDraft={drafts.insurance}
          sisDraft={drafts.sisAffiliation}
          onSave={(insurance, sisAffiliation) =>
            onDraftsChange((prev) => ({ ...prev, insurance, sisAffiliation }))
          }
        />
      </TabsContent>
      <TabsContent value="social" keepMounted className="min-w-0 flex-1 pr-1">
        <SeguimientoSocialForm
          draft={drafts.social}
          currentDetails={patient?.details ?? null}
          existingNotes={socialNotes}
          noteDrafts={drafts.socialNotes}
          onSave={(social, notes) =>
            onDraftsChange((prev) => ({ ...prev, social, socialNotes: notes }))
          }
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

function asDurationDraft(
  value:
    | {
        valueMin: number
        valueMax?: number | null
        unit: NonNullable<DurationDraft["unit"]>
      }
    | null
    | undefined,
): DurationDraft | undefined {
  if (!value) return undefined
  return {
    valueMin: value.valueMin,
    ...(value.valueMax !== undefined && value.valueMax !== null
      ? { valueMax: value.valueMax }
      : {}),
    unit: value.unit,
  }
}

// ── Direcciones ──

const ADDRESS_TYPES = [
  { value: "PERMANENT", label: "Permanente" },
  { value: "TEMPORARY", label: "Temporal" },
] as const

const DEPARTMENT_OPTIONS = DEPARTMENTS

const ZONE_TYPES = [
  { value: "URBAN", label: "Urbana" },
  { value: "RURAL", label: "Rural" },
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
        isPrimary:
          draft?.type === "TEMPORARY" ? false : (draft?.isPrimary ?? true),
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
      isPrimary: values.type === "TEMPORARY" ? false : values.isPrimary,
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
              onValueChange={(value) => {
                const nextType = value as AddressFormValues["type"]
                setValue("type", nextType)
                if (nextType === "TEMPORARY") setValue("isPrimary", false)
              }}
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
                value: value.value,
                label: value.label,
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
                {DEPARTMENT_OPTIONS.map((department) => (
                  <SelectItem key={department.value} value={department.value}>
                    {department.label}
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
              checked={addressType === "PERMANENT" && isPrimary}
              disabled={addressType === "TEMPORARY"}
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
  nativeLanguage: string
  educationLevel: EducationLevel | undefined
  requiresTranslation: boolean
  travelTimeToHospital: DurationDraft | undefined
}

function DatosGeneralesForm({
  draft,
  currentDetails,
  onSave,
}: {
  draft: PatientDetailsInput | undefined
  currentDetails: PatientDetailsResponse["details"] | null
  onSave: (details: PatientDetailsInput) => void
}) {
  const { register, handleSubmit, watch, setValue, reset } =
    useForm<DatosGeneralesValues>({
      defaultValues: {
        nativeLanguage:
          draft?.nativeLanguage ?? currentDetails?.nativeLanguage ?? "",
        educationLevel:
          draft?.educationLevel ?? currentDetails?.educationLevel ?? undefined,
        requiresTranslation:
          draft?.requiresTranslation ??
          currentDetails?.requiresTranslation ??
          false,
        travelTimeToHospital: asDurationDraft(
          draft?.travelTimeToHospital ?? currentDetails?.travelTimeToHospital,
        ),
      },
    })

  const educationLevel = watch("educationLevel")
  const travelTimeToHospital = watch("travelTimeToHospital")

  useEffect(() => {
    if (!currentDetails && !draft) return
    reset({
      nativeLanguage:
        draft?.nativeLanguage ?? currentDetails?.nativeLanguage ?? "",
      educationLevel:
        draft?.educationLevel ?? currentDetails?.educationLevel ?? undefined,
      requiresTranslation:
        draft?.requiresTranslation ??
        currentDetails?.requiresTranslation ??
        false,
      travelTimeToHospital: asDurationDraft(
        draft?.travelTimeToHospital ?? currentDetails?.travelTimeToHospital,
      ),
    })
  }, [currentDetails, draft, reset])

  function onSubmit(values: DatosGeneralesValues) {
    onSave({
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
          <Label>Lengua nativa</Label>
          <Input
            {...register("nativeLanguage")}
            placeholder="Español, Quechua..."
          />
        </div>
        <div className="space-y-2">
          <Label>Nivel educativo</Label>
          <Select
            items={Object.entries(educationOptions).map(([value, label]) => ({
              value,
              label,
            }))}
            value={educationLevel}
            onValueChange={(v) =>
              setValue("educationLevel", v as EducationLevel)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
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
  changeReason: string
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
        changeReason: draft?.changeReason ?? "",
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
    if (currentDiagnosis && !values.changeReason.trim()) {
      toast.error("Indica el motivo del reemplazo del diagnóstico")
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
      changeReason: values.changeReason.trim() || undefined,
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
        {currentDiagnosis && (
          <div className="space-y-2 md:col-span-2">
            <Label>Motivo del reemplazo</Label>
            <Textarea
              {...register("changeReason")}
              placeholder="Explica por qué se actualiza el diagnóstico..."
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Etapa</Label>
          <Select
            items={Object.entries(cancerStageOptions).map(([value, label]) => ({
              value,
              label,
            }))}
            value={cancerStage}
            onValueChange={(v) => setValue("cancerStage", v as CancerStage)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar etapa" />
            </SelectTrigger>
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
            items={hospitals.map((hospital) => ({
              value: hospital.id,
              label: hospital.name,
            }))}
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

function TratamientosForm({
  draft,
  hospitals,
  diagnoses,
  treatments,
  hasDraftDiagnosis,
  onSave,
}: {
  draft: TreatmentDraft[] | undefined
  hospitals: Array<{ id: string; name: string }>
  diagnoses: Array<{ id: string; diagnosis: string }>
  treatments: PatientTreatment[]
  hasDraftDiagnosis: boolean
  onSave: (treatments: TreatmentDraft[]) => void
}) {
  const initial = draft?.[0]
  const { register, handleSubmit, setValue, reset, control } =
    useForm<TreatmentFormValues>({
      defaultValues: {
        diagnosisId: initial?.diagnosisId,
        treatmentType: initial?.treatmentType ?? "",
        treatmentFrequency: initial?.treatmentFrequency,
        treatmentSituation: initial?.treatmentSituation,
        isReferred: initial?.isReferred ?? false,
        sourceHealthCenterId: initial?.sourceHealthCenterId ?? undefined,
        receivingHealthCenterId: initial?.receivingHealthCenterId ?? undefined,
        startDate: initial?.startDate ?? "",
        endDate: initial?.endDate ?? "",
        notReceivingReason: initial?.notReceivingReason ?? "",
        changeReason: initial?.changeReason ?? "",
        hasLatestPrescription: initial?.hasLatestPrescription ?? undefined,
        latestPrescriptionDate: initial?.latestPrescriptionDate ?? "",
        medications: initial?.medications ?? [],
      },
    })
  const {
    fields: medicationFields,
    append,
    remove,
    replace,
    update,
  } = useFieldArray({
    control,
    name: "medications",
  })
  const watched = useWatch({ control })
  const diagnosisId = watched.diagnosisId
  const isReferred = watched.isReferred ?? false
  const sourceHealthCenterId = watched.sourceHealthCenterId
  const receivingHealthCenterId = watched.receivingHealthCenterId
  const treatmentFrequency = watched.treatmentFrequency
  const treatmentSituation = watched.treatmentSituation
  const startDate = watched.startDate ?? ""
  const hasLatestPrescription = watched.hasLatestPrescription
  const medications = watched.medications ?? []
  const canPickDiagnosis = diagnoses.length > 0 || hasDraftDiagnosis
  const [mode, setMode] = useState<TreatmentDecisionMode>(
    initial?.mode ?? "PARALLEL",
  )
  const [selectedSeriesId, setSelectedSeriesId] = useState(
    initial?.seriesId ?? "",
  )
  const [decisions, setDecisions] = useState<TreatmentDraft[]>(draft ?? [])
  const [editingDecisionIndex, setEditingDecisionIndex] = useState<
    number | null
  >(null)
  const currentTreatments = treatments.filter((item) => item.isCurrent)
  const selectedTreatment = currentTreatments.find(
    (item) => item.seriesId === selectedSeriesId,
  )
  const { data: selectedTreatmentMedications } = useTreatmentMedications(
    selectedTreatment?.patientId ?? "",
    selectedTreatment?.id ?? "",
    mode === "REPLACE" &&
      Boolean(selectedTreatment) &&
      editingDecisionIndex === null,
  )
  const diagnosisItems = [
    ...(hasDraftDiagnosis
      ? [
          {
            value: DRAFT_DIAGNOSIS_ID,
            label: "Diagnóstico de este seguimiento",
          },
        ]
      : []),
    ...diagnoses.map((item) => ({ value: item.id, label: item.diagnosis })),
  ]
  const decisionModeItems = [
    { value: "PARALLEL", label: "Agregar tratamiento en paralelo" },
    { value: "REPLACE", label: "Actualizar tratamiento existente" },
  ] as const
  const yesNoItems = [
    { value: "SI", label: "Sí" },
    { value: "NO", label: "No" },
  ] as const

  function valuesFromTreatment(
    treatment: PatientTreatment,
  ): TreatmentFormValues {
    return {
      diagnosisId: treatment.diagnosisId,
      treatmentType: treatment.treatmentType,
      treatmentFrequency: treatment.treatmentFrequency
        ? {
            valueMin: treatment.treatmentFrequency.valueMin,
            ...(treatment.treatmentFrequency.valueMax !== null
              ? { valueMax: treatment.treatmentFrequency.valueMax }
              : {}),
            unit: treatment.treatmentFrequency.unit,
          }
        : undefined,
      treatmentSituation: treatment.treatmentSituation ?? undefined,
      isReferred: treatment.isReferred,
      sourceHealthCenterId: treatment.sourceHealthCenterId ?? undefined,
      receivingHealthCenterId: treatment.receivingHealthCenterId ?? undefined,
      startDate: treatment.startDate ?? "",
      endDate: treatment.endDate ?? "",
      notReceivingReason: treatment.notReceivingReason ?? "",
      changeReason: "",
      hasLatestPrescription: treatment.hasLatestPrescription ?? undefined,
      latestPrescriptionDate: treatment.latestPrescriptionDate ?? "",
      medications: [],
    }
  }

  function selectTreatment(seriesId: string) {
    setSelectedSeriesId(seriesId)
    const treatment = currentTreatments.find(
      (item) => item.seriesId === seriesId,
    )
    if (treatment) reset(valuesFromTreatment(treatment))
  }

  useEffect(() => {
    if (
      mode !== "REPLACE" ||
      !selectedSeriesId ||
      editingDecisionIndex !== null ||
      !selectedTreatmentMedications
    ) {
      return
    }

    replace(
      selectedTreatmentMedications.map((medication) => ({
        name: medication.name,
        doseAmount: medication.doseAmount ?? undefined,
        doseUnit: medication.doseUnit ?? undefined,
        doseDescription: medication.doseDescription ?? undefined,
        route: medication.route ?? undefined,
        frequency: medication.frequency
          ? {
              valueMin: medication.frequency.valueMin,
              ...(medication.frequency.valueMax !== null
                ? { valueMax: medication.frequency.valueMax }
                : {}),
              unit: medication.frequency.unit,
            }
          : undefined,
        startDate: medication.startDate ?? undefined,
        endDate: medication.endDate ?? undefined,
        isActive: medication.isActive,
        notes: medication.notes ?? undefined,
      })),
    )
  }, [
    editingDecisionIndex,
    mode,
    replace,
    selectedSeriesId,
    selectedTreatmentMedications,
  ])

  function editDecision(index: number) {
    const decision = decisions[index]
    if (!decision) return
    setEditingDecisionIndex(index)
    setMode(decision.mode)
    setSelectedSeriesId(decision.seriesId ?? "")
    reset({
      diagnosisId: decision.diagnosisId,
      treatmentType: decision.treatmentType,
      treatmentFrequency: decision.treatmentFrequency,
      treatmentSituation: decision.treatmentSituation,
      isReferred: decision.isReferred ?? false,
      sourceHealthCenterId: decision.sourceHealthCenterId,
      receivingHealthCenterId: decision.receivingHealthCenterId,
      startDate: decision.startDate ?? "",
      endDate: decision.endDate ?? "",
      notReceivingReason: decision.notReceivingReason ?? "",
      changeReason: decision.changeReason ?? "",
      hasLatestPrescription: decision.hasLatestPrescription,
      latestPrescriptionDate: decision.latestPrescriptionDate ?? "",
      medications: decision.medications ?? [],
    })
  }

  function diagnosisLabel(id: string) {
    if (id === DRAFT_DIAGNOSIS_ID)
      return "El diagnóstico que estoy guardando en este seguimiento"
    return diagnoses.find((d) => d.id === id)?.diagnosis
  }

  function updateMedication(
    index: number,
    partial: Partial<TreatmentFormValues["medications"][number]>,
  ) {
    const current = medications[index]
    if (!current) return
    update(index, {
      ...current,
      ...partial,
      name: partial.name ?? current.name ?? "",
    })
  }

  function addMedication() {
    append({ name: "", isActive: true })
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

    const nextDecision: TreatmentDraft = {
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
      mode,
      ...(mode === "REPLACE" && selectedSeriesId
        ? { seriesId: selectedSeriesId }
        : {}),
    }
    if (mode === "REPLACE" && !selectedSeriesId) {
      toast.error("Seleccioná el tratamiento que deseas actualizar")
      return
    }
    if (
      mode === "REPLACE" &&
      decisions.some(
        (decision, index) =>
          index !== editingDecisionIndex &&
          decision.seriesId === selectedSeriesId,
      )
    ) {
      toast.error("Ya agregaste una actualización para ese tratamiento")
      return
    }
    if (mode === "REPLACE" && !values.changeReason.trim()) {
      toast.error("Indica el motivo de actualización del tratamiento")
      return
    }
    const nextDecisions = [...decisions]
    if (editingDecisionIndex === null) nextDecisions.push(nextDecision)
    else nextDecisions[editingDecisionIndex] = nextDecision
    setDecisions(nextDecisions)
    onSave(nextDecisions)
    reset({
      diagnosisId: undefined,
      treatmentType: "",
      treatmentFrequency: undefined,
      treatmentSituation: undefined,
      isReferred: false,
      sourceHealthCenterId: undefined,
      receivingHealthCenterId: undefined,
      startDate: "",
      endDate: "",
      notReceivingReason: "",
      changeReason: "",
      hasLatestPrescription: undefined,
      latestPrescriptionDate: "",
      medications: [],
    })
    setMode("PARALLEL")
    setSelectedSeriesId("")
    setEditingDecisionIndex(null)
    toast.success("Tratamiento guardado en el borrador")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {decisions.length > 0 && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Cambios pendientes</p>
            <span className="text-muted-foreground text-xs">
              {decisions.length}
            </span>
          </div>
          {decisions.map((decision, index) => (
            <div
              key={`${decision.seriesId ?? "parallel"}-${index}`}
              className="bg-card flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span>
                <b>{decision.treatmentType}</b>
                <span className="text-muted-foreground ml-2 text-xs">
                  {decision.mode === "REPLACE" ? "Actualización" : "Paralelo"}
                </span>
              </span>
              <span className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => editDecision(index)}
                  aria-label="Editar cambio"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    const next = decisions.filter(
                      (_, itemIndex) => itemIndex !== index,
                    )
                    setDecisions(next)
                    onSave(next)
                  }}
                  aria-label="Quitar cambio"
                >
                  <Minus className="size-3.5" />
                </Button>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="bg-muted/20 space-y-3 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">
            {editingDecisionIndex === null
              ? "Nueva decisión de tratamiento"
              : "Editar decisión de tratamiento"}
          </p>
          <p className="text-muted-foreground text-xs">
            Actualiza una línea existente o registra una línea simultánea.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Tipo de decisión</Label>
            <Select
              items={decisionModeItems}
              value={mode}
              onValueChange={(value) => {
                const nextMode = (value || "PARALLEL") as TreatmentDecisionMode
                setMode(nextMode)
                if (nextMode === "PARALLEL") setSelectedSeriesId("")
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {decisionModeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mode === "REPLACE" && (
            <div className="space-y-2 md:col-span-2">
              <Label>Línea de tratamiento a actualizar</Label>
              <Select
                items={currentTreatments.map((item) => ({
                  value: item.seriesId,
                  label: `${item.treatmentType} · ${item.diagnosisSummary?.diagnosis ?? "Sin diagnóstico"}`,
                }))}
                value={selectedSeriesId}
                onValueChange={(value) => selectTreatment(value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tratamiento actual" />
                </SelectTrigger>
                <SelectContent>
                  {currentTreatments.map((item) => (
                    <SelectItem key={item.seriesId} value={item.seriesId}>
                      {item.treatmentType} ·{" "}
                      {item.diagnosisSummary?.diagnosis ?? "Sin diagnóstico"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Diagnóstico asociado</Label>
            <Select
              items={diagnosisItems}
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
                {diagnosisItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
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
              items={yesNoItems}
              value={isReferred ? "SI" : "NO"}
              onValueChange={(v) => setValue("isReferred", v === "SI")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SI">Sí</SelectItem>
                <SelectItem value="NO">No</SelectItem>
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
            <Label>
              {mode === "REPLACE"
                ? "Motivo de actualización"
                : "Motivo del cambio"}
            </Label>
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
                Se guardarán junto con el tratamiento al completar el
                seguimiento.
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
          {medicationFields.map((field, index) => {
            const medication = medications[index] ?? field
            return (
              <div
                key={field.id}
                className="bg-muted/20 space-y-4 rounded-md border p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Medicamento {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8"
                    onClick={() => remove(index)}
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
                  onChange={(frequency) =>
                    updateMedication(index, { frequency })
                  }
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
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={!canPickDiagnosis}>
          Guardar tratamiento
        </Button>
        <DraftBadge saved={Boolean(draft?.length)} />
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
            items={Object.entries(insuranceOptions).map(([value, label]) => ({
              value,
              label,
            }))}
            value={insuranceType}
            onValueChange={(v) => setValue("insuranceType", v as InsuranceType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
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
              items={Object.entries(epsOptions).map(([value, label]) => ({
                value,
                label,
              }))}
              value={epsProvider}
              onValueChange={(v) => setValue("epsProvider", v as EpsProvider)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
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

const SOCIAL_NOTE_SECTIONS: Array<{
  type: SocialNoteType
  title: string
  description: string
  placeholder: string
}> = [
  {
    type: "SOCIAL_WORKER",
    title: "Derivación a trabajo social",
    description:
      "Registra qué ocurrió con la derivación y si ayudó al paciente.",
    placeholder: "Ej: Se logró contactar al área social; orientaron sobre...",
  },
  {
    type: "CONADIS",
    title: "Carnet CONADIS",
    description: "Registra avances, dificultades o información pendiente.",
    placeholder: "Ej: Inició el trámite; falta presentar...",
  },
  {
    type: "FISSAL",
    title: "FISSAL",
    description: "Registra orientación recibida, trámite o resultado.",
    placeholder: "Ej: Conoce el beneficio; se le explicó cómo...",
  },
]

function SeguimientoSocialForm({
  draft,
  currentDetails,
  existingNotes,
  noteDrafts,
  onSave,
}: {
  draft: PatientDetailsInput | undefined
  currentDetails: PatientDetailsResponse["details"] | null
  existingNotes: PatientSocialNote[]
  noteDrafts: SocialNoteDraft[] | undefined
  onSave: (social: PatientDetailsInput, notes: SocialNoteDraft[]) => void
}) {
  const { register, handleSubmit, watch, setValue, reset } =
    useForm<SocialFormValues>({
      defaultValues: {
        zoneType:
          normalizeZoneType(draft?.zoneType ?? currentDetails?.zoneType) ?? "",
        evidenceOfDomesticViolence:
          draft?.evidenceOfDomesticViolence ??
          currentDetails?.evidenceOfDomesticViolence ??
          undefined,
        usesWoodStove:
          draft?.usesWoodStove ?? currentDetails?.usesWoodStove ?? undefined,
        isWorking: draft?.isWorking ?? currentDetails?.isWorking ?? undefined,
        receivesFinancialSupport:
          draft?.receivesFinancialSupport ??
          currentDetails?.receivesFinancialSupport ??
          undefined,
        referredToSocialWorker:
          draft?.referredToSocialWorker ??
          currentDetails?.referredToSocialWorker ??
          undefined,
        hasConadisCard:
          draft?.hasConadisCard ?? currentDetails?.hasConadisCard ?? undefined,
        knowsAboutFissal:
          draft?.knowsAboutFissal ??
          currentDetails?.knowsAboutFissal ??
          undefined,
        programDropoutDate:
          draft?.programDropoutDate ?? currentDetails?.programDropoutDate ?? "",
        programDropoutReason:
          draft?.programDropoutReason ??
          currentDetails?.programDropoutReason ??
          "",
      },
    })
  const [notes, setNotes] = useState<Record<SocialNoteType, string>>(() => ({
    SOCIAL_WORKER:
      noteDrafts?.find((note) => note.type === "SOCIAL_WORKER")?.note ?? "",
    CONADIS: noteDrafts?.find((note) => note.type === "CONADIS")?.note ?? "",
    FISSAL: noteDrafts?.find((note) => note.type === "FISSAL")?.note ?? "",
  }))

  useEffect(() => {
    if (!currentDetails && !draft) return
    reset({
      zoneType:
        normalizeZoneType(draft?.zoneType ?? currentDetails?.zoneType) ?? "",
      evidenceOfDomesticViolence:
        draft?.evidenceOfDomesticViolence ??
        currentDetails?.evidenceOfDomesticViolence ??
        undefined,
      usesWoodStove:
        draft?.usesWoodStove ?? currentDetails?.usesWoodStove ?? undefined,
      isWorking: draft?.isWorking ?? currentDetails?.isWorking ?? undefined,
      receivesFinancialSupport:
        draft?.receivesFinancialSupport ??
        currentDetails?.receivesFinancialSupport ??
        undefined,
      referredToSocialWorker:
        draft?.referredToSocialWorker ??
        currentDetails?.referredToSocialWorker ??
        undefined,
      hasConadisCard:
        draft?.hasConadisCard ?? currentDetails?.hasConadisCard ?? undefined,
      knowsAboutFissal:
        draft?.knowsAboutFissal ??
        currentDetails?.knowsAboutFissal ??
        undefined,
      programDropoutDate:
        draft?.programDropoutDate ?? currentDetails?.programDropoutDate ?? "",
      programDropoutReason:
        draft?.programDropoutReason ??
        currentDetails?.programDropoutReason ??
        "",
    })
  }, [currentDetails, draft, reset])

  function onSubmit(values: SocialFormValues) {
    const nextNotes = SOCIAL_NOTE_SECTIONS.flatMap(({ type }) => {
      const note = notes[type].trim()
      return note ? [{ type, note }] : []
    })
    onSave(
      {
        zoneType: values.zoneType || undefined,
        evidenceOfDomesticViolence: values.evidenceOfDomesticViolence,
        usesWoodStove: values.usesWoodStove,
        isWorking: values.isWorking,
        receivesFinancialSupport: values.receivesFinancialSupport,
        referredToSocialWorker: values.referredToSocialWorker,
        hasConadisCard: values.hasConadisCard,
        knowsAboutFissal: values.knowsAboutFissal,
        programDropoutDate: values.programDropoutDate || undefined,
        programDropoutReason: values.programDropoutReason || undefined,
      },
      nextNotes,
    )
    toast.success("Seguimiento social guardado en el borrador")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Zonificación de residencia</Label>
          <Select
            items={ZONE_TYPES}
            value={watch("zoneType")}
            onValueChange={(value) => setValue("zoneType", value ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar zonificación" />
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
      <div className="space-y-3 border-t pt-4">
        <div>
          <p className="text-sm font-medium">Notas de estado</p>
          <p className="text-muted-foreground text-xs">
            Las notas se agregan al historial de cada tema al completar este
            seguimiento.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {SOCIAL_NOTE_SECTIONS.map((section) => {
            const history = existingNotes.filter(
              (note) => note.type === section.type,
            )
            return (
              <div
                key={section.type}
                className="bg-muted/20 space-y-2 rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{section.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {section.description}
                  </p>
                </div>
                {history[0] && (
                  <div className="bg-card rounded-md border p-2 text-xs">
                    <p className="text-muted-foreground mb-1">
                      Última nota ·{" "}
                      {new Date(history[0].createdAt).toLocaleDateString(
                        "es-PE",
                      )}
                    </p>
                    <p>{history[0].note}</p>
                  </div>
                )}
                <Textarea
                  value={notes[section.type]}
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [section.type]: event.target.value,
                    }))
                  }
                  placeholder={section.placeholder}
                  rows={4}
                />
                {history.length > 1 && (
                  <p className="text-muted-foreground text-xs">
                    {history.length} notas anteriores en el historial.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm">
          Guardar seguimiento social
        </Button>
        <DraftBadge saved={Boolean(draft || noteDrafts?.length)} />
      </div>
    </form>
  )
}
