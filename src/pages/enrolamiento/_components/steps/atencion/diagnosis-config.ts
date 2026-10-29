import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { compact, fromBool, fromDuration, text, toBool, toDuration } from "@/pages/pacientes/[id]/seguimientos/_components/ficha/answers"
import type { Group, Values } from "@/components/ds/questions"
import { calculateDurationBetweenDates } from "@/types/duration"
import { WAIT_TIME_RECALL_OPTIONS, type FixedWaitTimeRecall } from "@/types/wait-time-recall"
import type { CancerStage } from "@/types"
import type { EnrollmentDiagnosisDraft } from "../../../_store/enrollment-store"

export function diagnosisGroups(historical: boolean): Group[] {
  return [
    {
      title: "Diagnóstico",
      questions: [
        { id: "diagnosis", label: "¿Cuál es su diagnóstico oncológico?", type: "select", catalog: "cancer_diagnosis", required: true, wide: true },
        { id: "stage", label: "¿Conoce el estadio del diagnóstico? (1, 2, 3, 4 o desconoce)", type: "select", catalog: "cancer_stage" },
        { id: "evolution", label: "Evolución de la enfermedad", type: "textarea", placeholder: "Ej: Metástasis ósea; otros órganos comprometidos" },
        { id: "symptom", label: "¿Qué síntoma lo llevó a realizarse su chequeo médico?", type: "textarea" },
        { id: "diagnosisDate", label: "¿Cuándo fue diagnosticado?", type: "date" },
        { id: "rememberSymptoms", label: "¿Recuerda la fecha de los primeros síntomas?", type: "yesno", showIf: () => historical },
        {
          id: "firstSymptoms",
          label: "¿Cuándo aparecieron los primeros síntomas?",
          type: "date",
          showIf: (v) => !historical || v.rememberSymptoms !== "no",
        },
        { id: "waitRecall", label: "¿Recuerda el tiempo de espera?", type: "select", options: WAIT_TIME_RECALL_OPTIONS, wide: true },
        { id: "wait", label: "Tiempo de espera para el diagnóstico", type: "duration", units: ["DAY", "WEEK", "MONTH", "YEAR"], showIf: (v) => !v.waitRecall || v.waitRecall === "REMEMBERS" },
        { id: "center", label: "¿Dónde fue diagnosticado?", type: "select", catalog: HEALTH_CENTER, wide: true },
        { id: "specialty", label: "¿Qué especialidad lo diagnosticó?", type: "select", catalog: "medical_specialty" },
        { id: "referred", label: "Luego de su atención, ¿a qué centro de salud fue derivado?", type: "select", catalog: HEALTH_CENTER, wide: true },
        { id: "hasReferral", label: "¿Cuenta con referencia a los centros de salud mencionados?", type: "yesno" },
        { id: "report", label: "¿Cuenta con informe médico de respaldo?", type: "yesno" },
      ],
    },
  ]
}

export function diagnosisValues(dx: EnrollmentDiagnosisDraft, historical: boolean): Values {
  const remembersWait = (dx.remembersWaitTimeForDiagnosis ?? true) !== false
  const calculated = calculateDurationBetweenDates(dx.firstSymptomsDate, dx.diagnosisDate)
  const visible = !remembersWait ? undefined : dx.waitTimeForDiagnosisManuallyEdited ? dx.waitTimeForDiagnosis : (calculated ?? dx.waitTimeForDiagnosis)
  return compact({
    diagnosis: dx.diagnosis,
    stage: dx.cancerStage,
    evolution: dx.diseaseEvolution,
    symptom: dx.symptomLeadingToCheckup,
    diagnosisDate: dx.diagnosisDate,
    rememberSymptoms: historical ? ((dx.remembersFirstSymptomsDate ?? true) ? "yes" : "no") : null,
    firstSymptoms: dx.firstSymptomsDate,
    waitRecall: remembersWait ? "REMEMBERS" : (dx.waitTimeRecall ?? "DOES_NOT_REMEMBER"),
    wait: fromDuration(visible),
    center: dx.healthCenterId,
    specialty: dx.diagnosisSpecialty,
    referred: dx.referredHealthCenterId,
    hasReferral: fromBool(dx.hasReferral),
    report: fromBool(dx.hasMedicalReport),
  })
}

export function toDiagnosis(values: Values, base: EnrollmentDiagnosisDraft, historical: boolean): EnrollmentDiagnosisDraft {
  const remembersSymptoms = !historical || values.rememberSymptoms !== "no"
  const firstSymptomsDate = remembersSymptoms ? text(values.firstSymptoms) ?? null : null
  const diagnosisDate = text(values.diagnosisDate) ?? null
  const remembersWait = !values.waitRecall || values.waitRecall === "REMEMBERS"
  const typed = toDuration(values.wait)
  const calculated = calculateDurationBetweenDates(firstSymptomsDate, diagnosisDate)
  const same = Boolean(typed && calculated && typed.valueMin === calculated.valueMin && typed.unit === calculated.unit)
  return {
    ...base,
    diagnosis: values.diagnosis?.trim() ?? "",
    cancerStage: (values.stage as CancerStage | null) || null,
    diseaseEvolution: text(values.evolution),
    symptomLeadingToCheckup: text(values.symptom) ?? null,
    diagnosisDate,
    firstSymptomsDate,
    remembersFirstSymptomsDate: remembersSymptoms,
    healthCenterId: text(values.center) ?? null,
    diagnosisSpecialty: text(values.specialty),
    referredHealthCenterId: text(values.referred) ?? null,
    hasReferral: values.hasReferral == null ? null : toBool(values.hasReferral),
    hasMedicalReport: toBool(values.report),
    remembersWaitTimeForDiagnosis: remembersWait,
    waitTimeRecall: remembersWait ? undefined : (values.waitRecall as FixedWaitTimeRecall),
    waitTimeForDiagnosis: remembersWait ? (same ? calculated : typed) : undefined,
    waitTimeForDiagnosisManuallyEdited: remembersWait && Boolean(typed) && !same,
    isCurrent: true,
  }
}
