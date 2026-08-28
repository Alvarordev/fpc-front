import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useEnrollmentStore } from "../../_store/enrollment-store"
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
  Building2,
  Plus,
  Users,
  Minus,
} from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"
import { healthCentersApi } from "@/api/health-centers"
import { CreateHealthCenterDialog } from "@/pages/hospitales/_components/create-health-center-dialog"
import { DurationInput } from "@/components/duration-input"
import { calculateDurationBetweenDates } from "@/types/duration"
import type {
  AddMedicalAppointmentRequest,
  AddTreatmentMedicationRequest,
  CareProgram,
  CancerStage,
  HealthBackgroundCause,
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

const TRI_STATE_OPTIONS = [
  { value: "SIN_DATO", label: "Sin dato" },
  { value: "SI", label: "Sí" },
  { value: "NO", label: "No" },
] as const

const CARE_PROGRAMS: Array<{ value: CareProgram; label: string }> = [
  { value: "COPHOES", label: "COPHOES" },
  { value: "PADOMI", label: "PADOMI" },
]

const HEALTH_BACKGROUND_CAUSES: Array<{
  value: HealthBackgroundCause
  label: string
}> = [
  { value: "DIAGNOSIS", label: "Diagnóstico" },
  { value: "TREATMENT", label: "Tratamiento" },
  { value: "NATURAL_CONDITION", label: "Condición natural" },
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

const EMPTY_APPOINTMENT: AddMedicalAppointmentRequest = {
  healthCenterId: null,
  specialty: null,
  appointmentDate: null,
  nextAppointmentDate: null,
  difficulties: null,
  hasReferralSheet: undefined,
  isFirstConsultation: false,
}

export function Step7Atencion() {
  const { draft, updateDraft, nextStep, prevStep, categoriaClinica } =
    useEnrollmentStore()
  const sr = draft.symptomReport
  const dx = draft.diagnosis
  const tx = draft.treatment
  const sis = draft.sisAffiliation
  const healthBackground = draft.healthBackgroundAssessment
  const details = draft.details
  const meta = draft.enrollmentMetadata
  const seguro = draft.insurance.insuranceType
  const tieneSeguroReal = seguro && seguro !== "NONE"
  const esSignos = categoriaClinica === "SIGNS_AND_SYMPTOMS"
  const esDx = categoriaClinica === "CANCER_DIAGNOSIS"
  const label = esSignos ? "Signos y Síntomas" : "Diagnóstico de Cáncer"

  const [newHospitalOpen, setNewHospitalOpen] = useState(false)

  const knownDiagnoses = DIAGNOSIS_OPTIONS as readonly string[]
  const [isOtherDiagnosis, setIsOtherDiagnosis] = useState(() => {
    const d = dx.diagnosis
    return !!d && !knownDiagnoses.includes(d)
  })
  const diagnosisSelectValue = isOtherDiagnosis
    ? OTHER_VALUE
    : dx.diagnosis && knownDiagnoses.includes(dx.diagnosis)
      ? dx.diagnosis
      : ""

  const medicalAppointments = draft.medicalAppointments ?? []
  const medications = tx.medications ?? []
  const activeComorbidities = healthBackground.activeComorbidities ?? []
  const limitations = healthBackground.limitations ?? []
  const familyCancerHistory = healthBackground.familyCancerHistory ?? []
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

  function clearAppointment() {
    updateDraft({ medicalAppointments: [] })
  }

  function updateDiagnosisDate(
    field: "diagnosisDate" | "firstSymptomsDate",
    date: string,
  ) {
    const nextDiagnosis = { ...dx, [field]: date || null }
    updateDraft({
      diagnosis: {
        ...nextDiagnosis,
        waitTimeForDiagnosis: calculateDurationBetweenDates(
          nextDiagnosis.firstSymptomsDate,
          nextDiagnosis.diagnosisDate,
        ),
        waitTimeForDiagnosisManuallyEdited: false,
      },
    })
  }

  function updateMedication(
    index: number,
    partial: Partial<AddTreatmentMedicationRequest>,
  ) {
    updateDraft({
      treatment: {
        ...tx,
        medications: medications.map((medication, medicationIndex) =>
          medicationIndex === index
            ? { ...medication, ...partial }
            : medication,
        ),
      },
    })
  }

  function addMedication() {
    updateDraft({
      treatment: {
        ...tx,
        medications: [...medications, { name: "", isActive: true }],
      },
    })
  }

  function removeMedication(index: number) {
    updateDraft({
      treatment: {
        ...tx,
        medications: medications.filter(
          (_, medicationIndex) => medicationIndex !== index,
        ),
      },
    })
  }

  function updateHealthBackground(partial: Partial<typeof healthBackground>) {
    updateDraft({
      healthBackgroundAssessment: { ...healthBackground, ...partial },
    })
  }

  function addActiveComorbidity() {
    updateHealthBackground({
      activeComorbidities: [...activeComorbidities, { conditionName: "" }],
    })
  }

  function updateActiveComorbidity(
    index: number,
    field: "conditionName" | "treatmentDescription" | "followUpSpecialty",
    value: string,
  ) {
    updateHealthBackground({
      activeComorbidities: activeComorbidities.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value || undefined } : item,
      ),
    })
  }

  function removeActiveComorbidity(index: number) {
    updateHealthBackground({
      activeComorbidities: activeComorbidities.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    })
  }

  function addLimitation() {
    updateHealthBackground({
      limitations: [...limitations, { description: "", cause: "DIAGNOSIS" }],
    })
  }

  function updateLimitation(
    index: number,
    partial: Partial<(typeof limitations)[number]>,
  ) {
    updateHealthBackground({
      limitations: limitations.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...partial } : item,
      ),
    })
  }

  function removeLimitation(index: number) {
    updateHealthBackground({
      limitations: limitations.filter((_, itemIndex) => itemIndex !== index),
    })
  }

  function addFamilyCancerHistory() {
    updateHealthBackground({
      familyCancerHistory: [...familyCancerHistory, { relationship: "" }],
    })
  }

  function updateFamilyCancerHistory(
    index: number,
    field: "relationship" | "cancerType",
    value: string,
  ) {
    updateHealthBackground({
      familyCancerHistory: familyCancerHistory.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value || undefined } : item,
      ),
    })
  }

  function removeFamilyCancerHistory(index: number) {
    updateHealthBackground({
      familyCancerHistory: familyCancerHistory.filter(
        (_, itemIndex) => itemIndex !== index,
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
    <form
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
                    checkupMotivation: v === "Sí" ? null : sr.checkupMotivation,
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
                          consultationNotObtainedReason: e.target.value || null,
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    <div className="flex flex-col gap-2">
                      <Label className={fl}>Próxima consulta</Label>
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
                                value === "Sí" ? appointment.referredTo : null,
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
                            value={appointment.referralNotProvidedReason ?? ""}
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
            <SectionHeader icon={Stethoscope} title="Diagnóstico Oncológico" />
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
                      setIsOtherDiagnosis(true)
                      updateDraft({ diagnosis: { ...dx, diagnosis: "" } })
                    } else {
                      setIsOtherDiagnosis(false)
                      updateDraft({ diagnosis: { ...dx, diagnosis: v } })
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
                  items={Object.entries(stageLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  value={dx.cancerStage ?? ""}
                  onValueChange={(v) =>
                    updateDraft({
                      diagnosis: {
                        ...dx,
                        cancerStage: (v as CancerStage) || null,
                      },
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
                    updateDraft({
                      diagnosis: { ...dx, diagnosis: e.target.value },
                    })
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
                  updateDraft({
                    diagnosis: {
                      ...dx,
                      symptomLeadingToCheckup: e.target.value || null,
                    },
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
                <Label className={flGrid}>
                  ¿Cuándo aparecieron los primeros síntomas?
                </Label>
                <Input
                  type="date"
                  value={dx.firstSymptomsDate ?? ""}
                  onChange={(e) =>
                    updateDiagnosisDate("firstSymptomsDate", e.target.value)
                  }
                  className="bg-card border"
                />
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
                updateDraft({
                  diagnosis: {
                    ...dx,
                    waitTimeForDiagnosis,
                    waitTimeForDiagnosisManuallyEdited:
                      waitTimeForDiagnosis !== undefined,
                  },
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
                      updateDraft({
                        diagnosis: { ...dx, healthCenterId: v || null },
                      })
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
                    onClick={() => setNewHospitalOpen(true)}
                  >
                    <Building2 className="size-3.5" />
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>¿Qué especialidad lo diagnosticó?</Label>
                <Input
                  value={dx.diagnosisSpecialty ?? ""}
                  onChange={(e) =>
                    updateDraft({
                      diagnosis: {
                        ...dx,
                        diagnosisSpecialty: e.target.value || null,
                      },
                    })
                  }
                  placeholder="Especialidad"
                  className="bg-card border"
                />
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
                  updateDraft({
                    diagnosis: { ...dx, hasMedicalReport: v === "Sí" },
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
          </section>

          <section className="flex flex-col gap-5">
            <SectionHeader icon={Activity} title="Consultas Médicas" />
            <div className="flex flex-col gap-2">
              <Label className={fl}>
                ¿Actualmente asiste a sus consultas médicas?
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
                        updateAppointment({ specialty: e.target.value || null })
                      }
                      placeholder="Especialidad"
                      className="bg-card border"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className={fl}>
                    ¿Cuándo es su siguiente consulta y especialidad?
                  </Label>
                  <Input
                    type="date"
                    value={appointment.nextAppointmentDate ?? ""}
                    onChange={(e) =>
                      updateAppointment({
                        nextAppointmentDate: e.target.value || null,
                      })
                    }
                    className="bg-card max-w-60 border"
                  />
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
          </section>

          <section className="flex flex-col gap-5">
            <SectionHeader icon={HeartPulse} title="Tratamiento" />
            <div className="flex flex-col gap-2">
              <Label className={fl}>
                ¿Recibe este tratamiento por derivación?
              </Label>
              <Select
                items={YES_NO_OPTIONS}
                value={tx.isReferred === true ? "Sí" : "No"}
                onValueChange={(v) => {
                  const isReferred = v === "Sí"
                  updateDraft({
                    treatment: {
                      ...tx,
                      isReferred,
                      sourceHealthCenterId: isReferred
                        ? (tx.sourceHealthCenterId ??
                          details.primaryHealthCenterId ??
                          undefined)
                        : undefined,
                    },
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
                  <Select
                    items={activeCenters.map((c) => ({
                      value: c.id,
                      label: `${c.name} — ${c.department}`,
                    }))}
                    value={tx.sourceHealthCenterId ?? ""}
                    onValueChange={(v) =>
                      updateDraft({
                        treatment: {
                          ...tx,
                          sourceHealthCenterId: v || undefined,
                        },
                      })
                    }
                  >
                    <SelectTrigger className={sc}>
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
                        updateDraft({
                          treatment: {
                            ...tx,
                            receivingHealthCenterId: v || undefined,
                          },
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
                      onClick={() => setNewHospitalOpen(true)}
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
                      updateDraft({
                        treatment: {
                          ...tx,
                          receivingHealthCenterId: v || undefined,
                        },
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
                    onClick={() => setNewHospitalOpen(true)}
                  >
                    <Building2 className="size-3.5" />
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className={flGrid}>Situación del tratamiento</Label>
                <Select
                  items={TREATMENT_SITUATIONS}
                  value={tx.treatmentSituation ?? ""}
                  onValueChange={(v) =>
                    updateDraft({
                      treatment: {
                        ...tx,
                        treatmentSituation: (v || undefined) as
                          | TreatmentSituation
                          | undefined,
                      },
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
                    updateDraft({
                      treatment: { ...tx, treatmentType: e.target.value },
                    })
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
                    (tx.isOperation ?? Boolean(tx.operationName)) === true
                      ? "Sí"
                      : (tx.isOperation ?? Boolean(tx.operationName)) === false
                        ? "No"
                        : ""
                  }
                  onValueChange={(value) =>
                    updateDraft({
                      treatment: {
                        ...tx,
                        isOperation: value === "Sí",
                        operationName: value === "Sí" ? tx.operationName : null,
                      },
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
              {(tx.isOperation ?? Boolean(tx.operationName)) && (
                <div className="flex flex-col gap-2">
                  <Label className={flGrid}>Nombre de la operación</Label>
                  <Input
                    value={tx.operationName ?? ""}
                    onChange={(e) =>
                      updateDraft({
                        treatment: {
                          ...tx,
                          operationName: e.target.value || null,
                        },
                      })
                    }
                    placeholder="Ej: Mastectomía"
                    className="bg-card border"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label className={flGrid}>Programa de atención</Label>
                <Select
                  items={CARE_PROGRAMS}
                  value={tx.careProgram ?? ""}
                  onValueChange={(value) =>
                    updateDraft({
                      treatment: {
                        ...tx,
                        careProgram: (value || undefined) as
                          | CareProgram
                          | undefined,
                      },
                    })
                  }
                >
                  <SelectTrigger className={sc}>
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
                value={tx.treatmentFrequency}
                onChange={(treatmentFrequency) =>
                  updateDraft({ treatment: { ...tx, treatmentFrequency } })
                }
              />
              <div className="flex flex-col gap-2">
                <Label className={flGrid}>Fecha de inicio</Label>
                <Input
                  type="date"
                  value={tx.startDate ?? ""}
                  onChange={(e) =>
                    updateDraft({
                      treatment: { ...tx, startDate: e.target.value || null },
                    })
                  }
                  className="bg-card border"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={flGrid}>Fecha de fin (opcional)</Label>
                <Input
                  type="date"
                  value={tx.endDate ?? ""}
                  min={tx.startDate ?? undefined}
                  onChange={(e) =>
                    updateDraft({
                      treatment: { ...tx, endDate: e.target.value || null },
                    })
                  }
                  className="bg-card border"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={flGrid}>¿Recibe teleconsulta?</Label>
                <Select
                  items={TRI_STATE_OPTIONS}
                  value={
                    tx.receivesTeleconsultation === true
                      ? "SI"
                      : tx.receivesTeleconsultation === false
                        ? "NO"
                        : "SIN_DATO"
                  }
                  onValueChange={(value) =>
                    updateDraft({
                      treatment: {
                        ...tx,
                        receivesTeleconsultation:
                          value === "SIN_DATO" ? undefined : value === "SI",
                      },
                    })
                  }
                >
                  <SelectTrigger className={sc}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRI_STATE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {tx.receivesTeleconsultation === true && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label className={flGrid}>Nota de teleconsulta</Label>
                    <Textarea
                      value={tx.teleconsultationNote ?? ""}
                      onChange={(e) =>
                        updateDraft({
                          treatment: {
                            ...tx,
                            teleconsultationNote: e.target.value || null,
                          },
                        })
                      }
                      placeholder="Detalle de la teleconsulta"
                      className="bg-card min-h-16 border"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className={flGrid}>
                      Especialidades de teleconsulta
                    </Label>
                    <Input
                      value={(tx.teleconsultationSpecialties ?? []).join(", ")}
                      onChange={(e) =>
                        updateDraft({
                          treatment: {
                            ...tx,
                            teleconsultationSpecialties: e.target.value
                              .split(",")
                              .map((specialty) => specialty.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      placeholder="Ej: Oncología, Psicología"
                      className="bg-card border"
                    />
                  </div>
                </>
              )}
              {tx.treatmentSituation === "ABANDONED" && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label className={flGrid}>Motivo de abandono</Label>
                  <Textarea
                    value={tx.treatmentAbandonmentReason ?? ""}
                    onChange={(e) =>
                      updateDraft({
                        treatment: {
                          ...tx,
                          treatmentAbandonmentReason: e.target.value || null,
                        },
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
                  <p className="text-sm font-medium">Medicamentos actuales</p>
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
                  key={index}
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
                        Nombre <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={medication.name}
                        onChange={(e) =>
                          updateMedication(index, { name: e.target.value })
                        }
                        placeholder="Ej: Tamoxifeno"
                        className="bg-card border"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className={flGrid}>Descripción de dosis</Label>
                      <Input
                        value={medication.doseDescription ?? ""}
                        onChange={(e) =>
                          updateMedication(index, {
                            doseDescription: e.target.value || undefined,
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
                            const raw = e.target.value.trim().replace(",", ".")
                            if (!raw) {
                              updateMedication(index, { doseAmount: undefined })
                              return
                            }
                            const parsed = Number(raw)
                            if (!Number.isFinite(parsed) || parsed < 0) {
                              e.currentTarget.value =
                                medication.doseAmount?.toString() ?? ""
                              return
                            }
                            updateMedication(index, { doseAmount: parsed })
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
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className={flGrid}>Vía de administración</Label>
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
                            <SelectItem key={route.value} value={route.value}>
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
          </section>
        </>
      )}

      <section className="flex flex-col gap-5">
        <SectionHeader
          icon={Stethoscope}
          title="Antecedentes y comorbilidades"
        />
        <div className="flex flex-col gap-2">
          <Label className={fl}>¿Tiene antecedentes de psiquiatría?</Label>
          <Select
            items={TRI_STATE_OPTIONS}
            value={
              healthBackground.hasPsychiatry === true
                ? "SI"
                : healthBackground.hasPsychiatry === false
                  ? "NO"
                  : "SIN_DATO"
            }
            onValueChange={(value) =>
              updateHealthBackground({
                hasPsychiatry:
                  value === "SIN_DATO" ? undefined : value === "SI",
              })
            }
          >
            <SelectTrigger className={sc}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRI_STATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Comorbilidades activas</p>
              <p className="text-muted-foreground text-xs">
                Registra las condiciones que requieren atención actualmente.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={addActiveComorbidity}
            >
              <Plus className="size-3.5" />
              Agregar
            </Button>
          </div>
          {activeComorbidities.map((item, index) => (
            <div
              key={index}
              className="border-border/60 bg-muted/20 flex flex-col gap-3 rounded-xl border p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs font-semibold">
                  Comorbilidad {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground/60 hover:text-destructive"
                  aria-label={`Quitar comorbilidad ${index + 1}`}
                  onClick={() => removeActiveComorbidity(index)}
                >
                  <Minus className="size-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor={`enrollment-comorbidity-${index}`}
                    className={fl}
                  >
                    Condición <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`enrollment-comorbidity-${index}`}
                    value={item.conditionName}
                    onChange={(event) =>
                      updateActiveComorbidity(
                        index,
                        "conditionName",
                        event.target.value,
                      )
                    }
                    placeholder="Ej: Hipertensión"
                    className="bg-card border"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className={fl}>Tratamiento</Label>
                  <Input
                    value={item.treatmentDescription ?? ""}
                    onChange={(event) =>
                      updateActiveComorbidity(
                        index,
                        "treatmentDescription",
                        event.target.value,
                      )
                    }
                    placeholder="Tratamiento actual"
                    className="bg-card border"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className={fl}>Especialidad de seguimiento</Label>
                  <Input
                    value={item.followUpSpecialty ?? ""}
                    onChange={(event) =>
                      updateActiveComorbidity(
                        index,
                        "followUpSpecialty",
                        event.target.value,
                      )
                    }
                    placeholder="Ej: Cardiología"
                    className="bg-card border"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Limitaciones</p>
              <p className="text-muted-foreground text-xs">
                Registra las limitaciones actuales y su causa principal.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={addLimitation}
            >
              <Plus className="size-3.5" />
              Agregar
            </Button>
          </div>
          {limitations.map((item, index) => (
            <div
              key={index}
              className="border-border/60 bg-muted/20 grid grid-cols-1 gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,1fr)_14rem_auto]"
            >
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`enrollment-limitation-${index}`}
                  className={fl}
                >
                  Descripción <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id={`enrollment-limitation-${index}`}
                  value={item.description}
                  onChange={(event) =>
                    updateLimitation(index, {
                      description: event.target.value,
                    })
                  }
                  placeholder="Describe la limitación"
                  className="bg-card min-h-16 border"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>Causa</Label>
                <Select
                  items={HEALTH_BACKGROUND_CAUSES}
                  value={item.cause}
                  onValueChange={(value) =>
                    updateLimitation(index, {
                      cause: value as HealthBackgroundCause,
                    })
                  }
                >
                  <SelectTrigger className={sc}>
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
                className="text-muted-foreground/60 hover:text-destructive self-end"
                aria-label={`Quitar limitación ${index + 1}`}
                onClick={() => removeLimitation(index)}
              >
                <Minus className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                Antecedentes familiares de cáncer
              </p>
              <p className="text-muted-foreground text-xs">
                Registra familiares con antecedentes oncológicos.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={addFamilyCancerHistory}
            >
              <Plus className="size-3.5" />
              Agregar
            </Button>
          </div>
          {familyCancerHistory.map((item, index) => (
            <div
              key={index}
              className="border-border/60 bg-muted/20 grid grid-cols-1 gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`enrollment-family-history-${index}`}
                  className={fl}
                >
                  Parentesco <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`enrollment-family-history-${index}`}
                  value={item.relationship}
                  onChange={(event) =>
                    updateFamilyCancerHistory(
                      index,
                      "relationship",
                      event.target.value,
                    )
                  }
                  placeholder="Ej: Madre"
                  className="bg-card border"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>Tipo de cáncer</Label>
                <Input
                  value={item.cancerType ?? ""}
                  onChange={(event) =>
                    updateFamilyCancerHistory(
                      index,
                      "cancerType",
                      event.target.value,
                    )
                  }
                  placeholder="Ej: Cáncer de mama"
                  className="bg-card border"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground/60 hover:text-destructive self-end"
                aria-label={`Quitar antecedente familiar ${index + 1}`}
                onClick={() => removeFamilyCancerHistory(index)}
              >
                <Minus className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader icon={Users} title="Servicios de Apoyo" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className={fl}>¿Se derivó con la asistenta social?</Label>
            <Select
              items={YES_NO_OPTIONS}
              value={
                details.referredToSocialWorker === true
                  ? "Sí"
                  : details.referredToSocialWorker === false
                    ? "No"
                    : ""
              }
              onValueChange={(v) =>
                updateDraft({
                  details: { ...details, referredToSocialWorker: v === "Sí" },
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
        </div>
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
                      updateFamilyTalk(idx, "familyMemberName", e.target.value)
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
                      updateFamilyTalk(idx, "familyMemberPhone", e.target.value)
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
                      updateFamilyTalk(idx, "familyMemberEmail", e.target.value)
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
              <Label className={fl}>Motivo por el que no puede afiliarse</Label>
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

      <CreateHealthCenterDialog
        open={newHospitalOpen}
        onOpenChange={setNewHospitalOpen}
      />
      <StepNav currentStep={7} onPrev={prevStep} />
    </form>
  )
}
