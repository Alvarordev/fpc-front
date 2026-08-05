import { useForm } from "react-hook-form"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { healthCentersApi } from "@/api/health-centers"
import type { PatientDetailsInput } from "@/api/patients"
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
  type TreatmentDraft,
} from "./clinical-drafts"

// ── Tri-state Sí/No/— select ──

const TRI_UNSET = "SIN_DATO"

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
  return <p className="text-xs text-emerald-600">✓ Guardado en el borrador. Se registrará al completar el seguimiento.</p>
}

interface ClinicalDataTabsProps {
  patientId: string
  drafts: ClinicalDrafts
  onDraftsChange: (updater: (prev: ClinicalDrafts) => ClinicalDrafts) => void
}

export function ClinicalDataTabs({ patientId, drafts, onDraftsChange }: ClinicalDataTabsProps) {
  const { data: patient } = usePatient(patientId)
  const { data: hospitals = [] } = useQuery({
    queryKey: ["health-centers"],
    queryFn: () => healthCentersApi.list(),
    staleTime: 5 * 60 * 1000,
  })

  const diagnoses = patient?.diagnoses ?? []
  const currentDiagnosis = diagnoses.find((d) => d.isCurrent)

  return (
    <Tabs defaultValue="datos" className="w-full">
      <TabsList className="mb-4 w-full justify-start overflow-x-auto">
        <TabsTrigger value="datos">Datos generales{drafts.details ? " •" : ""}</TabsTrigger>
        <TabsTrigger value="diagnostico">Diagnóstico{drafts.diagnosis ? " •" : ""}</TabsTrigger>
        <TabsTrigger value="tratamiento">Tratamiento{drafts.treatment ? " •" : ""}</TabsTrigger>
        <TabsTrigger value="seguro">Seguro / SIS{drafts.insurance ? " •" : ""}</TabsTrigger>
        <TabsTrigger value="social">Seguimiento social{drafts.social ? " •" : ""}</TabsTrigger>
      </TabsList>

      <TabsContent value="datos">
        <DatosGeneralesForm
          draft={drafts.details}
          onSave={(details) => onDraftsChange((prev) => ({ ...prev, details }))}
        />
      </TabsContent>
      <TabsContent value="diagnostico">
        <DiagnosticoForm
          draft={drafts.diagnosis}
          hospitals={hospitals}
          currentDiagnosis={currentDiagnosis}
          onSave={(diagnosis) => onDraftsChange((prev) => ({ ...prev, diagnosis }))}
        />
      </TabsContent>
      <TabsContent value="tratamiento">
        <TratamientoForm
          draft={drafts.treatment}
          hospitals={hospitals}
          diagnoses={diagnoses}
          hasDraftDiagnosis={Boolean(drafts.diagnosis)}
          onSave={(treatment) => onDraftsChange((prev) => ({ ...prev, treatment }))}
        />
      </TabsContent>
      <TabsContent value="seguro">
        <SeguroForm
          insuranceDraft={drafts.insurance}
          sisDraft={drafts.sisAffiliation}
          onSave={(insurance, sisAffiliation) =>
            onDraftsChange((prev) => ({ ...prev, insurance, sisAffiliation }))
          }
        />
      </TabsContent>
      <TabsContent value="social">
        <SeguimientoSocialForm
          draft={drafts.social}
          onSave={(social) => onDraftsChange((prev) => ({ ...prev, social }))}
        />
      </TabsContent>
    </Tabs>
  )
}

// ── Datos generales ──

interface DatosGeneralesValues {
  currentAddress: string
  currentDistrict: string
  currentDepartment: string
  emergencyContactName: string
  emergencyContactPhone: string
  nativeLanguage: string
  educationLevel: EducationLevel | undefined
  requiresTranslation: boolean
}

