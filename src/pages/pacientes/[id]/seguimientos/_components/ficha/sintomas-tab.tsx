import { QuestionForm } from "@/components/ds/question-form"
import { no, yes, type Group, type Values } from "@/components/ds/questions"
import type { PatientDiagnosticStatusEvent, PatientSymptomReport } from "@/api/patients"
import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { enrollmentSymptomDraft } from "../clinical-symptom-draft"
import type { SymptomReportDraft } from "../clinical-drafts"
import { compact, complete, fromBool, fromDuration, fromNumber, text, toBool, toDuration, toInt, toTri, TRI_MENTION, useAnswers } from "./answers"
import { BusquedaSection } from "./busqueda-section"
import { MissingNote, TabNote } from "./parts"
import type { SheetTabProps } from "./sheet-types"

// Síntomas: malestar, consultas, referencia, diagnóstico informado, tratamiento
// informado y dolor. Parte de lo que se respondió en el enrolamiento.

/** Los códigos del catálogo de diagnósticos van en mayúsculas; lo demás es texto libre. */
const isCatalogCode = (value: string) => /^[A-Z0-9_]+$/.test(value)

function symptomGroups(primaryCareQuestions: boolean): Group[] {
  return [
    {
      title: "Malestar",
      questions: [
        { id: "discomfort", label: "¿Presenta malestar o dolor?", type: "tri", options: TRI_MENTION },
        { id: "signs", label: "Signos y síntomas", type: "textarea", placeholder: "Describe los signos o síntomas", showIf: yes("discomfort") },
        { id: "motivation", label: "¿Qué lo motivó a realizarse su examen médico?", type: "textarea", required: true, showIf: no("discomfort") },
        { id: "indications", label: "Indicaciones recibidas", type: "textarea", placeholder: "Indicaciones de la consulta" },
      ],
    },
    {
      title: "Consulta médica",
      questions: [
        { id: "consulted", label: "¿Actualmente ha solicitado o asistió a una consulta médica?", type: "tri", options: TRI_MENTION, wide: true },
        { id: "noConsultReason", label: "¿Sabe por qué no ha solicitado ni asistido a una consulta médica?", type: "textarea", required: true, showIf: no("consulted") },
        { id: "center", label: "¿En qué establecimiento de salud?", type: "select", catalog: HEALTH_CENTER, required: true, showIf: yes("consulted") },
        { id: "specialty", label: "¿Con qué especialidad?", type: "select", catalog: "medical_specialty", required: true, showIf: yes("consulted") },
        { id: "firstConsultation", label: "¿Cuándo fue la primera consulta que tuvo?", type: "date", required: true, showIf: yes("consulted") },
        { id: "nextConsultation", label: "¿Cuándo es su siguiente consulta médica?", type: "date", showIf: yes("consulted") },
      ],
    },
    {
      title: "Diagnóstico",
      showIf: yes("consulted"),
      questions: [
        { id: "awaiting", label: "¿Está a la espera de un diagnóstico?", type: "yesno", required: true },
        { id: "searchDuration", label: "¿Hace cuánto tiempo está esperando o buscando un diagnóstico?", type: "duration", units: ["DAY", "WEEK", "MONTH", "YEAR"], showIf: yes("awaiting") },
        { id: "referral", label: "¿Le han brindado una hoja de referencia?", type: "tri", options: TRI_MENTION, required: true },
        { id: "referredCenter", label: "¿A dónde lo han referido?", type: "select", catalog: HEALTH_CENTER, required: true, showIf: yes("referral") },
        { id: "noReferralReason", label: "¿Sabe por qué no le brindaron la hoja de referencia?", type: "textarea", required: true, showIf: no("referral") },
        { id: "diagnosed", label: "¿Le han brindado algún diagnóstico?", type: "yesno", required: true },
        {
          id: "diagnosisKind",
          label: "¿Qué tipo de diagnóstico?",
          type: "choice",
          required: true,
          options: [
            { value: "cancer", label: "Cáncer" },
            { value: "other", label: "Otro, no oncológico" },
          ],
          showIf: yes("diagnosed"),
        },
        { id: "reportedCancer", label: "¿Cuál?", type: "select", catalog: "cancer_diagnosis", required: true, showIf: (v) => v.diagnosed === "yes" && v.diagnosisKind === "cancer" },
        { id: "reportedOther", label: "¿Cuál?", type: "text", required: true, placeholder: "Escribe el diagnóstico no oncológico", showIf: (v) => v.diagnosed === "yes" && v.diagnosisKind === "other" },
      ],
    },
    {
      title: "Soporte del programa",
      questions: [
        { id: "referredViaSepa", label: "¿Logró ser referido a un establecimiento de mayor complejidad a partir del soporte del programa?", type: "yesno", wide: true },
        ...(primaryCareQuestions
          ? [
              { id: "primaryCare", label: "¿Asistió a su primera consulta en atención primaria a partir del soporte del programa?", type: "yesno" as const, wide: true },
              { id: "primaryCareAt", label: "¿Cuándo fue esa primera consulta?", type: "date" as const, showIf: yes("primaryCare") },
            ]
          : []),
      ],
    },
    {
      title: "Tratamiento informado",
      questions: [
        { id: "treated", label: "¿Actualmente le han brindado algún tratamiento?", type: "tri", options: TRI_MENTION, wide: true },
        { id: "treatment", label: "Tratamiento informado", type: "select", catalog: "treatment_type", required: true, showIf: yes("treated") },
        { id: "treatmentFrequency", label: "Frecuencia del tratamiento", type: "duration", units: ["DAY", "WEEK", "MONTH", "YEAR"], required: true, showIf: yes("treated") },
        { id: "noTreatmentReason", label: "¿Por qué no recibe el tratamiento?", type: "textarea", required: true, showIf: no("treated") },
      ],
    },
    {
      title: "Dolor",
      questions: [
        { id: "pain", label: "¿El dolor está presente actualmente?", type: "yesno" },
        { id: "painIntensity", label: "Intensidad del dolor, de 0 a 10", type: "scale", showIf: yes("pain") },
        { id: "painLocation", label: "Ubicación del dolor", type: "text", placeholder: "Ej: abdomen", showIf: yes("pain") },
        { id: "painDescription", label: "Descripción del dolor", type: "textarea", showIf: yes("pain") },
      ],
    },
  ]
}

