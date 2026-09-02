import { useEffect, useState, type ReactNode } from "react"
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
  PatientDiagnosis,
  PatientDetailsInput,
  PatientDetailsResponse,
  PatientHealthBackgroundAssessment,
  PatientInsurance,
  PatientSocialNote,
  PatientSisAffiliation,
  PatientTreatment,
  TransitionPatientDiagnosticStatusDto,
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
  Building2,
  FileUp,
  HeartPulse,
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
  ChevronRight,
} from "lucide-react"
import { patientDocumentsApi } from "@/api/patient-documents"
import { CreateHealthCenterDialog } from "@/pages/hospitales/_components/create-health-center-dialog"
import { PatientDocumentUploadDialog } from "../../_components/patient-document-upload-dialog"
import { usePatient } from "../../_hooks/use-patient"
import {
  accessBarrierLabels,
  cancerStageLabels as cancerStageOptions,
  diagnosticStatusLabels,
  educationLabels as educationOptions,
  epsLabels as epsOptions,
  insuranceLabels as insuranceOptions,
  interruptionReasonLabels,
  labelMapToSelectItems,
  normalizeZoneType,
  programDropoutReasonCodeLabels,
  shelterSepaProviderLabels,
  transportationSepaProviderLabels,
  type CancerStage,
  type EducationLevel,
  type EpsProvider,
  type InsuranceType,
} from "../../_lib/clinical-labels"
import {
  draftDiagnosisOptionId,
  type ClinicalDrafts,
  type DiagnosisDecisionMode,
  type DiagnosisDraft,
  type HealthBackgroundAssessmentDraft,
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

// ── Tri-state Sí/No/sin dato select ──

const TRI_UNSET = "SIN_DATO"

const TRI_OPTIONS = [
  { value: TRI_UNSET, label: "Sin dato" },
  { value: "SI", label: "Sí" },
  { value: "NO", label: "No" },
] as const

const TREATMENT_SITUATIONS = [
  { value: "EN_CURSO", label: "En proceso" },
  { value: "PENDIENTE_DE_INICIO", label: "En espera" },
  { value: "INTERRUMPIDO", label: "Suspendido" },
  { value: "FINALIZADO", label: "Culminado" },
  { value: "SEARCHING", label: "En búsqueda" },
  { value: "ABANDONED", label: "Abandonado" },
  {
    value: "DECEASED_DURING_TREATMENT",
    label: "Culminado en situación de tratamiento",
  },
  { value: "NOT_APPLICABLE", label: "N/A" },
  { value: "REMISSION", label: "En remisión" },
] as const

type TreatmentSituation = NonNullable<
  CreatePatientTreatmentInput["treatmentSituation"]
>
type CareProgram = NonNullable<CreatePatientTreatmentInput["careProgram"]>
type InterruptionReason = NonNullable<
  CreatePatientTreatmentInput["interruptionReason"]
>
type AccessBarrierCode = NonNullable<
  CreatePatientTreatmentInput["accessBarrierCode"]
>
type TransportationSepaProvider = NonNullable<
  PatientDetailsInput["transportationSepaProvider"]
>
type ShelterSepaProvider = NonNullable<
  PatientDetailsInput["shelterSepaProvider"]
>
type ProgramDropoutReasonCode = NonNullable<
  PatientDetailsInput["programDropoutReasonCode"]
>
type DiagnosticStatus = NonNullable<
  TransitionPatientDiagnosticStatusDto["status"]
>

const INTERRUPTION_REASON_ITEMS = labelMapToSelectItems(interruptionReasonLabels)
const ACCESS_BARRIER_ITEMS = labelMapToSelectItems(accessBarrierLabels)
const TRANSPORTATION_SEPA_PROVIDER_ITEMS = labelMapToSelectItems(
  transportationSepaProviderLabels,
)
const SHELTER_SEPA_PROVIDER_ITEMS = labelMapToSelectItems(
  shelterSepaProviderLabels,
)
const PROGRAM_DROPOUT_REASON_CODE_ITEMS = labelMapToSelectItems(
  programDropoutReasonCodeLabels,
)
const DIAGNOSTIC_STATUS_ITEMS = labelMapToSelectItems(diagnosticStatusLabels)

const CARE_PROGRAMS = [
  { value: "COPHOES", label: "COPHOES" },
  { value: "PADOMI", label: "PADOMI" },
] as const

const HEALTH_BACKGROUND_CAUSES = [
  { value: "DIAGNOSIS", label: "Diagnóstico" },
  { value: "TREATMENT", label: "Tratamiento" },
  { value: "NATURAL_CONDITION", label: "Condición natural" },
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
          <SelectValue />
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
  /** Required in operational mode; optional placeholder in historical create before save. */
  followUpId?: string
  drafts: ClinicalDrafts
  onDraftsChange: (updater: (prev: ClinicalDrafts) => ClinicalDrafts) => void
  onViewDiagnosis?: (diagnosis: PatientDiagnosis) => void
  onViewTreatment?: (treatment: PatientTreatment) => void
  /**
   * Historical mode keeps contact as a draft (interlocutorId) instead of
   * PATCHing the follow-up immediately.
   */
  variant?: "operational" | "historical"
}

export function ClinicalDataTabs({
  patientId,
  followUpId = "",
  drafts,
  onDraftsChange,
  onViewDiagnosis,
  onViewTreatment,
  variant = "operational",
}: ClinicalDataTabsProps) {
  const isHistorical = variant === "historical"
  const [activeTab, setActiveTab] = useState("datos")
  const [newHospitalOpen, setNewHospitalOpen] = useState(false)
  const { data: patient } = usePatient(patientId)
  const { data: hospitals = [] } = useQuery({
    queryKey: ["healthCenters"],
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
      if (isHistorical) {
        if (values.kind === "NEW_CAREGIVER") {
          const created = await patientsApi.createCompanion(patientId, {
            fullName: values.fullName.trim(),
            primaryPhone: values.primaryPhone.trim(),
            secondaryPhone: values.secondaryPhone.trim() || undefined,
            gender: values.gender || undefined,
            relationship: values.relationship || undefined,
            isCaregiver: true,
          })
          onDraftsChange((prev) => ({
            ...prev,
            contact: {
              interlocutorId: created.id,
              kind: "COMPANION",
              note: "Nuevo cuidador creado en carga histórica",
            },
          }))
          return
        }
        if (values.kind === "PATIENT") {
          await patientsApi.update(patientId, {
            primaryPhone: values.primaryPhone.trim(),
            secondaryPhone: values.secondaryPhone.trim() || undefined,
          })
          onDraftsChange((prev) => ({
            ...prev,
            contact: { interlocutorId: patientId, kind: "PATIENT" },
          }))
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
        onDraftsChange((prev) => ({
          ...prev,
          contact: {
            interlocutorId: values.companionId,
            kind: "COMPANION",
          },
        }))
        return
      }

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
      toast.success(
        isHistorical
          ? "Contacto guardado en el borrador del seguimiento"
          : "Información de contacto actualizada",
      )
    },
    onError: (error: Error) =>
      toast.error("No se pudo actualizar la información de contacto", {
        description: error.message,
      }),
  })

  const diagnoses = patient?.diagnoses ?? []
  const currentDiagnoses = diagnoses.filter((diagnosis) => diagnosis.isCurrent)
  const isSignsAndSymptoms =
    patient?.details?.healthPhase === "SIGNS_AND_SYMPTOMS"

  return (
    <>
    {isSignsAndSymptoms && !isHistorical ? (
      <DiagnosticStatusCard patientId={patientId} followUpId={followUpId} />
    ) : null}
    <Tabs
      orientation="vertical"
      value={activeTab}
      onValueChange={(value) => setActiveTab(String(value))}
      className="flex-col items-stretch gap-3 lg:flex-row"
    >
      <TabsList className="border-border/60 bg-muted/40 h-fit w-full shrink-0 justify-start gap-1 overflow-x-auto rounded-xl border p-1 lg:w-56 lg:flex-col lg:overflow-visible">
        <TabsTrigger
          value="datos"
          className="h-auto min-h-10 flex-none justify-start gap-2 text-left whitespace-normal"
        >
          <UserRound className="size-4 text-sky-600" />
          <span className="min-w-0 break-words">Datos clínicos</span>
          {drafts.details && <DraftDot />}
        </TabsTrigger>
        <TabsTrigger
          value="sintomas"
          className="h-auto min-h-10 flex-none justify-start gap-2 text-left whitespace-normal"
        >
          <Activity className="size-4 text-rose-600" />
          <span className="min-w-0 break-words">Síntomas</span>
          {drafts.symptomReport && <DraftDot />}
        </TabsTrigger>
        <TabsTrigger
          value="direcciones"
          className="h-auto min-h-10 flex-none justify-start gap-2 text-left whitespace-normal"
        >
          <MapPin className="size-4 text-emerald-600" />
          <span className="min-w-0 break-words">Direcciones</span>
          {drafts.address && <DraftDot />}
        </TabsTrigger>
        <TabsTrigger
          value="contacto"
          className="h-auto min-h-10 flex-none justify-start gap-2 text-left whitespace-normal"
        >
          <Phone className="size-4 text-cyan-600" />
          <span className="min-w-0 break-words">Contacto</span>
        </TabsTrigger>
        <TabsTrigger
          value="diagnostico"
          className="h-auto min-h-10 flex-none justify-start gap-2 text-left whitespace-normal"
        >
          <Stethoscope className="size-4 text-violet-600" />
          <span className="min-w-0 break-words">Diagnóstico</span>
          {drafts.diagnoses?.length ? <DraftDot /> : null}
        </TabsTrigger>
        <TabsTrigger
          value="antecedentes"
          className="h-auto min-h-10 flex-none justify-start gap-2 text-left whitespace-normal"
        >
          <HeartPulse className="size-4 text-pink-600" />
          <span className="min-w-0 break-words">
            Antecedentes y comorbilidades
          </span>
          {drafts.healthBackground && <DraftDot />}
        </TabsTrigger>
        <TabsTrigger
          value="tratamiento"
          className="h-auto min-h-10 flex-none justify-start gap-2 text-left whitespace-normal"
        >
          <Pill className="size-4 text-amber-600" />
          <span className="min-w-0 break-words">Tratamientos</span>
          {drafts.treatments?.length ? <DraftDot /> : null}
        </TabsTrigger>
        <TabsTrigger
          value="seguro"
          className="h-auto min-h-10 flex-none justify-start gap-2 text-left whitespace-normal"
        >
          <ShieldCheck className="size-4 text-teal-600" />
          <span className="min-w-0 break-words">INFORMACIÓN DE SEGURO</span>
          {drafts.insurance && <DraftDot />}
        </TabsTrigger>
        <TabsTrigger
          value="social"
          className="h-auto min-h-10 flex-none justify-start gap-2 text-left whitespace-normal"
        >
          <Users className="size-4 text-orange-600" />
          <span className="min-w-0 break-words">Seguimiento social</span>
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
          onOpenNewHospital={() => setNewHospitalOpen(true)}
          onSave={(symptomReport) =>
            onDraftsChange((prev) => ({ ...prev, symptomReport }))
          }
        />
      </TabsContent>
      <TabsContent
        value="antecedentes"
        keepMounted
        className="min-w-0 flex-1 pr-1"
      >
        <AntecedentesForm
          draft={drafts.healthBackground}
          latestAssessment={patient?.healthBackgroundAssessments?.reduce(
            (latest, assessment) =>
              !latest || assessment.createdAt > latest.createdAt
                ? assessment
                : latest,
            undefined as PatientHealthBackgroundAssessment | undefined,
          )}
          onSave={(healthBackground) =>
            onDraftsChange((prev) => ({ ...prev, healthBackground }))
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
          <div className="space-y-3">
            {isHistorical && drafts.contact ? (
              <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
                Interlocutor en borrador:{" "}
                <span className="text-foreground font-medium">
                  {drafts.contact.kind === "PATIENT"
                    ? "Paciente"
                    : "Acompañante"}
                </span>
              </p>
            ) : null}
            <FollowUpContactForm
              key={companions.map((link) => link.id).join(",")}
              patient={patient}
              companions={companions}
              isPending={contactMutation.isPending}
              onSubmit={async (values) => contactMutation.mutateAsync(values)}
            />
          </div>
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
          draft={drafts.diagnoses}
          hospitals={hospitals}
          currentDiagnoses={currentDiagnoses}
          onOpenNewHospital={() => setNewHospitalOpen(true)}
          onViewDiagnosis={onViewDiagnosis}
          onSave={(diagnoses) =>
            onDraftsChange((prev) => ({ ...prev, diagnoses }))
          }
        />
      </TabsContent>
      <TabsContent
        value="tratamiento"
        keepMounted
        className="min-w-0 flex-1 pr-1"
      >
        <TratamientosForm
          patientId={patientId}
          draft={drafts.treatments}
          hospitals={hospitals}
          diagnoses={diagnoses}
          treatments={patient?.treatments ?? []}
          diagnosisDrafts={drafts.diagnoses}
          onOpenNewHospital={() => setNewHospitalOpen(true)}
          onViewTreatment={onViewTreatment}
          onSave={(treatments) =>
            onDraftsChange((prev) => ({ ...prev, treatments }))
          }
        />
      </TabsContent>
      <TabsContent value="seguro" keepMounted className="min-w-0 flex-1 pr-1">
        <SeguroForm
          insuranceDraft={drafts.insurance}
          sisDraft={drafts.sisAffiliation}
          currentInsurance={patient?.insurance.find((item) => item.isCurrent)}
          currentSisAffiliation={patient?.sisAffiliations[0]}
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
    <CreateHealthCenterDialog
      open={newHospitalOpen}
      onOpenChange={setNewHospitalOpen}
    />
    </>
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

type HealthBackgroundFormValues = {
  hasPsychiatry: boolean | undefined
  activeComorbidities: Array<{
    conditionName: string
    treatmentDescription: string
    followUpSpecialty: string
  }>
  limitations: Array<{
    description: string
    cause: NonNullable<
      NonNullable<
        HealthBackgroundAssessmentDraft["limitations"]
      >[number]["cause"]
    >
  }>
  familyCancerHistory: Array<{
    relationship: string
    cancerType: string
  }>
}

function AntecedentesForm({
  draft,
  latestAssessment,
  onSave,
}: {
  draft: HealthBackgroundAssessmentDraft | undefined
  latestAssessment: PatientHealthBackgroundAssessment | undefined
  onSave: (healthBackground: HealthBackgroundAssessmentDraft) => void
}) {
  const { control, handleSubmit, register, reset, setValue } =
    useForm<HealthBackgroundFormValues>({
      defaultValues: {
        hasPsychiatry: draft?.hasPsychiatry,
        activeComorbidities: (draft?.activeComorbidities ?? []).map((item) => ({
          conditionName: item.conditionName,
          treatmentDescription: item.treatmentDescription ?? "",
          followUpSpecialty: item.followUpSpecialty ?? "",
        })),
        limitations: (draft?.limitations ?? []).map((item) => ({
          description: item.description,
          cause: item.cause,
        })),
        familyCancerHistory: (draft?.familyCancerHistory ?? []).map((item) => ({
          relationship: item.relationship,
          cancerType: item.cancerType ?? "",
        })),
      },
    })
  const {
    fields: comorbidityFields,
    append: appendComorbidity,
    remove: removeComorbidity,
  } = useFieldArray({ control, name: "activeComorbidities" })
  const {
    fields: limitationFields,
    append: appendLimitation,
    remove: removeLimitation,
  } = useFieldArray({ control, name: "limitations" })
  const {
    fields: familyHistoryFields,
    append: appendFamilyHistory,
    remove: removeFamilyHistory,
  } = useFieldArray({ control, name: "familyCancerHistory" })
  const psychiatry = useWatch({ control, name: "hasPsychiatry" })
  const limitations = useWatch({ control, name: "limitations" }) ?? []

  useEffect(() => {
    reset({
      hasPsychiatry: draft?.hasPsychiatry,
      activeComorbidities: (draft?.activeComorbidities ?? []).map((item) => ({
        conditionName: item.conditionName,
        treatmentDescription: item.treatmentDescription ?? "",
        followUpSpecialty: item.followUpSpecialty ?? "",
      })),
      limitations: (draft?.limitations ?? []).map((item) => ({
        description: item.description,
        cause: item.cause,
      })),
      familyCancerHistory: (draft?.familyCancerHistory ?? []).map((item) => ({
        relationship: item.relationship,
        cancerType: item.cancerType ?? "",
      })),
    })
  }, [draft, reset])

  function onSubmit(values: HealthBackgroundFormValues) {
    const activeComorbidities = values.activeComorbidities.map(
      (item, index) => {
        const conditionName = item.conditionName.trim()
        if (!conditionName) {
          throw new Error(
            `Completa la condición de la comorbilidad ${index + 1}`,
          )
        }
        return {
          conditionName,
          treatmentDescription: item.treatmentDescription.trim() || undefined,
          followUpSpecialty: item.followUpSpecialty.trim() || undefined,
        }
      },
    )
    const limitations = values.limitations.map((item, index) => {
      const description = item.description.trim()
      if (!description) {
        throw new Error(`Completa la descripción de la limitación ${index + 1}`)
      }
      return { description, cause: item.cause }
    })
    const familyCancerHistory = values.familyCancerHistory.map(
      (item, index) => {
        const relationship = item.relationship.trim()
        if (!relationship) {
          throw new Error(
            `Completa el parentesco del antecedente familiar ${index + 1}`,
          )
        }
        return {
          relationship,
          cancerType: item.cancerType.trim() || undefined,
        }
      },
    )

    onSave({
      hasPsychiatry: values.hasPsychiatry,
      ...(activeComorbidities.length ? { activeComorbidities } : {}),
      ...(limitations.length ? { limitations } : {}),
      ...(familyCancerHistory.length ? { familyCancerHistory } : {}),
    })
    toast.success("Antecedentes guardados en el borrador")
  }

  return (
    <form
      onSubmit={handleSubmit((values) => {
        try {
          onSubmit(values)
        } catch (error) {
          toast.error((error as Error).message)
        }
      })}
      className="space-y-5"
    >
      {latestAssessment && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="font-medium">Último registro guardado</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {new Date(latestAssessment.createdAt).toLocaleDateString("es-PE")}
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Psiquiatría:</span>{" "}
              {latestAssessment.hasPsychiatry === null
                ? "Sin dato"
                : latestAssessment.hasPsychiatry
                  ? "Sí"
                  : "No"}
            </p>
            <p>
              <span className="text-muted-foreground">
                Comorbilidades activas:
              </span>{" "}
              {latestAssessment.activeComorbidities.length || 0}
            </p>
            <p>
              <span className="text-muted-foreground">Limitaciones:</span>{" "}
              {latestAssessment.limitations.length || 0}
            </p>
            <p>
              <span className="text-muted-foreground">
                Antecedentes familiares:
              </span>{" "}
              {latestAssessment.familyCancerHistory.length || 0}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TriSelect
          label="¿Tiene antecedentes de psiquiatría?"
          value={psychiatry}
          onChange={(value) => setValue("hasPsychiatry", value)}
        />
      </div>

      <RepeatableSection
        title="Comorbilidades activas"
        description="Condición requerida; tratamiento y especialidad son opcionales."
        addLabel="Agregar comorbilidad"
        onAdd={() =>
          appendComorbidity({
            conditionName: "",
            treatmentDescription: "",
            followUpSpecialty: "",
          })
        }
      >
        {comorbidityFields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Comorbilidad {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Quitar comorbilidad ${index + 1}`}
                onClick={() => removeComorbidity(index)}
              >
                <Minus className="size-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`follow-up-comorbidity-${field.id}`}>
                  Condición <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`follow-up-comorbidity-${field.id}`}
                  {...register(`activeComorbidities.${index}.conditionName`)}
                  placeholder="Ej: Hipertensión"
                />
              </div>
              <div className="space-y-2">
                <Label>Tratamiento</Label>
                <Input
                  {...register(
                    `activeComorbidities.${index}.treatmentDescription`,
                  )}
                  placeholder="Tratamiento actual"
                />
              </div>
              <div className="space-y-2">
                <Label>Especialidad de seguimiento</Label>
                <Input
                  {...register(
                    `activeComorbidities.${index}.followUpSpecialty`,
                  )}
                  placeholder="Ej: Cardiología"
                />
              </div>
            </div>
          </div>
        ))}
      </RepeatableSection>

      <RepeatableSection
        title="Limitaciones"
        description="La descripción es requerida y la causa se registra con una etiqueta en español."
        addLabel="Agregar limitación"
        onAdd={() => appendLimitation({ description: "", cause: "DIAGNOSIS" })}
      >
        {limitationFields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_14rem_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor={`follow-up-limitation-${field.id}`}>
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`follow-up-limitation-${field.id}`}
                {...register(`limitations.${index}.description`)}
                placeholder="Describe la limitación"
                className="min-h-16"
              />
            </div>
            <div className="space-y-2">
              <Label>Causa</Label>
              <Select
                items={HEALTH_BACKGROUND_CAUSES}
                value={limitations[index]?.cause ?? "DIAGNOSIS"}
                onValueChange={(value) =>
                  setValue(
                    `limitations.${index}.cause`,
                    value as HealthBackgroundFormValues["limitations"][number]["cause"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_BACKGROUND_CAUSES.map((cause) => (
                    <SelectItem key={cause.value} value={cause.value}>
                      {cause.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="self-end"
              aria-label={`Quitar limitación ${index + 1}`}
              onClick={() => removeLimitation(index)}
            >
              <Minus className="size-3.5" />
            </Button>
          </div>
        ))}
      </RepeatableSection>

      <RepeatableSection
        title="Antecedentes familiares de cáncer"
        description="El parentesco es requerido; el tipo de cáncer es opcional."
        addLabel="Agregar antecedente familiar"
        onAdd={() => appendFamilyHistory({ relationship: "", cancerType: "" })}
      >
        {familyHistoryFields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor={`follow-up-family-history-${field.id}`}>
                Parentesco <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`follow-up-family-history-${field.id}`}
                {...register(`familyCancerHistory.${index}.relationship`)}
                placeholder="Ej: Madre"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de cáncer</Label>
              <Input
                {...register(`familyCancerHistory.${index}.cancerType`)}
                placeholder="Ej: Cáncer de mama"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="self-end"
              aria-label={`Quitar antecedente familiar ${index + 1}`}
              onClick={() => removeFamilyHistory(index)}
            >
              <Minus className="size-3.5" />
            </Button>
          </div>
        ))}
      </RepeatableSection>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm">
          Guardar antecedentes
        </Button>
        <DraftBadge saved={Boolean(draft)} />
      </div>
    </form>
  )
}

function RepeatableSection({
  title,
  description,
  addLabel,
  onAdd,
  children,
}: {
  title: string
  description: string
  addLabel: string
  onAdd: () => void
  children: ReactNode
}) {
  return (
    <section className="space-y-3 border-t pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={onAdd}
        >
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
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

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

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
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddressFormValues>({
      defaultValues: {
        type: draft?.type ?? "PERMANENT",
        isPrimary:
          draft?.type === "TEMPORARY" ? false : (draft?.isPrimary ?? true),
        address: draft?.address ?? "",
        district: draft?.district ?? "",
        province: draft?.province ?? "",
        department: draft?.department,
        reference: draft?.reference ?? "",
        locationUrl: draft?.locationUrl ?? "",
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
      locationUrl: values.locationUrl?.trim() || undefined,
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
                {address.locationUrl && isHttpUrl(address.locationUrl) && (
                  <a
                    href={address.locationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-xs underline underline-offset-4"
                  >
                    Abrir ubicación
                  </a>
                )}
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
          <div className="space-y-2 md:col-span-2">
            <Label>Ubicación web de la residencia</Label>
            <Input
              type="url"
              {...register("locationUrl", {
                validate: (value) =>
                  !value ||
                  isHttpUrl(value.trim()) ||
                  "Usa una URL http o https",
              })}
              placeholder="https://maps.google.com/..."
            />
            {errors.locationUrl?.message && (
              <p className="text-destructive text-xs">
                {errors.locationUrl.message}
              </p>
            )}
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
  onOpenNewHospital,
  onSave,
}: {
  draft: SymptomReportDraft | undefined
  hospitals: Array<{ id: string; name: string }>
  onOpenNewHospital: () => void
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
        <div className="space-y-2 md:col-span-2">
          <Label>Establecimiento de la consulta</Label>
          <div className="flex gap-2">
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
              <SelectTrigger className="flex-1">
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1"
              onClick={onOpenNewHospital}
            >
              <Building2 className="size-3.5" />
              <Plus className="size-3" />
            </Button>
          </div>
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
  diagnosisSpecialty: string
  isSepaActiveReferral: boolean | undefined
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
  currentDiagnoses,
  onOpenNewHospital,
  onViewDiagnosis,
  onSave,
}: {
  draft: DiagnosisDraft[] | undefined
  hospitals: Array<{ id: string; name: string }>
  currentDiagnoses: PatientDiagnosis[]
  onOpenNewHospital: () => void
  onViewDiagnosis?: (diagnosis: PatientDiagnosis) => void
  onSave: (diagnoses: DiagnosisDraft[]) => void
}) {
  const initial = draft?.[0]
  const { register, handleSubmit, watch, setValue } =
    useForm<DiagnosisFormValues>({
      defaultValues: {
        diagnosis: initial?.diagnosis ?? "",
        diagnosisSpecialty: initial?.diagnosisSpecialty ?? "",
        isSepaActiveReferral: initial?.isSepaActiveReferral,
        cancerStage: initial?.cancerStage ?? "UNKNOWN",
        diagnosisDate: initial?.diagnosisDate ?? "",
        firstSymptomsDate: initial?.firstSymptomsDate ?? "",
        healthCenterId: initial?.healthCenterId,
        symptomLeadingToCheckup: initial?.symptomLeadingToCheckup ?? "",
        waitTimeForDiagnosis: initial?.waitTimeForDiagnosis,
        waitTimeForDiagnosisManuallyEdited:
          initial?.waitTimeForDiagnosisManuallyEdited ?? false,
        hasMedicalReport: initial?.hasMedicalReport ?? false,
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
  const [mode, setMode] = useState<DiagnosisDecisionMode>(
    initial?.mode ?? "PARALLEL",
  )
  const [replacementDiagnosisId, setReplacementDiagnosisId] = useState(
    initial?.replacementDiagnosisId ?? "",
  )
  const [decisions, setDecisions] = useState<DiagnosisDraft[]>(draft ?? [])
  const [editingDecisionIndex, setEditingDecisionIndex] = useState<
    number | null
  >(null)
  const decisionModeItems = [
    { value: "PARALLEL", label: "Agregar diagnóstico activo" },
    { value: "REPLACE", label: "Reemplazar diagnóstico existente" },
  ] as const

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
    if (mode === "REPLACE" && !replacementDiagnosisId) {
      toast.error("Seleccioná el diagnóstico que deseas reemplazar")
      return
    }
    if (
      mode === "REPLACE" &&
      decisions.some(
        (decision, index) =>
          index !== editingDecisionIndex &&
          decision.replacementDiagnosisId === replacementDiagnosisId,
      )
    ) {
      toast.error("Ya agregaste un reemplazo para ese diagnóstico")
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

    const nextDecision: DiagnosisDraft = {
      draftId:
        editingDecisionIndex !== null
          ? (decisions[editingDecisionIndex]?.draftId ?? createDraftId())
          : createDraftId(),
      mode,
      diagnosis: values.diagnosis.trim(),
      diagnosisSpecialty: values.diagnosisSpecialty.trim() || undefined,
      isSepaActiveReferral: values.isSepaActiveReferral,
      cancerStage: values.cancerStage,
      diagnosisDate: values.diagnosisDate || undefined,
      firstSymptomsDate: values.firstSymptomsDate || undefined,
      healthCenterId: values.healthCenterId,
      symptomLeadingToCheckup: values.symptomLeadingToCheckup || undefined,
      waitTimeForDiagnosis: normalizedWaitTime,
      waitTimeForDiagnosisManuallyEdited:
        values.waitTimeForDiagnosisManuallyEdited,
      hasMedicalReport: values.hasMedicalReport,
      ...(mode === "REPLACE" ? { replacementDiagnosisId } : {}),
    }
    const nextDecisions = [...decisions]
    if (editingDecisionIndex === null) nextDecisions.push(nextDecision)
    else nextDecisions[editingDecisionIndex] = nextDecision
    setDecisions(nextDecisions)
    onSave(nextDecisions)
    resetDiagnosisForm()
    toast.success("Diagnóstico guardado en el borrador")
  }

  function resetDiagnosisForm() {
    setValue("diagnosis", "")
    setValue("diagnosisSpecialty", "")
    setValue("isSepaActiveReferral", undefined)
    setValue("cancerStage", "UNKNOWN")
    setValue("diagnosisDate", "")
    setValue("firstSymptomsDate", "")
    setValue("healthCenterId", undefined)
    setValue("symptomLeadingToCheckup", "")
    setValue("waitTimeForDiagnosis", undefined)
    setValue("waitTimeForDiagnosisManuallyEdited", false)
    setValue("hasMedicalReport", false)
    setMode("PARALLEL")
    setReplacementDiagnosisId("")
    setEditingDecisionIndex(null)
  }

  function editDecision(index: number) {
    const decision = decisions[index]
    if (!decision) return
    setEditingDecisionIndex(index)
    setMode(decision.mode)
    setReplacementDiagnosisId(decision.replacementDiagnosisId ?? "")
    setValue("diagnosis", decision.diagnosis)
    setValue("diagnosisSpecialty", decision.diagnosisSpecialty ?? "")
    setValue("isSepaActiveReferral", decision.isSepaActiveReferral)
    setValue("cancerStage", decision.cancerStage ?? "UNKNOWN")
    setValue("diagnosisDate", decision.diagnosisDate ?? "")
    setValue("firstSymptomsDate", decision.firstSymptomsDate ?? "")
    setValue("healthCenterId", decision.healthCenterId)
    setValue("symptomLeadingToCheckup", decision.symptomLeadingToCheckup ?? "")
    setValue("waitTimeForDiagnosis", decision.waitTimeForDiagnosis)
    setValue(
      "waitTimeForDiagnosisManuallyEdited",
      decision.waitTimeForDiagnosisManuallyEdited ?? false,
    )
    setValue("hasMedicalReport", decision.hasMedicalReport ?? false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-sm text-blue-900">
        <div>
          <p className="font-semibold">
            Diagnósticos activos ({currentDiagnoses.length})
          </p>
          <p className="mt-1 text-xs leading-relaxed text-blue-800">
            Un paciente puede tener varios diagnósticos de cáncer activos al
            mismo tiempo. Seleccioná uno para consultar todos sus datos.
          </p>
        </div>
        {currentDiagnoses.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {currentDiagnoses.map((diagnosis) => (
              <button
                key={diagnosis.id}
                type="button"
                className="bg-background/80 hover:bg-background flex items-center gap-2 rounded-md border border-blue-200 p-2.5 text-left transition-colors"
                onClick={() => onViewDiagnosis?.(diagnosis)}
                disabled={!onViewDiagnosis}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">
                    {diagnosis.diagnosis}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-[11px]">
                    {diagnosis.cancerStage
                      ? cancerStageOptions[diagnosis.cancerStage]
                      : "Etapa sin dato"}
                  </span>
                </span>
                <ChevronRight className="size-3.5 shrink-0 text-blue-700" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-blue-800">
            Aún no hay diagnósticos activos.
          </p>
        )}
      </div>
      {decisions.length > 0 && (
        <div className="space-y-2 rounded-lg border border-violet-200 bg-violet-50/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Cambios pendientes</p>
            <span className="text-muted-foreground text-xs">
              {decisions.length}
            </span>
          </div>
          {decisions.map((decision, index) => {
            const replacement = currentDiagnoses.find(
              (item) => item.id === decision.replacementDiagnosisId,
            )
            return (
              <div
                key={decision.draftId}
                className="bg-card flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <b className="block truncate">{decision.diagnosis}</b>
                  <span className="text-muted-foreground text-xs">
                    {decision.mode === "REPLACE"
                      ? `Reemplaza ${replacement?.diagnosis ?? "un diagnóstico"}`
                      : "Nuevo diagnóstico activo"}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => editDecision(index)}
                    aria-label="Editar diagnóstico"
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
                    aria-label="Quitar diagnóstico"
                  >
                    <Minus className="size-3.5" />
                  </Button>
                </span>
              </div>
            )
          })}
        </div>
      )}
      <div className="bg-muted/20 space-y-3 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">
            {editingDecisionIndex === null
              ? "Nueva decisión de diagnóstico"
              : "Editar decisión de diagnóstico"}
          </p>
          <p className="text-muted-foreground text-xs">
            Elegí si el diagnóstico se agrega o reemplaza uno activo.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Tipo de decisión</Label>
          <Select
            items={decisionModeItems}
            value={mode}
            onValueChange={(value) => {
              const nextMode = (value || "PARALLEL") as DiagnosisDecisionMode
              setMode(nextMode)
              if (nextMode === "PARALLEL") setReplacementDiagnosisId("")
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
          <div className="space-y-2">
            <Label>Diagnóstico activo a reemplazar</Label>
            <Select
              items={currentDiagnoses.map((item) => ({
                value: item.id,
                label: `${item.diagnosis} · ${item.cancerStage ? cancerStageOptions[item.cancerStage] : "Etapa sin dato"}`,
              }))}
              value={replacementDiagnosisId}
              onValueChange={(value) => setReplacementDiagnosisId(value ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar diagnóstico actual" />
              </SelectTrigger>
              <SelectContent>
                {currentDiagnoses.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.diagnosis} ·{" "}
                    {item.cancerStage
                      ? cancerStageOptions[item.cancerStage]
                      : "Etapa sin dato"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Diagnóstico</Label>
          <Input {...register("diagnosis")} placeholder="Ej: Cáncer de mama" />
        </div>
        <div className="space-y-2">
          <Label>Especialidad del diagnóstico</Label>
          <Input
            {...register("diagnosisSpecialty")}
            placeholder="Ej: Oncología"
          />
        </div>
        <TriSelect
          label="¿Diagnóstico con derivación activa de SEPA?"
          value={watch("isSepaActiveReferral")}
          onChange={(value) => setValue("isSepaActiveReferral", value)}
        />
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
        <div className="space-y-2 md:col-span-2">
          <Label>Establecimiento de salud</Label>
          <div className="flex gap-2">
            <Select
              items={hospitals.map((hospital) => ({
                value: hospital.id,
                label: hospital.name,
              }))}
              value={healthCenterId}
              onValueChange={(v) => setValue("healthCenterId", v ?? undefined)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1"
              onClick={onOpenNewHospital}
            >
              <Building2 className="size-3.5" />
              <Plus className="size-3" />
            </Button>
          </div>
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
          {editingDecisionIndex === null
            ? "Guardar diagnóstico"
            : "Actualizar diagnóstico"}
        </Button>
        {editingDecisionIndex !== null && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetDiagnosisForm}
          >
            Cancelar edición
          </Button>
        )}
        <DraftBadge saved={Boolean(decisions.length)} />
      </div>
    </form>
  )
}

function createDraftId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

// ── Tratamiento ──

interface TreatmentFormValues {
  diagnosisId: string | undefined
  treatmentType: string
  treatmentFrequency: DurationDraft | undefined
  treatmentSituation: TreatmentSituation | undefined
  isOperation: boolean | undefined
  operationName: string
  careProgram: CareProgram | undefined
  receivesTeleconsultation: boolean | undefined
  teleconsultationNote: string
  teleconsultationSpecialties: string
  treatmentAbandonmentReason: string
  treatmentViaSepa: boolean | undefined
  interruptionReason: InterruptionReason | undefined
  interruptionReasonOther: string
  scheduledSessions: string
  completedSessions: string
  hormonalTreatmentCompleted: boolean | undefined
  accessBarrierCode: AccessBarrierCode | undefined
  accessBarrierOther: string
  orientedRegardingBarriers: boolean | undefined
  isReferred: boolean
  sourceHealthCenterId: string | undefined
  receivingHealthCenterId: string | undefined
  startDate: string
  endDate: string
  notReceivingReason: string
  changeReason: string
  medications: Array<
    Omit<CreateTreatmentMedicationInput, "frequency"> & {
      frequency?: DurationDraft
    }
  >
}

function TratamientosForm({
  patientId,
  draft,
  hospitals,
  diagnoses,
  treatments,
  diagnosisDrafts,
  onOpenNewHospital,
  onViewTreatment,
  onSave,
}: {
  patientId: string
  draft: TreatmentDraft[] | undefined
  hospitals: Array<{ id: string; name: string }>
  diagnoses: PatientDiagnosis[]
  treatments: PatientTreatment[]
  diagnosisDrafts: DiagnosisDraft[] | undefined
  onOpenNewHospital: () => void
  onViewTreatment?: (treatment: PatientTreatment) => void
  onSave: (treatments: TreatmentDraft[]) => void
}) {
  const queryClient = useQueryClient()
  const [prescriptionUploadOpen, setPrescriptionUploadOpen] = useState(false)
  const initial = draft?.[0]
  const { register, handleSubmit, setValue, reset, control } =
    useForm<TreatmentFormValues>({
      defaultValues: {
        diagnosisId: initial?.diagnosisId,
        treatmentType: initial?.treatmentType ?? "",
        treatmentFrequency: initial?.treatmentFrequency,
        treatmentSituation: initial?.treatmentSituation,
        isOperation: initial?.operationName ? true : undefined,
        operationName: initial?.operationName ?? "",
        careProgram: initial?.careProgram,
        receivesTeleconsultation: initial?.receivesTeleconsultation,
        teleconsultationNote: initial?.teleconsultationNote ?? "",
        teleconsultationSpecialties:
          initial?.teleconsultationSpecialties?.join(", ") ?? "",
        treatmentAbandonmentReason: initial?.treatmentAbandonmentReason ?? "",
        treatmentViaSepa: initial?.treatmentViaSepa,
        interruptionReason: initial?.interruptionReason,
        interruptionReasonOther: initial?.interruptionReasonOther ?? "",
        scheduledSessions:
          initial?.scheduledSessions != null
            ? String(initial.scheduledSessions)
            : "",
        completedSessions:
          initial?.completedSessions != null
            ? String(initial.completedSessions)
            : "",
        hormonalTreatmentCompleted: initial?.hormonalTreatmentCompleted,
        accessBarrierCode: initial?.accessBarrierCode,
        accessBarrierOther: initial?.accessBarrierOther ?? "",
        orientedRegardingBarriers: initial?.orientedRegardingBarriers,
        isReferred: initial?.isReferred ?? false,
        sourceHealthCenterId: initial?.sourceHealthCenterId ?? undefined,
        receivingHealthCenterId: initial?.receivingHealthCenterId ?? undefined,
        startDate: initial?.startDate ?? "",
        endDate: initial?.endDate ?? "",
        notReceivingReason: initial?.notReceivingReason ?? "",
        changeReason: initial?.changeReason ?? "",
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
  const isOperation = watched.isOperation
  const receivesTeleconsultation = watched.receivesTeleconsultation
  const treatmentViaSepa = watched.treatmentViaSepa
  const interruptionReason = watched.interruptionReason
  const accessBarrierCode = watched.accessBarrierCode
  const hormonalTreatmentCompleted = watched.hormonalTreatmentCompleted
  const orientedRegardingBarriers = watched.orientedRegardingBarriers
  const startDate = watched.startDate ?? ""
  const medications = watched.medications ?? []
  const canPickDiagnosis =
    diagnoses.length > 0 || Boolean(diagnosisDrafts?.length)
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
  const canAttachPrescription =
    mode === "REPLACE" && Boolean(selectedTreatment?.id)
  const uploadPrescriptionMutation = useMutation({
    mutationFn: (input: Parameters<typeof patientDocumentsApi.create>[1]) =>
      patientDocumentsApi.create(patientId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patient-documents", patientId],
      })
      setPrescriptionUploadOpen(false)
      toast.success("Receta guardada")
    },
    onError: (error: Error) =>
      toast.error("No se pudo guardar la receta", {
        description: error.message,
      }),
  })
  const { data: selectedTreatmentMedications } = useTreatmentMedications(
    selectedTreatment?.patientId ?? "",
    selectedTreatment?.id ?? "",
    mode === "REPLACE" &&
      Boolean(selectedTreatment) &&
      editingDecisionIndex === null,
  )
  const diagnosisItems = [
    ...(diagnosisDrafts ?? []).map((item) => ({
      value: draftDiagnosisOptionId(item.draftId),
      label: `${item.diagnosis} (nuevo)`,
    })),
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
      isOperation: treatment.operationName ? true : undefined,
      operationName: treatment.operationName ?? "",
      careProgram: treatment.careProgram ?? undefined,
      receivesTeleconsultation: treatment.receivesTeleconsultation ?? undefined,
      teleconsultationNote: treatment.teleconsultationNote ?? "",
      teleconsultationSpecialties:
        treatment.teleconsultationSpecialties?.join(", ") ?? "",
      treatmentAbandonmentReason: treatment.treatmentAbandonmentReason ?? "",
      treatmentViaSepa: treatment.treatmentViaSepa ?? undefined,
      interruptionReason: treatment.interruptionReason ?? undefined,
      interruptionReasonOther: treatment.interruptionReasonOther ?? "",
      scheduledSessions:
        treatment.scheduledSessions != null
          ? String(treatment.scheduledSessions)
          : "",
      completedSessions:
        treatment.completedSessions != null
          ? String(treatment.completedSessions)
          : "",
      hormonalTreatmentCompleted:
        treatment.hormonalTreatmentCompleted ?? undefined,
      accessBarrierCode: treatment.accessBarrierCode ?? undefined,
      accessBarrierOther: treatment.accessBarrierOther ?? "",
      orientedRegardingBarriers:
        treatment.orientedRegardingBarriers ?? undefined,
      isReferred: treatment.isReferred,
      sourceHealthCenterId: treatment.sourceHealthCenterId ?? undefined,
      receivingHealthCenterId: treatment.receivingHealthCenterId ?? undefined,
      startDate: treatment.startDate ?? "",
      endDate: treatment.endDate ?? "",
      notReceivingReason: treatment.notReceivingReason ?? "",
      changeReason: "",
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
      isOperation: decision.operationName ? true : undefined,
      operationName: decision.operationName ?? "",
      careProgram: decision.careProgram,
      receivesTeleconsultation: decision.receivesTeleconsultation,
      teleconsultationNote: decision.teleconsultationNote ?? "",
      teleconsultationSpecialties:
        decision.teleconsultationSpecialties?.join(", ") ?? "",
      treatmentAbandonmentReason: decision.treatmentAbandonmentReason ?? "",
      treatmentViaSepa: decision.treatmentViaSepa,
      interruptionReason: decision.interruptionReason,
      interruptionReasonOther: decision.interruptionReasonOther ?? "",
      scheduledSessions:
        decision.scheduledSessions != null
          ? String(decision.scheduledSessions)
          : "",
      completedSessions:
        decision.completedSessions != null
          ? String(decision.completedSessions)
          : "",
      hormonalTreatmentCompleted: decision.hormonalTreatmentCompleted,
      accessBarrierCode: decision.accessBarrierCode,
      accessBarrierOther: decision.accessBarrierOther ?? "",
      orientedRegardingBarriers: decision.orientedRegardingBarriers,
      isReferred: decision.isReferred ?? false,
      sourceHealthCenterId: decision.sourceHealthCenterId,
      receivingHealthCenterId: decision.receivingHealthCenterId,
      startDate: decision.startDate ?? "",
      endDate: decision.endDate ?? "",
      notReceivingReason: decision.notReceivingReason ?? "",
      changeReason: decision.changeReason ?? "",
      medications: decision.medications ?? [],
    })
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
    if (
      values.treatmentSituation === "ABANDONED" &&
      !values.treatmentAbandonmentReason.trim()
    ) {
      toast.error("Indica el motivo de abandono del tratamiento")
      return
    }
    if (values.treatmentSituation === "INTERRUMPIDO" && !values.interruptionReason) {
      toast.error("Indica el motivo de interrupción del tratamiento")
      return
    }
    if (
      values.interruptionReason === "OTHER" &&
      !values.interruptionReasonOther.trim()
    ) {
      toast.error("Especificá el motivo de interrupción")
      return
    }
    if (
      values.accessBarrierCode === "OTHER" &&
      !values.accessBarrierOther.trim()
    ) {
      toast.error("Especificá la barrera de acceso")
      return
    }
    if (values.isOperation && !values.operationName.trim()) {
      toast.error("Ingresa el nombre de la operación")
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

    const parseOptionalSessions = (raw: string, label: string) => {
      const trimmed = raw.trim()
      if (!trimmed) return undefined
      const parsed = Number(trimmed)
      if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
        toast.error(`${label} debe ser un número entero mayor o igual a 0`)
        return null
      }
      return parsed
    }
    const scheduledSessions = parseOptionalSessions(
      values.scheduledSessions,
      "Sesiones programadas",
    )
    if (scheduledSessions === null) return
    const completedSessions = parseOptionalSessions(
      values.completedSessions,
      "Sesiones realizadas",
    )
    if (completedSessions === null) return

    const nextDecision: TreatmentDraft = {
      diagnosisId: values.diagnosisId,
      treatmentType: values.treatmentType.trim(),
      treatmentFrequency: normalizedFrequency,
      treatmentSituation: values.treatmentSituation,
      operationName: values.isOperation
        ? values.operationName.trim() || undefined
        : undefined,
      careProgram: values.careProgram,
      receivesTeleconsultation: values.receivesTeleconsultation,
      ...(values.receivesTeleconsultation === true
        ? {
            teleconsultationNote:
              values.teleconsultationNote.trim() || undefined,
            ...(values.teleconsultationSpecialties
              .split(",")
              .map((specialty) => specialty.trim())
              .filter(Boolean).length
              ? {
                  teleconsultationSpecialties:
                    values.teleconsultationSpecialties
                      .split(",")
                      .map((specialty) => specialty.trim())
                      .filter(Boolean),
                }
              : {}),
          }
        : {}),
      ...(values.treatmentSituation === "ABANDONED"
        ? {
            treatmentAbandonmentReason:
              values.treatmentAbandonmentReason.trim() || undefined,
          }
        : {}),
      treatmentViaSepa: values.treatmentViaSepa,
      ...(values.treatmentSituation === "INTERRUMPIDO"
        ? {
            interruptionReason: values.interruptionReason,
            interruptionReasonOther:
              values.interruptionReason === "OTHER"
                ? values.interruptionReasonOther.trim() || undefined
                : undefined,
          }
        : {}),
      scheduledSessions,
      completedSessions,
      hormonalTreatmentCompleted: values.hormonalTreatmentCompleted,
      accessBarrierCode: values.accessBarrierCode,
      accessBarrierOther:
        values.accessBarrierCode === "OTHER"
          ? values.accessBarrierOther.trim() || undefined
          : undefined,
      orientedRegardingBarriers: values.orientedRegardingBarriers,
      isReferred: values.isReferred,
      sourceHealthCenterId: values.isReferred
        ? values.sourceHealthCenterId
        : undefined,
      receivingHealthCenterId: values.receivingHealthCenterId,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      notReceivingReason: values.notReceivingReason.trim() || undefined,
      changeReason: values.changeReason.trim() || undefined,
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
      isOperation: undefined,
      operationName: "",
      careProgram: undefined,
      receivesTeleconsultation: undefined,
      teleconsultationNote: "",
      teleconsultationSpecialties: "",
      treatmentAbandonmentReason: "",
      treatmentViaSepa: undefined,
      interruptionReason: undefined,
      interruptionReasonOther: "",
      scheduledSessions: "",
      completedSessions: "",
      hormonalTreatmentCompleted: undefined,
      accessBarrierCode: undefined,
      accessBarrierOther: "",
      orientedRegardingBarriers: undefined,
      isReferred: false,
      sourceHealthCenterId: undefined,
      receivingHealthCenterId: undefined,
      startDate: "",
      endDate: "",
      notReceivingReason: "",
      changeReason: "",
      medications: [],
    })
    setMode("PARALLEL")
    setSelectedSeriesId("")
    setEditingDecisionIndex(null)
    toast.success("Tratamiento guardado en el borrador")
  }

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {currentTreatments.length > 0 && (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-amber-950">
          <div>
            <p className="font-semibold">
              Tratamientos activos ({currentTreatments.length})
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Consultá el detalle de cada línea activa antes de registrar una
              actualización o agregar otra en paralelo.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {currentTreatments.map((treatment) => (
              <button
                key={treatment.id}
                type="button"
                className="bg-background/80 hover:bg-background flex items-center gap-2 rounded-md border border-amber-200 p-2.5 text-left transition-colors"
                onClick={() => onViewTreatment?.(treatment)}
                disabled={!onViewTreatment}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">
                    {treatment.treatmentType}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block truncate text-[11px]">
                    {treatment.diagnosisSummary?.diagnosis ??
                      "Sin diagnóstico asociado"}
                  </span>
                </span>
                <ChevronRight className="size-3.5 shrink-0 text-amber-700" />
              </button>
            ))}
          </div>
        </div>
      )}
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
                <SelectValue placeholder="Seleccionar diagnóstico" />
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
          <TriSelect
            label="¿Es una operación?"
            value={isOperation}
            onChange={(value) => {
              setValue("isOperation", value)
              if (!value) setValue("operationName", "")
            }}
          />
          {isOperation && (
            <div className="space-y-2">
              <Label>Nombre de la operación</Label>
              <Input
                {...register("operationName")}
                placeholder="Ej: Mastectomía"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Programa de atención</Label>
            <Select
              items={CARE_PROGRAMS}
              value={watched.careProgram ?? ""}
              onValueChange={(value) =>
                setValue("careProgram", value as CareProgram)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar programa" />
              </SelectTrigger>
              <SelectContent>
                {CARE_PROGRAMS.map((program) => (
                  <SelectItem key={program.value} value={program.value}>
                    {program.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <TriSelect
            label="¿Recibe teleconsulta?"
            value={receivesTeleconsultation}
            onChange={(value) => setValue("receivesTeleconsultation", value)}
          />
          {receivesTeleconsultation === true && (
            <>
              <div className="space-y-2">
                <Label>Nota de teleconsulta</Label>
                <Textarea
                  {...register("teleconsultationNote")}
                  placeholder="Detalle de la teleconsulta"
                />
              </div>
              <div className="space-y-2">
                <Label>Especialidades de teleconsulta</Label>
                <Input
                  {...register("teleconsultationSpecialties")}
                  placeholder="Ej: Oncología, Psicología"
                />
              </div>
            </>
          )}
          <TriSelect
            label="¿Tratamiento desde SEPA?"
            value={treatmentViaSepa}
            onChange={(value) => setValue("treatmentViaSepa", value)}
          />
          <div className="space-y-2">
            <Label>Sesiones programadas</Label>
            <Input
              type="number"
              min={0}
              step={1}
              {...register("scheduledSessions")}
              placeholder="Ej: 4"
            />
          </div>
          <div className="space-y-2">
            <Label>Sesiones realizadas</Label>
            <Input
              type="number"
              min={0}
              step={1}
              {...register("completedSessions")}
              placeholder="Ej: 2"
            />
          </div>
          <TriSelect
            label="¿Cumplió el tratamiento hormonal?"
            value={hormonalTreatmentCompleted}
            onChange={(value) =>
              setValue("hormonalTreatmentCompleted", value)
            }
          />
          <div className="space-y-2">
            <Label>Barrera de acceso</Label>
            <Select
              items={ACCESS_BARRIER_ITEMS}
              value={accessBarrierCode ?? ""}
              onValueChange={(value) =>
                setValue(
                  "accessBarrierCode",
                  (value as AccessBarrierCode | null) ?? undefined,
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar barrera" />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_BARRIER_ITEMS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {accessBarrierCode === "OTHER" && (
            <div className="space-y-2">
              <Label>Otra barrera de acceso</Label>
              <Input
                {...register("accessBarrierOther")}
                placeholder="Especificá la barrera"
              />
            </div>
          )}
          <TriSelect
            label="¿Orientado ante barreras de acceso?"
            value={orientedRegardingBarriers}
            onChange={(value) =>
              setValue("orientedRegardingBarriers", value)
            }
          />
          {treatmentSituation === "INTERRUMPIDO" && (
            <>
              <div className="space-y-2">
                <Label>Motivo de interrupción</Label>
                <Select
                  items={INTERRUPTION_REASON_ITEMS}
                  value={interruptionReason ?? ""}
                  onValueChange={(value) =>
                    setValue(
                      "interruptionReason",
                      (value as InterruptionReason | null) ?? undefined,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERRUPTION_REASON_ITEMS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {interruptionReason === "OTHER" && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Otro motivo de interrupción</Label>
                  <Textarea
                    {...register("interruptionReasonOther")}
                    placeholder="Describe el motivo"
                  />
                </div>
              )}
            </>
          )}
          {treatmentSituation === "ABANDONED" && (
            <div className="space-y-2 md:col-span-2">
              <Label>Motivo de abandono</Label>
              <Textarea
                {...register("treatmentAbandonmentReason")}
                placeholder="Describe el motivo del abandono"
              />
            </div>
          )}
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
              <div className="space-y-2 md:col-span-2">
                <Label>Hospital de origen</Label>
                <div className="flex gap-2">
                  <Select
                    items={hospitals.map((h) => ({
                      value: h.id,
                      label: h.name,
                    }))}
                    value={sourceHealthCenterId ?? ""}
                    onValueChange={(v) =>
                      setValue("sourceHealthCenterId", v ?? undefined)
                    }
                  >
                    <SelectTrigger className="flex-1">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={onOpenNewHospital}
                  >
                    <Building2 className="size-3.5" />
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Hospital receptor</Label>
                <div className="flex gap-2">
                  <Select
                    items={hospitals.map((h) => ({
                      value: h.id,
                      label: h.name,
                    }))}
                    value={receivingHealthCenterId ?? ""}
                    onValueChange={(v) =>
                      setValue("receivingHealthCenterId", v ?? undefined)
                    }
                  >
                    <SelectTrigger className="flex-1">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={onOpenNewHospital}
                  >
                    <Building2 className="size-3.5" />
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2 md:col-span-2">
              <Label>Hospital donde recibe el tratamiento</Label>
              <div className="flex gap-2">
                <Select
                  items={hospitals.map((h) => ({
                    value: h.id,
                    label: h.name,
                  }))}
                  value={receivingHealthCenterId ?? ""}
                  onValueChange={(v) =>
                    setValue("receivingHealthCenterId", v ?? undefined)
                  }
                >
                  <SelectTrigger className="flex-1">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={onOpenNewHospital}
                >
                  <Building2 className="size-3.5" />
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <Label>Receta</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={!canAttachPrescription}
                onClick={() => setPrescriptionUploadOpen(true)}
              >
                <FileUp className="size-3.5" />
                Agregar receta
              </Button>
              {!canAttachPrescription && (
                <p className="text-muted-foreground text-xs">
                  La receta se puede adjuntar cuando el tratamiento ya esté
                  guardado.
                </p>
              )}
            </div>
          </div>
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
    <PatientDocumentUploadDialog
      open={prescriptionUploadOpen}
      onOpenChange={setPrescriptionUploadOpen}
      diagnoses={diagnoses}
      treatments={treatments}
      isPending={uploadPrescriptionMutation.isPending}
      defaultDocumentType="PRESCRIPTION"
      lockedTreatmentId={selectedTreatment?.id}
      hideTypeSelect
      onSubmit={(input) => uploadPrescriptionMutation.mutate(input)}
    />
    </>
  )
}

// ── Seguro / SIS ──

interface InsuranceFormValues {
  insuranceType: InsuranceType | undefined
  epsProvider: EpsProvider | undefined
  changeReason: string
  startDate: string
  canAffiliate: boolean
  affiliatedViaSepa: boolean | undefined
  expectedDate: string
}

function SeguroForm({
  insuranceDraft,
  sisDraft,
  currentInsurance,
  currentSisAffiliation,
  onSave,
}: {
  insuranceDraft: InsuranceDraft | undefined
  sisDraft: SisAffiliationDraft | undefined
  currentInsurance: PatientInsurance | undefined
  currentSisAffiliation: PatientSisAffiliation | undefined
  onSave: (
    insurance: InsuranceDraft,
    sisAffiliation: SisAffiliationDraft | undefined,
  ) => void
}) {
  const { register, handleSubmit, watch, setValue, reset } =
    useForm<InsuranceFormValues>({
      defaultValues: {
        insuranceType:
          insuranceDraft?.insuranceType ?? currentInsurance?.insuranceType,
        epsProvider:
          insuranceDraft?.epsProvider ??
          currentInsurance?.epsProvider ??
          undefined,
        changeReason: insuranceDraft?.changeReason ?? "",
        startDate:
          insuranceDraft?.startDate ?? currentInsurance?.startDate ?? "",
        canAffiliate:
          sisDraft?.canAffiliate ??
          currentSisAffiliation?.canAffiliate ??
          false,
        affiliatedViaSepa:
          insuranceDraft?.insuranceType === "ESSALUD" ||
          (!insuranceDraft && currentInsurance?.insuranceType === "ESSALUD")
            ? (insuranceDraft?.affiliatedViaSepa ??
              currentInsurance?.affiliatedViaSepa ??
              undefined)
            : (sisDraft?.affiliatedViaSepa ??
              currentSisAffiliation?.affiliatedViaSepa ??
              undefined),
        expectedDate:
          sisDraft?.expectedDate ?? currentSisAffiliation?.expectedDate ?? "",
      },
    })

  useEffect(() => {
    const isEssaludDraft =
      insuranceDraft?.insuranceType === "ESSALUD" ||
      (!insuranceDraft && currentInsurance?.insuranceType === "ESSALUD")
    reset({
      insuranceType:
        insuranceDraft?.insuranceType ?? currentInsurance?.insuranceType,
      epsProvider:
        insuranceDraft?.epsProvider ??
        currentInsurance?.epsProvider ??
        undefined,
      changeReason: insuranceDraft?.changeReason ?? "",
      startDate: insuranceDraft?.startDate ?? currentInsurance?.startDate ?? "",
      canAffiliate:
        sisDraft?.canAffiliate ?? currentSisAffiliation?.canAffiliate ?? false,
      affiliatedViaSepa: isEssaludDraft
        ? (insuranceDraft?.affiliatedViaSepa ??
          currentInsurance?.affiliatedViaSepa ??
          undefined)
        : (sisDraft?.affiliatedViaSepa ??
          currentSisAffiliation?.affiliatedViaSepa ??
          undefined),
      expectedDate:
        sisDraft?.expectedDate ?? currentSisAffiliation?.expectedDate ?? "",
    })
  }, [currentInsurance, currentSisAffiliation, insuranceDraft, reset, sisDraft])

  const insuranceType = watch("insuranceType")
  const epsProvider = watch("epsProvider")
  const isSis = insuranceType === "SIS"
  const isEssalud = insuranceType === "ESSALUD"
  const isWithoutInsurance = insuranceType === "NONE"

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
      ...(values.insuranceType === "ESSALUD"
        ? { affiliatedViaSepa: values.affiliatedViaSepa }
        : {}),
    }

    const selectedIsSis = values.insuranceType === "SIS"
    const selectedWithoutInsurance = values.insuranceType === "NONE"
    const sisAffiliation: SisAffiliationDraft | undefined = selectedIsSis
      ? {
          canAffiliate: true,
          affiliatedViaSepa: values.affiliatedViaSepa,
          affiliatedAt: values.startDate || undefined,
        }
      : selectedWithoutInsurance
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
      <div>
        <p className="text-sm font-medium">INFORMACIÓN DE SEGURO</p>
        <p className="text-muted-foreground text-xs">
          Registra el seguro actual y la afiliación al SIS cuando corresponda.
        </p>
      </div>
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
          <Label>Fecha de afiliación</Label>
          <Input type="date" {...register("startDate")} />
        </div>
      </div>

      {(isSis || isEssalud || isWithoutInsurance) && (
        <div className="border-border/60 mt-2 border-t pt-4">
          <p className="mb-3 text-sm font-medium">
            {isEssalud ? "Afiliación EsSalud" : "Afiliación SIS"}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isWithoutInsurance && (
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
            )}
            {isSis && (
              <TriSelect
                label="¿Afiliación al SIS desde SEPA?"
                value={watch("affiliatedViaSepa")}
                onChange={(value) => setValue("affiliatedViaSepa", value)}
              />
            )}
            {isEssalud && (
              <TriSelect
                label="¿Afiliación al ESSALUD desde SEPA?"
                value={watch("affiliatedViaSepa")}
                onChange={(value) => setValue("affiliatedViaSepa", value)}
              />
            )}
            {isWithoutInsurance && (
              <div className="space-y-2">
                <Label>Fecha esperada</Label>
                <Input type="date" {...register("expectedDate")} />
              </div>
            )}
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
  programDropoutReasonCode: ProgramDropoutReasonCode | undefined
  transportationViaSepa: boolean | undefined
  transportationSepaProvider: TransportationSepaProvider | undefined
  transportationSepaProviderOther: string
  shelterViaSepa: boolean | undefined
  shelterSepaProvider: ShelterSepaProvider | undefined
  shelterSepaProviderOther: string
  attendedEducationalTalk: boolean | undefined
  attendedEducationalTalkAt: string
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
        programDropoutReasonCode:
          draft?.programDropoutReasonCode ??
          currentDetails?.programDropoutReasonCode ??
          undefined,
        transportationViaSepa:
          draft?.transportationViaSepa ??
          currentDetails?.transportationViaSepa ??
          undefined,
        transportationSepaProvider:
          draft?.transportationSepaProvider ??
          currentDetails?.transportationSepaProvider ??
          undefined,
        transportationSepaProviderOther:
          draft?.transportationSepaProviderOther ??
          currentDetails?.transportationSepaProviderOther ??
          "",
        shelterViaSepa:
          draft?.shelterViaSepa ?? currentDetails?.shelterViaSepa ?? undefined,
        shelterSepaProvider:
          draft?.shelterSepaProvider ??
          currentDetails?.shelterSepaProvider ??
          undefined,
        shelterSepaProviderOther:
          draft?.shelterSepaProviderOther ??
          currentDetails?.shelterSepaProviderOther ??
          "",
        attendedEducationalTalk:
          draft?.attendedEducationalTalk ??
          currentDetails?.attendedEducationalTalk ??
          undefined,
        attendedEducationalTalkAt:
          draft?.attendedEducationalTalkAt ??
          currentDetails?.attendedEducationalTalkAt ??
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
      programDropoutReasonCode:
        draft?.programDropoutReasonCode ??
        currentDetails?.programDropoutReasonCode ??
        undefined,
      transportationViaSepa:
        draft?.transportationViaSepa ??
        currentDetails?.transportationViaSepa ??
        undefined,
      transportationSepaProvider:
        draft?.transportationSepaProvider ??
        currentDetails?.transportationSepaProvider ??
        undefined,
      transportationSepaProviderOther:
        draft?.transportationSepaProviderOther ??
        currentDetails?.transportationSepaProviderOther ??
        "",
      shelterViaSepa:
        draft?.shelterViaSepa ?? currentDetails?.shelterViaSepa ?? undefined,
      shelterSepaProvider:
        draft?.shelterSepaProvider ??
        currentDetails?.shelterSepaProvider ??
        undefined,
      shelterSepaProviderOther:
        draft?.shelterSepaProviderOther ??
        currentDetails?.shelterSepaProviderOther ??
        "",
      attendedEducationalTalk:
        draft?.attendedEducationalTalk ??
        currentDetails?.attendedEducationalTalk ??
        undefined,
      attendedEducationalTalkAt:
        draft?.attendedEducationalTalkAt ??
        currentDetails?.attendedEducationalTalkAt ??
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
        programDropoutReasonCode: values.programDropoutReasonCode,
        transportationViaSepa: values.transportationViaSepa,
        transportationSepaProvider:
          values.transportationViaSepa === true
            ? values.transportationSepaProvider
            : undefined,
        transportationSepaProviderOther:
          values.transportationViaSepa === true &&
          values.transportationSepaProvider === "OTHER"
            ? values.transportationSepaProviderOther.trim() || undefined
            : undefined,
        shelterViaSepa: values.shelterViaSepa,
        shelterSepaProvider:
          values.shelterViaSepa === true
            ? values.shelterSepaProvider
            : undefined,
        shelterSepaProviderOther:
          values.shelterViaSepa === true &&
          values.shelterSepaProvider === "OTHER"
            ? values.shelterSepaProviderOther.trim() || undefined
            : undefined,
        attendedEducationalTalk: values.attendedEducationalTalk,
        attendedEducationalTalkAt:
          values.attendedEducationalTalk === true
            ? values.attendedEducationalTalkAt || undefined
            : undefined,
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

        <TriSelect
          label="¿Accedió al beneficio de traslado por gestión de SEPA?"
          value={watch("transportationViaSepa")}
          onChange={(v) => {
            setValue("transportationViaSepa", v)
            if (v !== true) {
              setValue("transportationSepaProvider", undefined)
              setValue("transportationSepaProviderOther", "")
            }
          }}
        />
        {watch("transportationViaSepa") === true && (
          <>
            <div className="space-y-2">
              <Label>Proveedor de traslado SEPA</Label>
              <Select
                items={TRANSPORTATION_SEPA_PROVIDER_ITEMS}
                value={watch("transportationSepaProvider") ?? ""}
                onValueChange={(value) =>
                  setValue(
                    "transportationSepaProvider",
                    (value as TransportationSepaProvider | null) ?? undefined,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSPORTATION_SEPA_PROVIDER_ITEMS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {watch("transportationSepaProvider") === "OTHER" && (
              <div className="space-y-2">
                <Label>Otro proveedor de traslado</Label>
                <Input
                  {...register("transportationSepaProviderOther")}
                  placeholder="Especificá el proveedor"
                />
              </div>
            )}
          </>
        )}

        <TriSelect
          label="¿Accedió a un servicio de albergue por orientación de SEPA?"
          value={watch("shelterViaSepa")}
          onChange={(v) => {
            setValue("shelterViaSepa", v)
            if (v !== true) {
              setValue("shelterSepaProvider", undefined)
              setValue("shelterSepaProviderOther", "")
            }
          }}
        />
        {watch("shelterViaSepa") === true && (
          <>
            <div className="space-y-2">
              <Label>Albergue / proveedor SEPA</Label>
              <Select
                items={SHELTER_SEPA_PROVIDER_ITEMS}
                value={watch("shelterSepaProvider") ?? ""}
                onValueChange={(value) =>
                  setValue(
                    "shelterSepaProvider",
                    (value as ShelterSepaProvider | null) ?? undefined,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar albergue" />
                </SelectTrigger>
                <SelectContent>
                  {SHELTER_SEPA_PROVIDER_ITEMS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {watch("shelterSepaProvider") === "OTHER" && (
              <div className="space-y-2">
                <Label>Otro albergue</Label>
                <Input
                  {...register("shelterSepaProviderOther")}
                  placeholder="Especificá el albergue"
                />
              </div>
            )}
          </>
        )}

        <TriSelect
          label="¿Asistió a charla o taller educativo de FPC?"
          value={watch("attendedEducationalTalk")}
          onChange={(v) => {
            setValue("attendedEducationalTalk", v)
            if (v !== true) setValue("attendedEducationalTalkAt", "")
          }}
        />
        {watch("attendedEducationalTalk") === true && (
          <div className="space-y-2">
            <Label>Fecha de la charla educativa</Label>
            <Input type="date" {...register("attendedEducationalTalkAt")} />
          </div>
        )}

        <div className="space-y-2">
          <Label>Fecha de abandono del programa</Label>
          <Input type="date" {...register("programDropoutDate")} />
        </div>
        <div className="space-y-2">
          <Label>Motivo de abandono del programa</Label>
          <Select
            items={PROGRAM_DROPOUT_REASON_CODE_ITEMS}
            value={watch("programDropoutReasonCode") ?? ""}
            onValueChange={(value) =>
              setValue(
                "programDropoutReasonCode",
                (value as ProgramDropoutReasonCode | null) ?? undefined,
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar motivo" />
            </SelectTrigger>
            <SelectContent>
              {PROGRAM_DROPOUT_REASON_CODE_ITEMS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Detalle / otro motivo de abandono</Label>
          <Input
            {...register("programDropoutReason")}
            placeholder="Detalle adicional del motivo..."
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

// ── Estado diagnóstico (signos y síntomas) ──

function DiagnosticStatusCard({
  patientId,
  followUpId,
}: {
  patientId: string
  followUpId: string
}) {
  const queryClient = useQueryClient()
  const { data: current, isLoading } = useQuery({
    queryKey: ["patient-diagnostic-status-current", patientId],
    queryFn: () => patientsApi.getCurrentDiagnosticStatus(patientId),
  })
  const [status, setStatus] = useState<DiagnosticStatus | "">("")
  const [supportedBySepa, setSupportedBySepa] = useState<boolean | undefined>()
  const [notes, setNotes] = useState("")

  useEffect(() => {
    setStatus(current?.status ?? "")
    setSupportedBySepa(current?.supportedBySepa ?? undefined)
    setNotes(current?.notes ?? "")
  }, [current])

  const transitionMutation = useMutation({
    mutationFn: (body: TransitionPatientDiagnosticStatusDto) =>
      patientsApi.transitionDiagnosticStatus(patientId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patient-diagnostic-status-current", patientId],
      })
      await queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      })
      toast.success("Estado diagnóstico actualizado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo actualizar el estado diagnóstico", {
        description: error.message,
      }),
  })

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!status) {
      toast.error("Seleccioná el nuevo estado diagnóstico")
      return
    }
    transitionMutation.mutate({
      status,
      followUpId,
      supportedBySepa,
      notes: notes.trim() || undefined,
    })
  }

  const currentLabel = current?.status
    ? diagnosticStatusLabels[current.status]
    : "Sin registrar"

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border/60 mb-3 space-y-3 rounded-xl border p-3"
    >
      <div>
        <p className="text-sm font-medium">Estado diagnóstico (SEPA)</p>
        <p className="text-muted-foreground text-xs">
          Actual: {isLoading ? "Cargando…" : currentLabel}
          {current?.supportedBySepa != null
            ? ` · Soporte SEPA: ${current.supportedBySepa ? "Sí" : "No"}`
            : ""}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nuevo estado</Label>
          <Select
            items={DIAGNOSTIC_STATUS_ITEMS}
            value={status}
            onValueChange={(value) =>
              setStatus((value as DiagnosticStatus | null) ?? "")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              {DIAGNOSTIC_STATUS_ITEMS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TriSelect
          label="¿Soportado por SEPA?"
          value={supportedBySepa}
          onChange={setSupportedBySepa}
        />
        <div className="space-y-2 md:col-span-2">
          <Label>Notas (opcional)</Label>
          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Detalle del cambio de estado"
          />
        </div>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={transitionMutation.isPending || !status}
      >
        {transitionMutation.isPending ? "Guardando…" : "Registrar transición"}
      </Button>
    </form>
  )
}