function DatosGeneralesForm({
  draft,
  onSave,
}: {
  draft: PatientDetailsInput | undefined
  onSave: (details: PatientDetailsInput) => void
}) {
  const { register, handleSubmit, watch, setValue } = useForm<DatosGeneralesValues>({
    defaultValues: {
      currentAddress: draft?.currentAddress ?? "",
      currentDistrict: draft?.currentDistrict ?? "",
      currentDepartment: draft?.currentDepartment ?? "",
      emergencyContactName: draft?.emergencyContactName ?? "",
      emergencyContactPhone: draft?.emergencyContactPhone ?? "",
      nativeLanguage: draft?.nativeLanguage ?? "",
      educationLevel: draft?.educationLevel,
      requiresTranslation: draft?.requiresTranslation ?? false,
    },
  })

  const educationLevel = watch("educationLevel")

  function onSubmit(values: DatosGeneralesValues) {
    onSave({
      currentAddress: values.currentAddress || undefined,
      currentDistrict: values.currentDistrict || undefined,
      currentDepartment: values.currentDepartment || undefined,
      emergencyContactName: values.emergencyContactName || undefined,
      emergencyContactPhone: values.emergencyContactPhone || undefined,
      nativeLanguage: values.nativeLanguage || undefined,
      educationLevel: values.educationLevel,
      requiresTranslation: values.requiresTranslation,
    })
    toast.success("Datos generales guardados en el borrador")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Dirección actual</Label>
          <Input {...register("currentAddress")} placeholder="Av. Principal 123" />
        </div>
        <div className="space-y-2">
          <Label>Distrito</Label>
          <Input {...register("currentDistrict")} placeholder="Miraflores" />
        </div>
        <div className="space-y-2">
          <Label>Contacto de emergencia</Label>
          <Input {...register("emergencyContactName")} placeholder="Nombre del contacto" />
        </div>
        <div className="space-y-2">
          <Label>Teléfono de emergencia</Label>
          <Input {...register("emergencyContactPhone")} placeholder="+51999000000" />
        </div>
        <div className="space-y-2">
          <Label>Departamento</Label>
          <Input {...register("currentDepartment")} placeholder="Lima" />
        </div>
        <div className="space-y-2">
          <Label>Lengua nativa</Label>
          <Input {...register("nativeLanguage")} placeholder="Español, Quechua..." />
        </div>
        <div className="space-y-2">
          <Label>Nivel educativo</Label>
          <Select
            value={educationLevel}
            onValueChange={(v) => setValue("educationLevel", v as EducationLevel)}
          >
            <SelectTrigger>
              {educationLevel ? educationOptions[educationLevel] : <SelectValue placeholder="Seleccionar" />}
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

// ── Diagnóstico ──

interface DiagnosisFormValues {
  diagnosis: string
  cancerStage: CancerStage
  diagnosisDate: string
  healthCenterId: string | undefined
  symptomLeadingToCheckup: string
  waitTimeForDiagnosis: string
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
  const { register, handleSubmit, watch, setValue } = useForm<DiagnosisFormValues>({
    defaultValues: {
      diagnosis: draft?.diagnosis ?? "",
      cancerStage: draft?.cancerStage ?? "UNKNOWN",
      diagnosisDate: draft?.diagnosisDate ?? "",
      healthCenterId: draft?.healthCenterId,
      symptomLeadingToCheckup: draft?.symptomLeadingToCheckup ?? "",
      waitTimeForDiagnosis: draft?.waitTimeForDiagnosis ?? "",
      hasMedicalReport: draft?.hasMedicalReport ?? false,
    },
  })

  const cancerStage = watch("cancerStage")
  const healthCenterId = watch("healthCenterId")

  function onSubmit(values: DiagnosisFormValues) {
    if (!values.diagnosis.trim()) {
      toast.error("Ingresá el diagnóstico")
      return
    }

    onSave({
      diagnosis: values.diagnosis.trim(),
      cancerStage: values.cancerStage,
      diagnosisDate: values.diagnosisDate || undefined,
      healthCenterId: values.healthCenterId,
      symptomLeadingToCheckup: values.symptomLeadingToCheckup || undefined,
      waitTimeForDiagnosis: values.waitTimeForDiagnosis || undefined,
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
          <Select value={cancerStage} onValueChange={(v) => setValue("cancerStage", v as CancerStage)}>
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
          <Input type="date" {...register("diagnosisDate")} />
        </div>
        <div className="space-y-2">
          <Label>Establecimiento de salud</Label>
          <Select value={healthCenterId} onValueChange={(v) => setValue("healthCenterId", v ?? undefined)}>
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
          <Input {...register("symptomLeadingToCheckup")} placeholder="Ej: Bulto en seno" />
        </div>
        <div className="space-y-2">
          <Label>Tiempo de espera para diagnóstico</Label>
          <Input {...register("waitTimeForDiagnosis")} placeholder="Ej: 2 meses" />
        </div>
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
  treatmentFrequency: string
  healthCenterId: string | undefined
  startDate: string
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
  const { register, handleSubmit, watch, setValue } = useForm<TreatmentFormValues>({
    defaultValues: {
      diagnosisId: draft?.diagnosisId,
      treatmentType: draft?.treatmentType ?? "",
      treatmentFrequency: draft?.treatmentFrequency ?? "",
      healthCenterId: draft?.healthCenterId,
      startDate: draft?.startDate ?? "",
    },
  })

  const diagnosisId = watch("diagnosisId")
  const healthCenterId = watch("healthCenterId")
  const canPickDiagnosis = diagnoses.length > 0 || hasDraftDiagnosis

  function diagnosisLabel(id: string) {
    if (id === DRAFT_DIAGNOSIS_ID) return "El diagnóstico que estoy guardando en este seguimiento"
    return diagnoses.find((d) => d.id === id)?.diagnosis
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

    onSave({
      diagnosisId: values.diagnosisId,
      treatmentType: values.treatmentType.trim(),
      treatmentFrequency: values.treatmentFrequency || undefined,
      healthCenterId: values.healthCenterId,
      startDate: values.startDate || undefined,
    })
    toast.success("Tratamiento guardado en el borrador")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Diagnóstico asociado</Label>
          <Select value={diagnosisId} onValueChange={(v) => setValue("diagnosisId", v ?? undefined)}>
            <SelectTrigger>
              {diagnosisId ? diagnosisLabel(diagnosisId) : <SelectValue placeholder="Seleccionar diagnóstico" />}
            </SelectTrigger>
            <SelectContent>
              {hasDraftDiagnosis && (
                <SelectItem value={DRAFT_DIAGNOSIS_ID}>El diagnóstico que estoy guardando en este seguimiento</SelectItem>
              )}
              {diagnoses.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.diagnosis}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!canPickDiagnosis && (
            <p className="text-muted-foreground text-xs">Primero registrá un diagnóstico.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Tipo de tratamiento</Label>
          <Input {...register("treatmentType")} placeholder="Ej: Quimioterapia" />
        </div>
        <div className="space-y-2">
          <Label>Frecuencia</Label>
          <Input {...register("treatmentFrequency")} placeholder="Ej: Mensual" />
        </div>
        <div className="space-y-2">
          <Label>Fecha de inicio</Label>
          <Input type="date" {...register("startDate")} />
        </div>
        <div className="space-y-2">
          <Label>Establecimiento</Label>
          <Select value={healthCenterId} onValueChange={(v) => setValue("healthCenterId", v ?? undefined)}>
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
  onSave: (insurance: InsuranceDraft, sisAffiliation: SisAffiliationDraft | undefined) => void
}) {
  const { register, handleSubmit, watch, setValue } = useForm<InsuranceFormValues>({
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
      epsProvider: values.insuranceType === "EPS" ? values.epsProvider : undefined,
      changeReason: values.changeReason || undefined,
      startDate: values.startDate || undefined,
    }

    const sisAffiliation: SisAffiliationDraft | undefined =
      values.insuranceType === "NONE"
        ? { canAffiliate: values.canAffiliate, expectedDate: values.expectedDate || undefined }
        : undefined

    onSave(insurance, sisAffiliation)
    toast.success("Seguro guardado en el borrador")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de seguro</Label>
          <Select value={insuranceType} onValueChange={(v) => setValue("insuranceType", v as InsuranceType)}>
            <SelectTrigger>
              {insuranceType ? insuranceOptions[insuranceType] : <SelectValue placeholder="Seleccionar" />}
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
            <Select value={epsProvider} onValueChange={(v) => setValue("epsProvider", v as EpsProvider)}>
              <SelectTrigger>
                {epsProvider ? epsOptions[epsProvider] : <SelectValue placeholder="Seleccionar" />}
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
  const { register, handleSubmit, watch, setValue } = useForm<SocialFormValues>({
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
  })

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
            onValueChange={(v) => setValue("emergencyContactGender", v ?? undefined)}
          >
            <SelectTrigger>
              {emergencyContactGender ? (
                (genderOptions[emergencyContactGender] ?? emergencyContactGender)
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
          <Input {...register("programDropoutReason")} placeholder="Motivo..." />
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