function initialValues(draft: SymptomReportDraft | undefined, enrollment: PatientSymptomReport | undefined): Values {
  const d: SymptomReportDraft = { ...(enrollment ? enrollmentSymptomDraft(enrollment) : {}), ...draft }
  const reported = d.reportedDiagnosis ?? ""
  return compact({
    discomfort: fromBool(d.hasDiscomfort),
    signs: d.signsAndSymptoms,
    motivation: d.checkupMotivation,
    indications: d.indicationsReceived,
    consulted: fromBool(d.hasMedicalConsultation),
    noConsultReason: d.noMedicalConsultationReason,
    center: d.healthCenterId,
    specialty: d.specialty,
    firstConsultation: d.firstConsultationDate,
    nextConsultation: d.nextConsultationDate,
    awaiting: fromBool(d.isAwaitingDiagnosis),
    searchDuration: fromDuration(d.diagnosisSearchDuration),
    referral: fromBool(d.hasReferral),
    referredCenter: d.referredHealthCenterId,
    noReferralReason: d.referralNotProvidedReason,
    diagnosed: fromBool(d.hasReceivedDiagnosis),
    diagnosisKind: reported ? (isCatalogCode(reported) ? "cancer" : "other") : undefined,
    reportedCancer: isCatalogCode(reported) ? reported : undefined,
    reportedOther: reported && !isCatalogCode(reported) ? reported : undefined,
    referredViaSepa: fromBool(d.referredViaSepa),
    primaryCare: fromBool(d.attendedPrimaryCareViaSepa),
    primaryCareAt: d.firstPrimaryCareViaSepaAt,
    treated: fromBool(d.isReceivingReportedTreatment),
    treatment: d.reportedTreatment,
    treatmentFrequency: fromDuration(d.reportedTreatmentFrequency),
    noTreatmentReason: d.notReceivingTreatmentReason,
    pain: fromBool(d.isPainPresent),
    painIntensity: fromNumber(d.painIntensity),
    painLocation: d.painLocation,
    painDescription: d.painDescription,
  })
}

