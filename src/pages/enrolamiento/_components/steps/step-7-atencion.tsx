import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  createEnrollmentDiagnosisDraft,
  createEnrollmentTreatmentDraft,
  useEnrollmentStore,
  type EnrollmentDiagnosisDraft,
  type EnrollmentTreatmentDraft,
} from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Activity,
  Stethoscope,
  HeartPulse,
  HeartHandshake,
  Building2,
  Plus,
  Users,
  Minus,
} from "lucide-react"
import { StepContainer, StepHeader, SectionHeader, StepNav } from "../shared"
import { healthCentersApi } from "@/api/health-centers"
import { CreateHealthCenterDialog } from "@/pages/hospitales/_components/create-health-center-dialog"
import { DurationInput } from "@/components/duration-input"
import { calculateDurationBetweenDates } from "@/types/duration"
import type {
  AddMedicalAppointmentRequest,
  AddTreatmentMedicationRequest,
  CancerStage,
  MedicalConsultationStatus,
  MedicationDoseUnit,
  MedicationRoute,
  TreatmentSituation,
} from "@/types"
import type { HealthCenter } from "@/api/health-centers"

const fl =
  "text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70"
const flGrid = `${fl} min-h-5`
const sc = "w-full bg-card border"

const stageLabels: Record<CancerStage, string> = {
  STAGE_1: "1",
  STAGE_2: "2",
  STAGE_3: "3",
  STAGE_4: "4",
  UNKNOWN: "Desconoce",
}

const DIAGNOSIS_OPTIONS = [
  "Cáncer de mama",
  "Cáncer de cuello uterino",
  "Cáncer de próstata",
  "Cáncer de estómago",
  "Cáncer de pulmón",
  "Cáncer de colon y recto",
  "Cáncer de piel",
  "Cáncer de hígado",
  "Cáncer de tiroides",
  "Leucemia",
  "Linfoma",
  "Cáncer de riñón",
  "Cáncer de vejiga",
  "Cáncer de páncreas",
  "Cáncer de ovario",
  "Sarcoma",
  "Cáncer de esófago",
  "Cáncer de endometrio",
] as const

const TREATMENT_SITUATIONS: Array<{
  value: TreatmentSituation
  label: string
}> = [
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
]

const YES_NO_OPTIONS = [
  { value: "Sí", label: "Sí" },
  { value: "No", label: "No" },
] as const

const CONSULTATION_STATUS_OPTIONS: Array<{
  value: MedicalConsultationStatus
  label: string
}> = [
  { value: "NOT_OBTAINED", label: "No obtuvo consulta" },
  { value: "SCHEDULED", label: "Consulta programada" },
  { value: "ATTENDED", label: "Consulta atendida" },
]

const DOSE_UNITS: Array<{ value: MedicationDoseUnit; label: string }> = [
  { value: "MG", label: "mg" },
  { value: "G", label: "g" },
  { value: "ML", label: "ml" },
  { value: "UI", label: "UI" },
  { value: "TABLET", label: "Tableta" },
  { value: "DROP", label: "Gota" },
  { value: "OTHER", label: "Otro" },
]

const MEDICATION_ROUTES: Array<{ value: MedicationRoute; label: string }> = [
  { value: "ORAL", label: "Oral" },
  { value: "IV", label: "Intravenosa" },
  { value: "IM", label: "Intramuscular" },
  { value: "SUBCUTANEOUS", label: "Subcutánea" },
  { value: "TOPICAL", label: "Tópica" },
  { value: "OTHER", label: "Otra" },
]

const TALK_TOPICS = [
  "Prevención del cáncer de mama",
  "Prevención del cáncer de cuello uterino",
  "Prevención del cáncer de próstata",
  "Prevención del cáncer de estómago",
  "Prevención del cáncer de pulmón",
  "Prevención del cáncer de colon y recto",
  "Prevención del cáncer de piel",
  "Prevención general del cáncer",
] as const

const OTHER_VALUE = "OTHER"
const TALK_OTHER = "TALK_OTHER"

type NewHospitalTarget =
  | "diagnosis"
  | "referred"
  | "appointment"
  | "treatment-source"
  | "treatment-receiving"

const EMPTY_APPOINTMENT: AddMedicalAppointmentRequest = {
  healthCenterId: null,
  specialty: null,
  appointmentDate: null,
  nextAppointmentDate: null,
  nextAppointmentSpecialty: null,
  difficulties: null,
  hasReferralSheet: undefined,
  isFirstConsultation: false,
}

const EMPTY_DIAGNOSIS: EnrollmentDiagnosisDraft = {
  draftId: "",
  diagnosis: "",
  isCurrent: true,
}

const EMPTY_TREATMENT: EnrollmentTreatmentDraft = {
  draftId: "",
  diagnosisRef: "",
  treatmentType: "",
  isCurrent: true,
  isReferred: false,
}

export function Step7Atencion({
  embedded = false,
  historical = false,
}: {
  embedded?: boolean
  historical?: boolean
}) {
  const { draft, updateDraft, nextStep, prevStep, categoriaClinica } =
    useEnrollmentStore()
  const sr = draft.symptomReport
  const diagnoses = draft.diagnoses
  const treatments = draft.treatments
  const [selectedDiagnosisIndex, setSelectedDiagnosisIndex] = useState(0)
  const [selectedTreatmentIndex, setSelectedTreatmentIndex] = useState(0)
  const diagnosisIndex = diagnoses.length
    ? Math.min(selectedDiagnosisIndex, diagnoses.length - 1)
    : 0
  const treatmentIndex = treatments.length
    ? Math.min(selectedTreatmentIndex, treatments.length - 1)
    : 0
  const selectedDiagnosis = diagnoses[diagnosisIndex]
  const selectedTreatment = treatments[treatmentIndex]
  const dx = selectedDiagnosis ?? EMPTY_DIAGNOSIS
  const tx = selectedTreatment ?? EMPTY_TREATMENT
  const sis = draft.sisAffiliation
  const details = draft.details
  const meta = draft.enrollmentMetadata
  const psychooncologySupport = draft.psychooncologySupportAssessment
  const hasPsychooncologySupportResponse =
    typeof psychooncologySupport.excessiveWorry === "boolean" ||
    psychooncologySupport.emotionalDistressScore !== undefined ||
    psychooncologySupport.preferredModality !== undefined
  const seguro = draft.insurance.insuranceType
  const tieneSeguroReal = seguro && seguro !== "NONE"
  const esSignos = categoriaClinica === "SIGNS_AND_SYMPTOMS"
  const esDx = categoriaClinica === "CANCER_DIAGNOSIS"
  const label = esSignos ? "Signos y Síntomas" : "Diagnóstico de Cáncer"

  const [newHospitalOpen, setNewHospitalOpen] = useState(false)
  const [newHospitalTarget, setNewHospitalTarget] =
    useState<NewHospitalTarget | null>(null)

  const knownDiagnoses = DIAGNOSIS_OPTIONS as readonly string[]
  const [otherDiagnosisIds, setOtherDiagnosisIds] = useState<Set<string>>(
    () =>
      new Set(
        diagnoses
          .filter(
            (diagnosis) =>
              Boolean(diagnosis.diagnosis) &&
              !knownDiagnoses.includes(diagnosis.diagnosis),
          )
          .map((diagnosis) => diagnosis.draftId),
      ),
  )
  const isOtherDiagnosis =
    Boolean(dx.diagnosis && !knownDiagnoses.includes(dx.diagnosis)) ||
    otherDiagnosisIds.has(dx.draftId)
  const diagnosisSelectValue = isOtherDiagnosis
    ? OTHER_VALUE
    : dx.diagnosis && knownDiagnoses.includes(dx.diagnosis)
      ? dx.diagnosis
      : ""

  const medicalAppointments = draft.medicalAppointments ?? []
  const medications = tx.medications ?? []
  const familyPreventionTalkInterests =
    draft.familyPreventionTalkInterests ?? []
  const appointment = medicalAppointments[0] ?? EMPTY_APPOINTMENT
  const ft = familyPreventionTalkInterests
  const calculatedWaitTime = calculateDurationBetweenDates(
    dx.firstSymptomsDate,
    dx.diagnosisDate,
  )
  const visibleWaitTime = dx.waitTimeForDiagnosisManuallyEdited
    ? dx.waitTimeForDiagnosis
    : (calculatedWaitTime ?? dx.waitTimeForDiagnosis)
  const [showFamilyTalks, setShowFamilyTalks] = useState(ft.length > 0)
  const [talkOtherIndices, setTalkOtherIndices] = useState<Set<number>>(() => {
    const topics = TALK_TOPICS as readonly string[]
    const others = new Set<number>()
    ft.forEach((entry, i) => {
      if (entry.talkName && !topics.includes(entry.talkName)) others.add(i)
    })
    return others
  })

  const { data: healthCenters = [] } = useQuery<HealthCenter[]>({
    queryKey: ["healthCenters"],
    queryFn: () => healthCentersApi.list(),
    staleTime: 60 * 1000,
  })

  const activeCenters = healthCenters.filter((c) => c.isActive)

  function updateAppointment(partial: Partial<AddMedicalAppointmentRequest>) {
    updateDraft({ medicalAppointments: [{ ...appointment, ...partial }] })
  }

  function openNewHospital(target: NewHospitalTarget) {
    setNewHospitalTarget(target)
    setNewHospitalOpen(true)
  }

  function handleNewHospitalCreated(center: HealthCenter) {
    if (newHospitalTarget === "diagnosis")
      updateDiagnosis({ healthCenterId: center.id })
    if (newHospitalTarget === "referred")
      updateDiagnosis({ referredHealthCenterId: center.id })
    if (newHospitalTarget === "appointment")
      updateAppointment({ healthCenterId: center.id })
    if (newHospitalTarget === "treatment-source")
      updateTreatment({ sourceHealthCenterId: center.id })
    if (newHospitalTarget === "treatment-receiving")
      updateTreatment({ receivingHealthCenterId: center.id })
  }

  function updateDiagnosis(partial: Partial<EnrollmentDiagnosisDraft>) {
    if (!selectedDiagnosis) return
    updateDraft({
      diagnoses: diagnoses.map((diagnosis, index) =>
        index === diagnosisIndex ? { ...diagnosis, ...partial } : diagnosis,
      ),
    })
  }

  function updateTreatment(partial: Partial<EnrollmentTreatmentDraft>) {
    if (!selectedTreatment) return
    updateDraft({
      treatments: treatments.map((treatment, index) =>
        index === treatmentIndex ? { ...treatment, ...partial } : treatment,
      ),
    })
  }

  function addDiagnosis() {
    const nextDiagnosis = createEnrollmentDiagnosisDraft()
    updateDraft({ diagnoses: [...diagnoses, nextDiagnosis] })
    setSelectedDiagnosisIndex(diagnoses.length)
  }

  function removeDiagnosis(index: number) {
    const diagnosis = diagnoses[index]
    if (!diagnosis || diagnoses.length === 1) return
    if (
      treatments.some(
        (treatment) => treatment.diagnosisRef === diagnosis.draftId,
      )
    )
      return
    const updatedDiagnoses = diagnoses.filter(
      (_, diagnosisIndex) => diagnosisIndex !== index,
    )
    updateDraft({ diagnoses: updatedDiagnoses })
    setOtherDiagnosisIds((previous) => {
      const next = new Set(previous)
      next.delete(diagnosis.draftId)
      return next
    })
    setSelectedDiagnosisIndex((current) =>
      current > index
        ? current - 1
        : Math.min(current, updatedDiagnoses.length - 1),
    )
  }

  function addTreatment() {
    if (!diagnoses.length) return
    const nextTreatment = createEnrollmentTreatmentDraft(
      diagnoses[diagnosisIndex]?.draftId ?? diagnoses[0].draftId,
    )
    updateDraft({ treatments: [...treatments, nextTreatment] })
    setSelectedTreatmentIndex(treatments.length)
  }

  function removeTreatment(index: number) {
    const updatedTreatments = treatments.filter(
      (_, treatmentIndex) => treatmentIndex !== index,
    )
    updateDraft({ treatments: updatedTreatments })
    setSelectedTreatmentIndex((current) =>
      current > index
        ? current - 1
        : Math.min(current, Math.max(updatedTreatments.length - 1, 0)),
    )
  }

  function clearAppointment() {
    updateDraft({ medicalAppointments: [] })
  }

  function updateDiagnosisDate(
    field: "diagnosisDate" | "firstSymptomsDate",
    date: string,
  ) {
    const nextDiagnosis = {
      ...dx,
      [field]: date || null,
      ...(field === "firstSymptomsDate"
        ? { firstSymptomsDateUnknown: false }
        : {}),
    }
    updateDraft({
      diagnoses: diagnoses.map((diagnosis, index) =>
        index === diagnosisIndex
          ? {
              ...nextDiagnosis,
              waitTimeForDiagnosis: calculateDurationBetweenDates(
                nextDiagnosis.firstSymptomsDate,
                nextDiagnosis.diagnosisDate,
              ),
              waitTimeForDiagnosisManuallyEdited: false,
            }
          : diagnosis,
      ),
    })
  }

  function updateFirstSymptomsUnknown(value: string | null) {
    const unknown = value === "Sí"
    updateDiagnosis({
      firstSymptomsDateUnknown: unknown,
      firstSymptomsDate: unknown ? null : dx.firstSymptomsDate,
      ...(unknown && !dx.waitTimeForDiagnosisManuallyEdited
        ? { waitTimeForDiagnosis: undefined }
        : {}),
    })
  }

  function updateMedication(
    medicationIndex: number,
    partial: Partial<AddTreatmentMedicationRequest>,
  ) {
    updateDraft({
      treatments: treatments.map((treatment, treatmentIndexInList) =>
        treatmentIndexInList === treatmentIndex
          ? {
              ...treatment,
              medications: medications.map(
                (medication, currentMedicationIndex) =>
                  currentMedicationIndex === medicationIndex
                    ? { ...medication, ...partial }
                    : medication,
              ),
            }
          : treatment,
      ),
    })
  }

  function addMedication() {
    updateDraft({
      treatments: treatments.map((treatment, index) =>
        index === treatmentIndex
          ? {
              ...treatment,
              medications: [...medications, { name: "", isActive: true }],
            }
          : treatment,
      ),
    })
  }

  function removeMedication(index: number) {
    updateDraft({
      treatments: treatments.map((treatment, treatmentIndexInList) =>
        treatmentIndexInList === treatmentIndex
          ? {
              ...treatment,
              medications: medications.filter(
                (_, medicationIndex) => medicationIndex !== index,
              ),
            }
          : treatment,
      ),
    })
  }

  function setTalkOther(idx: number, isOther: boolean) {
    setTalkOtherIndices((prev) => {
      const next = new Set(prev)
      if (isOther) next.add(idx)
      else next.delete(idx)
      return next
    })
  }

  function addFamilyTalk() {
    updateDraft({
      familyPreventionTalkInterests: [
        ...ft,
        {
          talkName: "",
          familyMemberName: "",
          familyMemberPhone: "",
          familyMemberEmail: "",
        },
      ],
    })
  }

  function removeFamilyTalk(idx: number) {
    const updated = ft.filter((_, i) => i !== idx)
    setTalkOtherIndices((prev) => {
      const next = new Set<number>()
      prev.forEach((i) => {
        if (i < idx) next.add(i)
        else if (i > idx) next.add(i - 1)
      })
      return next
    })
    updateDraft({ familyPreventionTalkInterests: updated })
    if (updated.length === 0) setShowFamilyTalks(false)
  }

  function updateFamilyTalk(
    idx: number,
    field: keyof (typeof ft)[0],
    value: string,
  ) {
    updateDraft({
      familyPreventionTalkInterests: ft.map((e, i) =>
        i === idx ? { ...e, [field]: value } : e,
      ),
    })
  }

  return (
    <>
      <StepContainer
        embedded={embedded}
        onSubmit={(e) => {
          e.preventDefault()
          nextStep()
        }}
        className="flex flex-col gap-8"
      >
        <StepHeader
          step={7}
          title="Atención Especializada"
          description={`Rama activa: ${label}${!tieneSeguroReal ? " · Sin seguro" : ""}`}
        />
        <div className="bg-card rounded-xl px-4 py-3">
          <p className="text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase">
            Categoría
          </p>
          <p className="text-foreground mt-0.5 text-sm font-semibold">
            {label} · {tieneSeguroReal ? "Con seguro" : "Sin seguro"}
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <SectionHeader
            icon={Building2}
            title="Establecimiento principal del paciente"
          />
          <p className="text-muted-foreground text-xs">
            Opcional. Selecciónalo si el paciente ya tiene un hospital principal
            definido.
          </p>
          <Select
            items={activeCenters.map((c) => ({
              value: c.id,
              label: `${c.name} — ${c.department}`,
            }))}
            value={details.primaryHealthCenterId ?? ""}
            onValueChange={(v) =>
              updateDraft({
                details: { ...details, primaryHealthCenterId: v || undefined },
              })
            }
          >
            <SelectTrigger className={sc}>
              <SelectValue placeholder="No definido" />
            </SelectTrigger>
            <SelectContent>
              {activeCenters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} — {c.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {esSignos && (
          <section className="flex flex-col gap-5">
            <SectionHeader icon={Activity} title="Signos y Síntomas" />
            <div className="flex flex-col gap-2">
              <Label className={fl}>
                ¿Presenta algún malestar o dolor?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                items={YES_NO_OPTIONS}
                value={
                  sr.hasDiscomfort === true
                    ? "Sí"
                    : sr.hasDiscomfort === false
                      ? "No"
                      : ""
                }
                onValueChange={(v) =>
                  updateDraft({
                    symptomReport: {
                      ...sr,
                      hasDiscomfort: v === "Sí",
                      checkupMotivation:
                        v === "Sí" ? null : sr.checkupMotivation,
                    },
                  })
                }
              >
                <SelectTrigger className={sc}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sí">Sí</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DurationInput
              label="¿Desde hace cuánto presenta los síntomas?"
              units={["DAY", "WEEK", "MONTH", "YEAR"]}
              defaultUnit="DAY"
              singleValue
              value={sr.symptomDuration}
              onChange={(symptomDuration) =>
                updateDraft({ symptomReport: { ...sr, symptomDuration } })
              }
            />
            <DurationInput
              label="¿Cada cuánto se presentan?"
              units={["HOUR", "DAY", "WEEK", "MONTH", "YEAR"]}
              defaultUnit="WEEK"
              singleValue
              value={sr.symptomFrequency}
              onChange={(symptomFrequency) =>
                updateDraft({ symptomReport: { ...sr, symptomFrequency } })
              }
            />
            <div className="flex flex-col gap-2">
              <Label className={fl}>Descripción de signos y síntomas</Label>
              <Textarea
                value={sr.signsAndSymptoms ?? ""}
                onChange={(e) =>
                  updateDraft({
                    symptomReport: {
                      ...sr,
                      signsAndSymptoms: e.target.value || null,
                    },
                  })
                }
                placeholder="Describa los signos o síntomas..."
                className="bg-card min-h-20 border"
              />
            </div>
            {sr.hasDiscomfort === false && (
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  ¿Qué lo motivó a realizarse su examen médico?{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={sr.checkupMotivation ?? ""}
                  onChange={(e) =>
                    updateDraft({
                      symptomReport: {
                        ...sr,
                        checkupMotivation: e.target.value || null,
                      },
                    })
                  }
                  placeholder="Motivo del examen médico"
                  className="bg-card min-h-20 border"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label className={fl}>
                ¿Actualmente ha solicitado una consulta médica?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                items={YES_NO_OPTIONS}
                value={
                  sr.hasRequestedMedicalConsultation === true
                    ? "Sí"
                    : sr.hasRequestedMedicalConsultation === false
                      ? "No"
                      : ""
                }
                onValueChange={(value) => {
                  const requested = value === "Sí"
                  updateDraft({
                    symptomReport: {
                      ...sr,
                      hasRequestedMedicalConsultation: requested,
                      hasSoughtMedicalConsultation: requested,
                      ...(requested
                        ? {}
                        : {
                            consultationStatus: null,
                            consultationNotObtainedReason: null,
                            healthCenterId: null,
                            specialty: null,
                            indicationsReceived: null,
                          }),
                    },
                  })
                  if (requested) updateAppointment({})
                  else clearAppointment()
                }}
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
            {sr.hasRequestedMedicalConsultation === true && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className={fl}>
                    ¿Cuál es el estado de la consulta?{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    items={CONSULTATION_STATUS_OPTIONS}
                    value={sr.consultationStatus ?? ""}
                    onValueChange={(value) => {
                      const status = value as MedicalConsultationStatus
                      updateDraft({
                        symptomReport: {
                          ...sr,
                          consultationStatus: status,
                          ...(status === "NOT_OBTAINED"
                            ? {
                                consultationNotObtainedReason: null,
                                healthCenterId: null,
                                specialty: null,
                                indicationsReceived: null,
                              }
                            : { consultationNotObtainedReason: null }),
                        },
                      })
                      if (status === "NOT_OBTAINED") clearAppointment()
                      else
                        updateAppointment({
                          ...(status === "SCHEDULED"
                            ? {
                                hasReferralSheet: undefined,
                                referredTo: null,
                                referralNotProvidedReason: null,
                              }
                            : {}),
                        })
                    }}
                  >
                    <SelectTrigger className={sc}>
                      <SelectValue placeholder="Seleccionar estado..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSULTATION_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {sr.consultationStatus === "NOT_OBTAINED" && (
                  <div className="flex flex-col gap-2">
                    <Label className={fl}>
                      Motivo por el que no obtuvo la consulta{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      value={sr.consultationNotObtainedReason ?? ""}
                      onChange={(e) =>
                        updateDraft({
                          symptomReport: {
                            ...sr,
                            consultationNotObtainedReason:
                              e.target.value || null,
                          },
                        })
                      }
                      placeholder="Explique el motivo"
                      className="bg-card min-h-20 border"
                    />
                  </div>
                )}
                {(sr.consultationStatus === "SCHEDULED" ||
                  sr.consultationStatus === "ATTENDED") && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label className={fl}>
                        Establecimiento de la consulta{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        items={activeCenters.map((center) => ({
                          value: center.id,
                          label: `${center.name} — ${center.department}`,
                        }))}
                        value={sr.healthCenterId ?? ""}
                        onValueChange={(value) => {
                          updateDraft({
                            symptomReport: {
                              ...sr,
                              healthCenterId: value || null,
                            },
                          })
                          updateAppointment({ healthCenterId: value || null })
                        }}
                      >
                        <SelectTrigger className={sc}>
                          <SelectValue placeholder="Seleccionar establecimiento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {activeCenters.map((center) => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.name} — {center.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className={fl}>
                        Especialidad de la consulta{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={sr.specialty ?? ""}
                        onChange={(e) => {
                          const specialty = e.target.value || null
                          updateDraft({ symptomReport: { ...sr, specialty } })
                          updateAppointment({ specialty })
                        }}
                        placeholder="Ej: Oncología"
                        className="bg-card border"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                      <div className="flex flex-col gap-2">
                        <Label className={fl}>
                          {sr.consultationStatus === "ATTENDED"
                            ? "Fecha de la primera consulta"
                            : "Fecha de la consulta programada"}{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={appointment.appointmentDate ?? ""}
                          onChange={(e) =>
                            updateAppointment({
                              appointmentDate: e.target.value || null,
                            })
                          }
                          className="bg-card border"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className={fl}>Indicaciones recibidas</Label>
                      <Textarea
                        value={sr.indicationsReceived ?? ""}
                        onChange={(e) =>
                          updateDraft({
                            symptomReport: {
                              ...sr,
                              indicationsReceived: e.target.value || null,
                            },
                          })
                        }
                        placeholder="Indicaciones de la consulta"
                        className="bg-card min-h-20 border"
                      />
                    </div>
                    {sr.consultationStatus === "ATTENDED" && (
                      <>
                        <div className="flex flex-col gap-2">
                          <Label className={fl}>
                            ¿Le han brindado una hoja de referencia?{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            items={YES_NO_OPTIONS}
                            value={
                              appointment.hasReferralSheet === true
                                ? "Sí"
                                : appointment.hasReferralSheet === false
                                  ? "No"
                                  : ""
                            }
                            onValueChange={(value) =>
                              updateAppointment({
                                hasReferralSheet: value === "Sí",
                                referredTo:
                                  value === "Sí"
                                    ? appointment.referredTo
                                    : null,
                                referralNotProvidedReason:
                                  value === "No"
                                    ? appointment.referralNotProvidedReason
                                    : null,
                              })
                            }
                          >
                            <SelectTrigger className={sc}>
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sí">Sí</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {appointment.hasReferralSheet === true && (
                          <div className="flex flex-col gap-2">
                            <Label className={fl}>
                              ¿A dónde lo han referido?{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              value={appointment.referredTo ?? ""}
                              onChange={(e) =>
                                updateAppointment({
                                  referredTo: e.target.value || null,
                                })
                              }
                              placeholder="Establecimiento o servicio"
                              className="bg-card border"
                            />
                          </div>
                        )}
                        {appointment.hasReferralSheet === false && (
                          <div className="flex flex-col gap-2">
                            <Label className={fl}>
                              Motivo por el que no le brindaron la hoja de
                              referencia{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                              value={
                                appointment.referralNotProvidedReason ?? ""
                              }
                              onChange={(e) =>
                                updateAppointment({
                                  referralNotProvidedReason:
                                    e.target.value || null,
                                })
                              }
                              placeholder="Explique el motivo"
                              className="bg-card min-h-20 border"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
            <DurationInput
              label="¿Cuánto tiempo lleva buscando un diagnóstico?"
              units={["DAY", "WEEK", "MONTH", "YEAR"]}
              defaultUnit="MONTH"
              singleValue
              value={sr.diagnosisSearchDuration}
              onChange={(diagnosisSearchDuration) =>
                updateDraft({
                  symptomReport: { ...sr, diagnosisSearchDuration },
                })
              }
            />
            <div className="flex flex-col gap-2">
              <Label className={fl}>
                ¿Le han informado algún diagnóstico?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                items={YES_NO_OPTIONS}
                value={
                  sr.hasReceivedDiagnosis === true
                    ? "Sí"
                    : sr.hasReceivedDiagnosis === false
                      ? "No"
                      : ""
                }
                onValueChange={(value) =>
                  updateDraft({
                    symptomReport: {
                      ...sr,
                      hasReceivedDiagnosis: value === "Sí",
                      reportedDiagnosis:
                        value === "Sí" ? sr.reportedDiagnosis : null,
                    },
                  })
                }
              >
                <SelectTrigger className={sc}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sí">Sí</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sr.hasReceivedDiagnosis === true && (
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Diagnóstico informado{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={sr.reportedDiagnosis ?? ""}
                  onChange={(e) =>
                    updateDraft({
                      symptomReport: {
                        ...sr,
                        reportedDiagnosis: e.target.value || null,
                      },
                    })
                  }
                  placeholder="Escriba el diagnóstico informado"
                  className="bg-card border"
                />
                <p className="text-muted-foreground text-xs">
                  Este dato es preliminar y no crea un diagnóstico oncológico
                  formal.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  ¿Cuándo es su siguiente consulta médica?
                </Label>
                <Input
                  type="date"
                  value={appointment.nextAppointmentDate ?? ""}
                  min={appointment.appointmentDate ?? undefined}
                  onChange={(e) =>
                    updateAppointment({
                      nextAppointmentDate: e.target.value || null,
                    })
                  }
                  className="bg-card border"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Especialidad de la siguiente consulta
                </Label>
                <Input
                  value={appointment.nextAppointmentSpecialty ?? ""}
                  onChange={(e) =>
                    updateAppointment({
                      nextAppointmentSpecialty: e.target.value || null,
                    })
                  }
                  placeholder="Ej: Oncología"
                  className="bg-card border"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className={fl}>
                ¿Actualmente recibe el tratamiento que le informaron?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                items={YES_NO_OPTIONS}
                value={
                  sr.isReceivingReportedTreatment === true
                    ? "Sí"
                    : sr.isReceivingReportedTreatment === false
                      ? "No"
                      : ""
                }
                onValueChange={(value) =>
                  updateDraft({
                    symptomReport: {
                      ...sr,
                      isReceivingReportedTreatment: value === "Sí",
                      ...(value === "Sí"
                        ? { notReceivingTreatmentReason: null }
                        : {
                            reportedTreatment: null,
                            reportedTreatmentFrequency: undefined,
                          }),
                    },
                  })
                }
              >
                <SelectTrigger className={sc}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sí">Sí</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sr.isReceivingReportedTreatment === true && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label className={fl}>
                    Tratamiento informado{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={sr.reportedTreatment ?? ""}
                    onChange={(e) =>
                      updateDraft({
                        symptomReport: {
                          ...sr,
                          reportedTreatment: e.target.value || null,
                        },
                      })
                    }
                    placeholder="Ej: Quimioterapia"
                    className="bg-card border"
                  />
                </div>
                <DurationInput
                  label="Frecuencia del tratamiento informado"
                  units={["DAY", "WEEK", "MONTH", "YEAR"]}
                  defaultUnit="WEEK"
                  singleValue
                  value={sr.reportedTreatmentFrequency}
                  onChange={(reportedTreatmentFrequency) =>
                    updateDraft({
                      symptomReport: { ...sr, reportedTreatmentFrequency },
                    })
                  }
                />
              </div>
            )}
            {sr.isReceivingReportedTreatment === false && (
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Motivo por el que no recibe tratamiento{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={sr.notReceivingTreatmentReason ?? ""}
                  onChange={(e) =>
                    updateDraft({
                      symptomReport: {
                        ...sr,
                        notReceivingTreatmentReason: e.target.value || null,
                      },
                    })
                  }
                  placeholder="Explique el motivo"
                  className="bg-card min-h-20 border"
                />
              </div>
            )}
          </section>
        )}

        {esDx && (
          <>
            <section className="flex flex-col gap-5">
              <SectionHeader
                icon={Stethoscope}
                title="Diagnóstico Oncológico"
              />
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      Diagnósticos registrados
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Registra uno o varios diagnósticos. Cada tratamiento se
                      asociará a uno de ellos.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={addDiagnosis}
                  >
                    <Plus className="size-3.5" />
                    Agregar diagnóstico
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {diagnoses.map((diagnosis, index) => {
                    const hasTreatments = treatments.some(
                      (treatment) =>
                        treatment.diagnosisRef === diagnosis.draftId,
                    )
                    return (
                      <div
                        key={diagnosis.draftId}
                        className={`flex items-center gap-2 rounded-lg border p-2 ${
                          index === diagnosisIndex
                            ? "border-primary bg-primary/5"
                            : "border-border/60 bg-muted/20"
                        }`}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto min-w-0 flex-1 justify-start px-2 py-1.5 text-left"
                          aria-pressed={index === diagnosisIndex}
                          onClick={() => setSelectedDiagnosisIndex(index)}
                        >
                          <span className="flex min-w-0 flex-col items-start">
                            <span className="text-xs font-semibold">
                              Diagnóstico {index + 1}
                            </span>
                            <span className="text-muted-foreground w-full truncate text-xs">
                              {diagnosis.diagnosis.trim() || "Sin especificar"}
                            </span>
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground/60 hover:text-destructive h-7 w-7 shrink-0 p-0"
                          disabled={diagnoses.length === 1 || hasTreatments}
                          title={
                            hasTreatments
                              ? "Reasigna o elimina los tratamientos antes de eliminar este diagnóstico"
                              : diagnoses.length === 1
                                ? "Debe existir al menos un diagnóstico"
                                : "Eliminar diagnóstico"
                          }
                          onClick={() => removeDiagnosis(index)}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label className={flGrid}>
                    ¿Cuál es su diagnóstico oncológico?{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    items={[
                      ...DIAGNOSIS_OPTIONS.map((value) => ({
                        value,
                        label: value,
                      })),
                      { value: OTHER_VALUE, label: "Otro (especificar)" },
                    ]}
                    value={diagnosisSelectValue}
                    onValueChange={(v) => {
                      if (!v) return
                      if (v === OTHER_VALUE) {
                        setOtherDiagnosisIds((previous) =>
                          new Set(previous).add(dx.draftId),
                        )
                        updateDiagnosis({ diagnosis: "" })
                      } else {
                        setOtherDiagnosisIds((previous) => {
                          const next = new Set(previous)
                          next.delete(dx.draftId)
                          return next
                        })
                        updateDiagnosis({ diagnosis: v })
                      }
                    }}
                  >
                    <SelectTrigger className={sc}>
                      <SelectValue placeholder="Seleccionar tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAGNOSIS_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value={OTHER_VALUE}>
                        Otro (especificar)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className={flGrid}>
                    ¿Conoce el estadio del diagnóstico? (1, 2, 3, 4 o desconoce)
                  </Label>
                  <Select
                    items={Object.entries(stageLabels).map(
                      ([value, label]) => ({
                        value,
                        label,
                      }),
                    )}
                    value={dx.cancerStage ?? ""}
                    onValueChange={(v) =>
                      updateDiagnosis({
                        cancerStage: (v as CancerStage) || null,
                      })
                    }
                  >
                    <SelectTrigger className={sc}>
                      <SelectValue placeholder="Estadio" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(stageLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {isOtherDiagnosis && (
                <div className="flex flex-col gap-2">
                  <Label className={fl}>Especifique el diagnóstico</Label>
                  <Input
                    value={dx.diagnosis}
                    onChange={(e) =>
                      updateDiagnosis({ diagnosis: e.target.value })
                    }
                    placeholder="Describa el diagnóstico oncológico..."
                    className="bg-card border"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  ¿Qué síntoma lo llevó a realizarse su chequeo médico?
                </Label>
                <Textarea
                  value={dx.symptomLeadingToCheckup ?? ""}
                  onChange={(e) =>
                    updateDiagnosis({
                      symptomLeadingToCheckup: e.target.value || null,
                    })
                  }
                  placeholder="Motivo o síntoma principal"
                  className="bg-card min-h-20 border"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label className={flGrid}>¿Cuándo fue diagnosticado?</Label>
                  <Input
                    type="date"
                    value={dx.diagnosisDate ?? ""}
                    onChange={(e) =>
                      updateDiagnosisDate("diagnosisDate", e.target.value)
                    }
                    className="bg-card border"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {historical ? (
                    <>
                      <Label className={flGrid}>
                        ¿No recuerda la fecha de los primeros síntomas?
                      </Label>
                      <Select
                        items={YES_NO_OPTIONS}
                        value={
                          dx.firstSymptomsDateUnknown === true
                            ? "Sí"
                            : dx.firstSymptomsDateUnknown === false
                              ? "No"
                              : ""
                        }
                        onValueChange={updateFirstSymptomsUnknown}
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
                      {dx.firstSymptomsDateUnknown !== true && (
                        <Input
                          type="date"
                          value={dx.firstSymptomsDate ?? ""}
                          onChange={(e) =>
                            updateDiagnosisDate(
                              "firstSymptomsDate",
                              e.target.value,
                            )
                          }
                          className="bg-card border"
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <Label className={flGrid}>
                        ¿Cuándo aparecieron los primeros síntomas?
                      </Label>
                      <Input
                        type="date"
                        value={dx.firstSymptomsDate ?? ""}
                        onChange={(e) =>
                          updateDiagnosisDate(
                            "firstSymptomsDate",
                            e.target.value,
                          )
                        }
                        className="bg-card border"
                      />
                    </>
                  )}
                </div>
              </div>
              {dx.firstSymptomsDate && dx.diagnosisDate && (
                <p className="text-muted-foreground text-xs">
                  {calculatedWaitTime
                    ? dx.waitTimeForDiagnosisManuallyEdited
                      ? "Tiempo ajustado manualmente. Puedes cambiarlo cuando quieras."
                      : "Tiempo calculado automáticamente a partir de las fechas. Puedes editarlo."
                    : "Las fechas deben estar en orden para calcular el tiempo de espera."}
                </p>
              )}
              <DurationInput
                label="Tiempo de espera para el diagnóstico"
                units={["DAY", "WEEK", "MONTH", "YEAR"]}
                defaultUnit="DAY"
                singleValue
                value={visibleWaitTime}
                onChange={(waitTimeForDiagnosis) =>
                  updateDiagnosis({
                    waitTimeForDiagnosis,
                    waitTimeForDiagnosisManuallyEdited:
                      waitTimeForDiagnosis !== undefined,
                  })
                }
              />
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className={flGrid}>¿Dónde fue diagnosticado?</Label>
                  <div className="flex gap-2">
                    <Select
                      items={activeCenters.map((c) => ({
                        value: c.id,
                        label: `${c.name} — ${c.department}`,
                      }))}
                      value={dx.healthCenterId ?? ""}
                      onValueChange={(v) =>
                        updateDiagnosis({ healthCenterId: v || null })
                      }
                    >
                      <SelectTrigger className="bg-card flex-1 border">
                        <SelectValue placeholder="Seleccionar establecimiento..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeCenters.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} — {c.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1"
                      onClick={() => openNewHospital("diagnosis")}
                    >
                      <Building2 className="size-3.5" />
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className={fl}>
                    ¿Qué especialidad lo diagnosticó?
                  </Label>
                  <Input
                    value={dx.diagnosisSpecialty ?? ""}
                    onChange={(e) =>
                      updateDiagnosis({
                        diagnosisSpecialty: e.target.value || null,
                      })
                    }
                    placeholder="Especialidad"
                    className="bg-card border"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label className={flGrid}>
                      Luego de su atención en el centro donde fue diagnosticado,
                      ¿a qué centro de salud fue derivado?
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        items={activeCenters.map((center) => ({
                          value: center.id,
                          label: `${center.name} — ${center.department}`,
                        }))}
                        value={dx.referredHealthCenterId ?? ""}
                        onValueChange={(value) =>
                          updateDiagnosis({
                            referredHealthCenterId: value || null,
                          })
                        }
                      >
                        <SelectTrigger className="bg-card flex-1 border">
                          <SelectValue placeholder="Seleccionar establecimiento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {activeCenters.map((center) => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.name} — {center.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1"
                        onClick={() => openNewHospital("referred")}
                      >
                        <Building2 className="size-3.5" />
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className={flGrid}>
                      ¿Cuenta con referencia a los centros de salud mencionados?
                    </Label>
                    <Select
                      items={YES_NO_OPTIONS}
                      value={
                        dx.hasReferral === true
                          ? "Sí"
                          : dx.hasReferral === false
                            ? "No"
                            : ""
                      }
                      onValueChange={(value) =>
                        updateDiagnosis({
                          hasReferral:
                            value === "Sí"
                              ? true
                              : value === "No"
                                ? false
                                : null,
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
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  ¿Cuenta con informe médico de respaldo?
                </Label>
                <Select
                  items={YES_NO_OPTIONS}
                  value={
                    dx.hasMedicalReport === true
                      ? "Sí"
                      : dx.hasMedicalReport === false
                        ? "No"
                        : ""
                  }
                  onValueChange={(v) =>
                    updateDiagnosis({ hasMedicalReport: v === "Sí" })
                  }
                >
                  <SelectTrigger className={sc}>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sí">Sí</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="flex flex-col gap-5">
              <SectionHeader icon={Activity} title="Consultas Médicas" />
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  ¿Actualmente asiste a sus consultas médicas?
                  <span className="text-destructive"> *</span>
                </Label>
                <Select
                  items={YES_NO_OPTIONS}
                  value={
                    meta.currentlyAttendingConsultations === true
                      ? "Sí"
                      : meta.currentlyAttendingConsultations === false
                        ? "No"
                        : ""
                  }
                  onValueChange={(v) => {
                    const attends = v === "Sí"
                    updateDraft({
                      enrollmentMetadata: {
                        ...meta,
                        currentlyAttendingConsultations: attends,
                        notAttendingConsultationsNote: attends
                          ? null
                          : meta.notAttendingConsultationsNote,
                      },
                    })
                    if (!attends) clearAppointment()
                    else updateAppointment({})
                  }}
                >
                  <SelectTrigger className={sc}>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sí">Sí</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {meta.currentlyAttendingConsultations && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label className={fl}>
                      Establecimiento de las consultas médicas
                      <span className="text-destructive"> *</span>
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        items={activeCenters.map((center) => ({
                          value: center.id,
                          label: `${center.name} — ${center.department}`,
                        }))}
                        value={appointment.healthCenterId ?? ""}
                        onValueChange={(value) =>
                          updateAppointment({ healthCenterId: value || null })
                        }
                      >
                        <SelectTrigger className="bg-card flex-1 border">
                          <SelectValue placeholder="Seleccionar establecimiento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {activeCenters.map((center) => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.name} — {center.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1"
                        onClick={() => openNewHospital("appointment")}
                      >
                        <Building2 className="size-3.5" />
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label className={flGrid}>
                        Si asiste: ¿cuándo fue su última consulta?
                      </Label>
                      <Input
                        type="date"
                        value={appointment.appointmentDate ?? ""}
                        onChange={(e) =>
                          updateAppointment({
                            appointmentDate: e.target.value || null,
                          })
                        }
                        className="bg-card border"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className={flGrid}>
                        Especialidad de la consulta
                      </Label>
                      <Input
                        value={appointment.specialty ?? ""}
                        onChange={(e) =>
                          updateAppointment({
                            specialty: e.target.value || null,
                          })
                        }
                        placeholder="Especialidad"
                        className="bg-card border"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label className={fl}>
                        ¿Cuándo es su siguiente consulta?
                      </Label>
                      <Input
                        type="date"
                        value={appointment.nextAppointmentDate ?? ""}
                        onChange={(e) =>
                          updateAppointment({
                            nextAppointmentDate: e.target.value || null,
                          })
                        }
                        className="bg-card border"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className={fl}>
                        Especialidad de la siguiente consulta
                      </Label>
                      <Input
                        value={appointment.nextAppointmentSpecialty ?? ""}
                        onChange={(e) =>
                          updateAppointment({
                            nextAppointmentSpecialty: e.target.value || null,
                          })
                        }
                        placeholder="Ej: Oncología"
                        className="bg-card border"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className={fl}>
                      ¿Tiene alguna dificultad para sus consultas médicas?
                    </Label>
                    <Textarea
                      value={appointment.difficulties ?? ""}
                      onChange={(e) =>
                        updateAppointment({
                          difficulties: e.target.value || null,
                        })
                      }
                      placeholder="Detalle de barreras o dificultades"
                      className="bg-card min-h-20 border"
                    />
                  </div>
                </>
              )}
              {meta.currentlyAttendingConsultations === false && (
                <div className="flex flex-col gap-2">
                  <Label className={fl}>
                    Notas sobre la no asistencia a consultas médicas
                    <span className="text-destructive"> *</span>
                  </Label>
                  <Textarea
                    value={meta.notAttendingConsultationsNote ?? ""}
                    onChange={(event) =>
                      updateDraft({
                        enrollmentMetadata: {
                          ...meta,
                          notAttendingConsultationsNote:
                            event.target.value || null,
                        },
                      })
                    }
                    placeholder="Explique por qué no asiste a sus consultas"
                    className="bg-card min-h-20 border"
                  />
                </div>
              )}
            </section>

            <section className="flex flex-col gap-5">
              <SectionHeader icon={HeartPulse} title="Tratamiento actual" />
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Actualmente, ¿está recibiendo algún tratamiento médico?
                  <span className="text-destructive"> *</span>
                </Label>
                <Select
                  items={YES_NO_OPTIONS}
                  value={
                    meta.currentlyReceivingTreatment === true
                      ? "Sí"
                      : meta.currentlyReceivingTreatment === false
                        ? "No"
                        : ""
                  }
                  onValueChange={(value) => {
                    const receiving = value === "Sí"
                    updateDraft({
                      enrollmentMetadata: {
                        ...meta,
                        currentlyReceivingTreatment: receiving,
                        notReceivingTreatmentReason: receiving
                          ? null
                          : meta.notReceivingTreatmentReason,
                      },
                    })
                  }}
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
              {meta.currentlyReceivingTreatment === false && (
                <div className="flex flex-col gap-2">
                  <Label className={fl}>
                    ¿Cuál es el motivo?
                    <span className="text-destructive"> *</span>
                  </Label>
                  <Textarea
                    value={meta.notReceivingTreatmentReason ?? ""}
                    onChange={(event) =>
                      updateDraft({
                        enrollmentMetadata: {
                          ...meta,
                          notReceivingTreatmentReason:
                            event.target.value || null,
                        },
                      })
                    }
                    placeholder="Explique el motivo"
                    className="bg-card min-h-20 border"
                  />
                </div>
              )}
            </section>

            {meta.currentlyReceivingTreatment !== false && (
              <section className="flex flex-col gap-5">
                <SectionHeader icon={HeartPulse} title="Tratamientos" />
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        Tratamientos registrados
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Opcional. Puedes registrar varios tratamientos y asociar
                        cada uno a un diagnóstico.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={addTreatment}
                      disabled={!diagnoses.length}
                    >
                      <Plus className="size-3.5" />
                      Agregar tratamiento
                    </Button>
                  </div>
                  {treatments.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {treatments.map((treatment, index) => {
                        const diagnosis = diagnoses.find(
                          (item) => item.draftId === treatment.diagnosisRef,
                        )
                        return (
                          <div
                            key={treatment.draftId}
                            className={`flex items-center gap-2 rounded-lg border p-2 ${
                              index === treatmentIndex
                                ? "border-primary bg-primary/5"
                                : "border-border/60 bg-muted/20"
                            }`}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-auto min-w-0 flex-1 justify-start px-2 py-1.5 text-left"
                              aria-pressed={index === treatmentIndex}
                              onClick={() => setSelectedTreatmentIndex(index)}
                            >
                              <span className="flex min-w-0 flex-col items-start">
                                <span className="text-xs font-semibold">
                                  Tratamiento {index + 1}
                                </span>
                                <span className="text-muted-foreground w-full truncate text-xs">
                                  {treatment.treatmentType.trim() ||
                                    "Sin especificar"}
                                  {diagnosis
                                    ? ` · ${diagnosis.diagnosis.trim() || `Diagnóstico ${diagnoses.indexOf(diagnosis) + 1}`}`
                                    : " · Sin diagnóstico"}
                                </span>
                              </span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground/60 hover:text-destructive h-7 w-7 shrink-0 p-0"
                              title="Eliminar tratamiento"
                              onClick={() => removeTreatment(index)}
                            >
                              <Minus className="size-3.5" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                {selectedTreatment ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label className={fl}>
                        Diagnóstico asociado{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        items={diagnoses.map((diagnosis, index) => ({
                          value: diagnosis.draftId,
                          label:
                            diagnosis.diagnosis.trim() ||
                            `Diagnóstico ${index + 1}`,
                        }))}
                        value={tx.diagnosisRef}
                        onValueChange={(value) =>
                          updateTreatment({ diagnosisRef: value ?? "" })
                        }
                      >
                        <SelectTrigger className={sc}>
                          <SelectValue placeholder="Seleccionar diagnóstico..." />
                        </SelectTrigger>
                        <SelectContent>
                          {diagnoses.map((diagnosis, index) => (
                            <SelectItem
                              key={diagnosis.draftId}
                              value={diagnosis.draftId}
                            >
                              {diagnosis.diagnosis.trim() ||
                                `Diagnóstico ${index + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className={fl}>
                        ¿Recibe este tratamiento por derivación?
                      </Label>
                      <Select
                        items={YES_NO_OPTIONS}
                        value={tx.isReferred === true ? "Sí" : "No"}
                        onValueChange={(v) => {
                          const isReferred = v === "Sí"
                          updateTreatment({
                            isReferred,
                            sourceHealthCenterId: isReferred
                              ? (tx.sourceHealthCenterId ??
                                details.primaryHealthCenterId ??
                                undefined)
                              : undefined,
                          })
                        }}
                      >
                        <SelectTrigger className={sc}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sí">Sí</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {tx.isReferred ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <Label className={flGrid}>
                            Hospital de origen{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <div className="flex gap-2">
                            <Select
                              items={activeCenters.map((c) => ({
                                value: c.id,
                                label: `${c.name} — ${c.department}`,
                              }))}
                              value={tx.sourceHealthCenterId ?? ""}
                              onValueChange={(v) =>
                                updateTreatment({
                                  sourceHealthCenterId: v || undefined,
                                })
                              }
                            >
                              <SelectTrigger className="bg-card flex-1 border">
                                <SelectValue placeholder="Seleccionar origen..." />
                              </SelectTrigger>
                              <SelectContent>
                                {activeCenters.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name} — {c.department}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0 gap-1"
                              onClick={() =>
                                openNewHospital("treatment-source")
                              }
                            >
                              <Building2 className="size-3.5" />
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className={flGrid}>
                            Hospital receptor{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <div className="flex gap-2">
                            <Select
                              items={activeCenters.map((c) => ({
                                value: c.id,
                                label: `${c.name} — ${c.department}`,
                              }))}
                              value={tx.receivingHealthCenterId ?? ""}
                              onValueChange={(v) =>
                                updateTreatment({
                                  receivingHealthCenterId: v || undefined,
                                })
                              }
                            >
                              <SelectTrigger className="bg-card flex-1 border">
                                <SelectValue placeholder="Seleccionar receptor..." />
                              </SelectTrigger>
                              <SelectContent>
                                {activeCenters.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name} — {c.department}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0 gap-1"
                              onClick={() =>
                                openNewHospital("treatment-receiving")
                              }
                            >
                              <Building2 className="size-3.5" />
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Label className={fl}>
                          Hospital donde recibe el tratamiento
                        </Label>
                        <div className="flex gap-2">
                          <Select
                            items={activeCenters.map((c) => ({
                              value: c.id,
                              label: `${c.name} — ${c.department}`,
                            }))}
                            value={tx.receivingHealthCenterId ?? ""}
                            onValueChange={(v) =>
                              updateTreatment({
                                receivingHealthCenterId: v || undefined,
                              })
                            }
                          >
                            <SelectTrigger className="bg-card flex-1 border">
                              <SelectValue placeholder="Opcional" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeCenters.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name} — {c.department}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 gap-1"
                            onClick={() =>
                              openNewHospital("treatment-receiving")
                            }
                          >
                            <Building2 className="size-3.5" />
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label className={flGrid}>
                          Situación del tratamiento
                        </Label>
                        <Select
                          items={TREATMENT_SITUATIONS}
                          value={tx.treatmentSituation ?? ""}
                          onValueChange={(v) =>
                            updateTreatment({
                              treatmentSituation: (v || undefined) as
                                | TreatmentSituation
                                | undefined,
                            })
                          }
                        >
                          <SelectTrigger className={sc}>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {TREATMENT_SITUATIONS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label className={flGrid}>
                          ¿Qué tipo de tratamiento recibe?
                        </Label>
                        <Input
                          value={tx.treatmentType}
                          onChange={(e) =>
                            updateTreatment({ treatmentType: e.target.value })
                          }
                          placeholder="Ej: Quimioterapia"
                          className="bg-card border"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className={flGrid}>¿Es una operación?</Label>
                        <Select
                          items={YES_NO_OPTIONS}
                          value={
                            (tx.isOperation ?? Boolean(tx.operationName)) ===
                            true
                              ? "Sí"
                              : (tx.isOperation ??
                                    Boolean(tx.operationName)) === false
                                ? "No"
                                : ""
                          }
                          onValueChange={(value) =>
                            updateTreatment({
                              isOperation: value === "Sí",
                              operationName:
                                value === "Sí" ? tx.operationName : null,
                            })
                          }
                        >
                          <SelectTrigger className={sc}>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {YES_NO_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {(tx.isOperation ?? Boolean(tx.operationName)) && (
                        <div className="flex flex-col gap-2">
                          <Label className={flGrid}>
                            Nombre de la operación
                          </Label>
                          <Input
                            value={tx.operationName ?? ""}
                            onChange={(e) =>
                              updateTreatment({
                                operationName: e.target.value || null,
                              })
                            }
                            placeholder="Ej: Mastectomía"
                            className="bg-card border"
                          />
                        </div>
                      )}
                      <DurationInput
                        label="Frecuencia del tratamiento"
                        units={["DAY", "WEEK", "MONTH", "YEAR"]}
                        defaultUnit="WEEK"
                        singleValue
                        value={tx.treatmentFrequency}
                        onChange={(treatmentFrequency) =>
                          updateTreatment({ treatmentFrequency })
                        }
                      />
                      <div className="flex flex-col gap-2">
                        <Label className={flGrid}>Fecha de inicio</Label>
                        <Input
                          type="date"
                          value={tx.startDate ?? ""}
                          onChange={(e) =>
                            updateTreatment({
                              startDate: e.target.value || null,
                            })
                          }
                          className="bg-card border"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className={flGrid}>
                          Fecha de fin (opcional)
                        </Label>
                        <Input
                          type="date"
                          value={tx.endDate ?? ""}
                          min={tx.startDate ?? undefined}
                          onChange={(e) =>
                            updateTreatment({ endDate: e.target.value || null })
                          }
                          className="bg-card border"
                        />
                      </div>
                      {tx.treatmentSituation === "ABANDONED" && (
                        <div className="flex flex-col gap-2 md:col-span-2">
                          <Label className={flGrid}>Motivo de abandono</Label>
                          <Textarea
                            value={tx.treatmentAbandonmentReason ?? ""}
                            onChange={(e) =>
                              updateTreatment({
                                treatmentAbandonmentReason:
                                  e.target.value || null,
                              })
                            }
                            placeholder="Describe el motivo del abandono"
                            className="bg-card min-h-16 border"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            Medicamentos actuales
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Registra la medicación asociada al tratamiento. La
                            frecuencia usa la misma estructura de duración.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-1.5"
                          onClick={addMedication}
                        >
                          <Plus className="size-3.5" />
                          Agregar
                        </Button>
                      </div>
                      {medications.map((medication, index) => (
                        <div
                          key={`${tx.draftId}-${index}`}
                          className="border-border/60 bg-muted/20 flex flex-col gap-4 rounded-xl border p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-muted-foreground text-xs font-semibold">
                              Medicamento {index + 1}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground/60 hover:text-destructive h-7 w-7 p-0"
                              onClick={() => removeMedication(index)}
                            >
                              <Minus className="size-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                              <Label className={flGrid}>
                                Nombre{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                value={medication.name}
                                onChange={(e) =>
                                  updateMedication(index, {
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Ej: Tamoxifeno"
                                className="bg-card border"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label className={flGrid}>
                                Descripción de dosis
                              </Label>
                              <Input
                                value={medication.doseDescription ?? ""}
                                onChange={(e) =>
                                  updateMedication(index, {
                                    doseDescription:
                                      e.target.value || undefined,
                                  })
                                }
                                placeholder="Ej: 2 tabletas"
                                className="bg-card border"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-2">
                                <Label className={flGrid}>Cantidad</Label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  defaultValue={medication.doseAmount ?? ""}
                                  onBlur={(e) => {
                                    const raw = e.target.value
                                      .trim()
                                      .replace(",", ".")
                                    if (!raw) {
                                      updateMedication(index, {
                                        doseAmount: undefined,
                                      })
                                      return
                                    }
                                    const parsed = Number(raw)
                                    if (
                                      !Number.isFinite(parsed) ||
                                      parsed < 0
                                    ) {
                                      e.currentTarget.value =
                                        medication.doseAmount?.toString() ?? ""
                                      return
                                    }
                                    updateMedication(index, {
                                      doseAmount: parsed,
                                    })
                                  }}
                                  className="bg-card border"
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <Label className={flGrid}>Unidad</Label>
                                <Select
                                  items={DOSE_UNITS}
                                  value={medication.doseUnit ?? ""}
                                  onValueChange={(v) =>
                                    updateMedication(index, {
                                      doseUnit: (v || undefined) as
                                        | MedicationDoseUnit
                                        | undefined,
                                    })
                                  }
                                >
                                  <SelectTrigger className="bg-card border">
                                    <SelectValue placeholder="Unidad" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DOSE_UNITS.map((unit) => (
                                      <SelectItem
                                        key={unit.value}
                                        value={unit.value}
                                      >
                                        {unit.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label className={flGrid}>
                                Vía de administración
                              </Label>
                              <Select
                                items={MEDICATION_ROUTES}
                                value={medication.route ?? ""}
                                onValueChange={(v) =>
                                  updateMedication(index, {
                                    route: (v || undefined) as
                                      | MedicationRoute
                                      | undefined,
                                  })
                                }
                              >
                                <SelectTrigger className="bg-card border">
                                  <SelectValue placeholder="Seleccionar vía" />
                                </SelectTrigger>
                                <SelectContent>
                                  {MEDICATION_ROUTES.map((route) => (
                                    <SelectItem
                                      key={route.value}
                                      value={route.value}
                                    >
                                      {route.label}
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
                            <div className="flex flex-col gap-2">
                              <Label className={flGrid}>Fecha de inicio</Label>
                              <Input
                                type="date"
                                value={medication.startDate ?? ""}
                                onChange={(e) =>
                                  updateMedication(index, {
                                    startDate: e.target.value || undefined,
                                  })
                                }
                                className="bg-card border"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label className={flGrid}>Fecha de fin</Label>
                              <Input
                                type="date"
                                value={medication.endDate ?? ""}
                                onChange={(e) =>
                                  updateMedication(index, {
                                    endDate: e.target.value || undefined,
                                  })
                                }
                                className="bg-card border"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label className={fl}>Notas</Label>
                            <Textarea
                              value={medication.notes ?? ""}
                              onChange={(e) =>
                                updateMedication(index, {
                                  notes: e.target.value || undefined,
                                })
                              }
                              placeholder="Indicaciones o notas adicionales"
                              className="bg-card min-h-16 border"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                    No hay tratamientos registrados. Agrega uno si corresponde.
                  </p>
                )}
              </section>
            )}
          </>
        )}

        <section className="flex flex-col gap-5">
          <SectionHeader icon={Users} title="Servicios de Apoyo" />
          {esDx && meta.affiliationType === "PATIENT" && (
            <div className="border-border/60 bg-muted/20 flex flex-col gap-5 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <HeartHandshake className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Psicooncología</p>
                    <p className="text-muted-foreground text-xs">
                      Preguntas opcionales para conocer las necesidades de
                      soporte emocional del paciente.
                    </p>
                  </div>
                </div>
                {hasPsychooncologySupportResponse && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground shrink-0"
                    onClick={() =>
                      updateDraft({ psychooncologySupportAssessment: {} })
                    }
                  >
                    Limpiar
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  ¿En las últimas 2 semanas ha experimentado preocupaciones
                  excesivas sobre su enfermedad?
                </Label>
                <Select
                  items={YES_NO_OPTIONS}
                  value={
                    psychooncologySupport.excessiveWorry === true
                      ? "Sí"
                      : psychooncologySupport.excessiveWorry === false
                        ? "No"
                        : ""
                  }
                  onValueChange={(v) =>
                    updateDraft({
                      psychooncologySupportAssessment: {
                        ...psychooncologySupport,
                        excessiveWorry:
                          v === "Sí" ? true : v === "No" ? false : undefined,
                      },
                    })
                  }
                >
                  <SelectTrigger className={sc}>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sí">Sí</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3">
                <div className="space-y-1">
                  <Label className={fl}>Termómetro de Malestar Emocional</Label>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Del 1 al 10, indique cuál es su malestar emocional, siendo 1
                    la menor puntuación y 10 la mayor.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 10 }, (_, index) => index + 1).map(
                    (score) => (
                      <Button
                        key={score}
                        type="button"
                        size="sm"
                        variant={
                          psychooncologySupport.emotionalDistressScore === score
                            ? "default"
                            : "outline"
                        }
                        className="size-9 p-0"
                        aria-label={`Nivel de malestar ${score} de 10`}
                        aria-pressed={
                          psychooncologySupport.emotionalDistressScore === score
                        }
                        onClick={() =>
                          updateDraft({
                            psychooncologySupportAssessment: {
                              ...psychooncologySupport,
                              emotionalDistressScore:
                                psychooncologySupport.emotionalDistressScore ===
                                score
                                  ? undefined
                                  : score,
                            },
                          })
                        }
                      >
                        {score}
                      </Button>
                    ),
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Para la consulta de soporte emocional, ¿le gustaría que sea
                  por llamada telefónica o por videollamada
                  (WhatsApp/Zoom/Meet)?
                </Label>
                <Select
                  items={[
                    { value: "CALL", label: "Llamada telefónica" },
                    { value: "VIDEO_CALL", label: "Videollamada" },
                  ]}
                  value={psychooncologySupport.preferredModality ?? ""}
                  onValueChange={(preferredModality) =>
                    updateDraft({
                      psychooncologySupportAssessment: {
                        ...psychooncologySupport,
                        preferredModality:
                          preferredModality === "CALL" ||
                          preferredModality === "VIDEO_CALL"
                            ? preferredModality
                            : undefined,
                      },
                    })
                  }
                >
                  <SelectTrigger className={sc}>
                    <SelectValue placeholder="Seleccionar modalidad..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CALL">Llamada telefónica</SelectItem>
                    <SelectItem value="VIDEO_CALL">Videollamada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label className={fl}>
              ¿Familiares interesados en charlas de prevención del cáncer?
            </Label>
            <Select
              items={YES_NO_OPTIONS}
              value={showFamilyTalks ? "Sí" : "No"}
              onValueChange={(v) => {
                const show = v === "Sí"
                setShowFamilyTalks(show)
                if (show && ft.length === 0) addFamilyTalk()
                if (!show) updateDraft({ familyPreventionTalkInterests: [] })
              }}
            >
              <SelectTrigger className={sc}>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sí">Sí</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {showFamilyTalks &&
            ft.map((entry, idx) => (
              <div
                key={idx}
                className="border-border/60 bg-muted/20 flex flex-col gap-3 rounded-xl border p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-xs font-semibold">
                    Familiar {idx + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground/60 hover:text-destructive h-7 w-7 p-0"
                    onClick={() => removeFamilyTalk(idx)}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className={fl}>Charla de prevención</Label>
                  <Select
                    items={[
                      ...TALK_TOPICS.map((value) => ({ value, label: value })),
                      { value: TALK_OTHER, label: "Otro (especificar)" },
                    ]}
                    value={
                      talkOtherIndices.has(idx)
                        ? TALK_OTHER
                        : entry.talkName || ""
                    }
                    onValueChange={(v) => {
                      if (!v) return
                      if (v === TALK_OTHER) {
                        setTalkOther(idx, true)
                        updateFamilyTalk(idx, "talkName", "")
                      } else {
                        setTalkOther(idx, false)
                        updateFamilyTalk(idx, "talkName", v)
                      }
                    }}
                  >
                    <SelectTrigger className={sc}>
                      <SelectValue placeholder="Seleccionar charla..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TALK_TOPICS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value={TALK_OTHER}>
                        Otro (especificar)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {talkOtherIndices.has(idx) && (
                    <Input
                      value={entry.talkName}
                      onChange={(e) =>
                        updateFamilyTalk(idx, "talkName", e.target.value)
                      }
                      placeholder="Especifique la charla de prevención..."
                      className="bg-card border"
                    />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label className={fl}>Nombre del familiar</Label>
                    <Input
                      value={entry.familyMemberName}
                      onChange={(e) =>
                        updateFamilyTalk(
                          idx,
                          "familyMemberName",
                          e.target.value,
                        )
                      }
                      placeholder="Ej: Rosa García"
                      className="bg-card border"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className={fl}>Teléfono</Label>
                    <Input
                      value={entry.familyMemberPhone}
                      onChange={(e) =>
                        updateFamilyTalk(
                          idx,
                          "familyMemberPhone",
                          e.target.value,
                        )
                      }
                      placeholder="999 000 777"
                      className="bg-card border"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className={fl}>Correo</Label>
                    <Input
                      value={entry.familyMemberEmail}
                      onChange={(e) =>
                        updateFamilyTalk(
                          idx,
                          "familyMemberEmail",
                          e.target.value,
                        )
                      }
                      placeholder="rosa@example.com"
                      className="bg-card border"
                    />
                  </div>
                </div>
              </div>
            ))}
          {showFamilyTalks && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 self-start"
              onClick={addFamilyTalk}
            >
              <Plus className="size-3.5" />
              Agregar familiar
            </Button>
          )}
        </section>

        {!tieneSeguroReal && (
          <section className="flex flex-col gap-5">
            <SectionHeader icon={HeartPulse} title="Afiliación SIS" />
            <div className="flex flex-col gap-2">
              <Label className={fl}>¿Puede afiliarse al SIS?</Label>
              <Select
                items={YES_NO_OPTIONS}
                value={
                  sis.canAffiliate === true
                    ? "Sí"
                    : sis.canAffiliate === false
                      ? "No"
                      : ""
                }
                onValueChange={(v) =>
                  updateDraft({
                    sisAffiliation: { ...sis, canAffiliate: v === "Sí" },
                  })
                }
              >
                <SelectTrigger className={sc}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sí">Sí</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sis.canAffiliate && (
              <div className="flex flex-col gap-2">
                <Label className={fl}>Fecha esperada de afiliación</Label>
                <Input
                  type="date"
                  value={sis.expectedDate ?? ""}
                  onChange={(e) =>
                    updateDraft({
                      sisAffiliation: {
                        ...sis,
                        expectedDate: e.target.value || null,
                      },
                    })
                  }
                  className="bg-card max-w-60 border"
                />
              </div>
            )}
            {!sis.canAffiliate && (
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Motivo por el que no puede afiliarse
                </Label>
                <Input
                  value={sis.cantAffiliateReason ?? ""}
                  onChange={(e) =>
                    updateDraft({
                      sisAffiliation: {
                        ...sis,
                        cantAffiliateReason: e.target.value || null,
                      },
                    })
                  }
                  placeholder="Motivo..."
                  className="bg-card border"
                />
              </div>
            )}
          </section>
        )}

        {!embedded && <StepNav currentStep={7} onPrev={prevStep} />}
      </StepContainer>

      <CreateHealthCenterDialog
        open={newHospitalOpen}
        onOpenChange={(open) => {
          setNewHospitalOpen(open)
          if (!open) setNewHospitalTarget(null)
        }}
        onCreated={handleNewHospitalCreated}
      />
    </>
  )
}