function toDraft(v: Values, previous: SymptomReportDraft | undefined): SymptomReportDraft {
  const consulted = toTri(v.consulted)
  const inConsult = consulted === true
  const referral = toTri(v.referral)
  const diagnosed = toBool(v.diagnosed)
  const treated = toTri(v.treated)
  const pain = toBool(v.pain)
  return {
    hasDiscomfort: toTri(v.discomfort),
    signsAndSymptoms: v.discomfort === "yes" ? text(v.signs) : undefined,
    checkupMotivation: v.discomfort === "no" ? text(v.motivation) : undefined,
    indicationsReceived: text(v.indications),
    hasMedicalConsultation: consulted,
    noMedicalConsultationReason: consulted === false ? text(v.noConsultReason) : undefined,
    healthCenterId: inConsult ? (v.center ?? undefined) : undefined,
    specialty: inConsult ? text(v.specialty) : undefined,
    firstConsultationDate: inConsult ? (v.firstConsultation ?? undefined) : undefined,
    nextConsultationDate: inConsult ? (v.nextConsultation ?? undefined) : undefined,
    isAwaitingDiagnosis: inConsult ? toBool(v.awaiting) : undefined,
    diagnosisSearchDuration: inConsult && v.awaiting === "yes" ? toDuration(v.searchDuration) : undefined,
    hasReferral: inConsult ? referral : undefined,
    referredHealthCenterId: inConsult && referral === true ? (v.referredCenter ?? undefined) : undefined,
    referralNotProvidedReason: inConsult && referral === false ? text(v.noReferralReason) : undefined,
    hasReceivedDiagnosis: inConsult ? diagnosed : undefined,
    reportedDiagnosis: inConsult && diagnosed ? text(v.diagnosisKind === "cancer" ? v.reportedCancer : v.reportedOther) : undefined,
    referredViaSepa: toBool(v.referredViaSepa),
    attendedPrimaryCareViaSepa: toBool(v.primaryCare),
    firstPrimaryCareViaSepaAt: v.primaryCare === "yes" ? (v.primaryCareAt ?? undefined) : undefined,
    isReceivingReportedTreatment: treated,
    reportedTreatment: treated === true ? text(v.treatment) : undefined,
    reportedTreatmentFrequency: treated === true ? toDuration(v.treatmentFrequency) : undefined,
    notReceivingTreatmentReason: treated === false ? text(v.noTreatmentReason) : undefined,
    isPainPresent: pain,
    painIntensity: pain ? toInt(v.painIntensity) : undefined,
    painLocation: pain ? text(v.painLocation) : undefined,
    painDescription: pain ? text(v.painDescription) : undefined,
    symptomDuration: previous?.symptomDuration,
    symptomFrequency: previous?.symptomFrequency,
  }
}

type Props = SheetTabProps & {
  enrollmentReport: PatientSymptomReport | undefined
  current: PatientDiagnosticStatusEvent | null | undefined
  locked: boolean
  readOnly: boolean
  ruledOutEventId: string | null
  /** Solo si en el último enrolamiento no se atendía ni recibía tratamiento. */
  primaryCareQuestions: boolean
}

export function SintomasTab({ drafts, onDraftsChange, enrollmentReport, primaryCareQuestions, current, locked, readOnly, ruledOutEventId }: Props) {
  const groups = symptomGroups(primaryCareQuestions)
  const { values, answer } = useAnswers(
    () => initialValues(drafts.symptomReport, enrollmentReport),
    (v) => onDraftsChange((prev) => ({ ...prev, symptomReport: complete(groups, v) ? toDraft(v, prev.symptomReport) : undefined })),
  )
  return (
    <div className="space-y-6">
      {enrollmentReport && !drafts.symptomReport && <TabNote>Las respuestas parten de lo que se registró en el enrolamiento. Actualiza lo que haya cambiado.</TabNote>}
      {/* La búsqueda diagnóstica va después de la consulta y el diagnóstico que le dieron. */}
      <QuestionForm groups={groups.slice(0, 3)} values={values} onChange={answer} />
      <BusquedaSection
        drafts={drafts}
        onDraftsChange={onDraftsChange}
        current={current}
        locked={locked}
        readOnly={readOnly}
        ruledOutEventId={ruledOutEventId}
        reportedOther={values.diagnosed === "yes" && values.diagnosisKind === "other" ? (values.reportedOther ?? null) : null}
      />
      <QuestionForm groups={groups.slice(3)} values={values} onChange={answer} />
      <MissingNote groups={groups} values={values} what="el reporte de síntomas" />
    </div>
  )
}
