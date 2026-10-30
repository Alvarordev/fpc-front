import { QuestionForm } from "@/components/ds/question-form"
import { is, yes, type Group, type Values } from "@/components/ds/questions"
import type { PatientDiagnosticStatusEvent } from "@/api/patients"
import { patientHealthSubcategoriesByPhase, patientHealthSubcategoryLabels } from "@/lib/patient-health-subcategory"
import { diagnosticStatusLabels } from "../../../_lib/clinical-labels"
import { formatDate } from "../../../_lib/ficha-format"
import type { ClinicalDrafts, DiagnosticStatusDraft, NonOncologicalFollowUpDraft } from "../clinical-drafts"
import { compact, complete, fromBool, fromDuration, text, toBool, toDuration, toTri, TRI_MENTION, useAnswers } from "./answers"
import { MissingNote, TabNote } from "./parts"
import type { SheetTabProps } from "./sheet-types"

// Resultado de la búsqueda diagnóstica, dentro de Síntomas. Es la ruta de quien
// fue a consultar por sus síntomas: si encontraron cáncer pasa a diagnóstico; si
// lo descartaron, se registra el diagnóstico no oncológico y su tratamiento, y
// el paciente pasa a la subcategoría de descarte.

const statusGroups: Group[] = [
  {
    title: "Resultado de la búsqueda diagnóstica",
    description: "Si ya tiene un resultado de sus consultas, regístralo aquí. Mientras no lo registres, sigue en búsqueda.",
    questions: [
      {
        id: "dsStatus",
        label: "¿Qué resultado le dieron?",
        type: "choice",
        options: [
          { value: "CONFIRMED", label: "Cáncer encontrado" },
          { value: "RULED_OUT", label: "Cáncer descartado" },
        ],
        wide: true,
      },
      {
        id: "dsSubcategory",
        label: "Subcategoría del paciente",
        type: "select",
        required: true,
        options: patientHealthSubcategoriesByPhase.CANCER_DIAGNOSIS.map((value) => ({ value, label: patientHealthSubcategoryLabels[value] })),
        showIf: is("dsStatus", "CONFIRMED"),
      },
      { id: "dsDiagnosis", label: "Diagnóstico formal", type: "text", required: true, placeholder: "Escribe el diagnóstico confirmado", showIf: is("dsStatus", "CONFIRMED") },
      { id: "dsSepa", label: "¿Soportado por SEPA?", type: "yesno", showIf: (v) => Boolean(v.dsStatus) },
      { id: "dsNotes", label: "Detalle del cambio de estado", type: "text", placeholder: "Opcional", showIf: (v) => Boolean(v.dsStatus) },
    ],
  },
]

const hasDiagnosis = (v: Values) => Boolean(v.noDiagnosis?.trim())

const nonOncologicalGroups: Group[] = [
  {
    title: "Diagnóstico no oncológico",
    description: "Si además le diagnosticaron otra enfermedad, regístrala con su tratamiento. Si no, déjalo vacío.",
    questions: [
      { id: "noDiagnosis", label: "Diagnóstico no oncológico", type: "text", placeholder: "Opcional. Ej. gastritis, anemia, hipertensión" },
      { id: "noOccurredOn", label: "Fecha del hecho", type: "date" },
      { id: "noTreated", label: "¿Recibe tratamiento?", type: "tri", options: TRI_MENTION },
      { id: "noTreatment", label: "Nombre del tratamiento", type: "text", showIf: yes("noTreated") },
      { id: "noMedication", label: "Medicación", type: "text", showIf: yes("noTreated") },
      { id: "noFrequency", label: "Frecuencia del tratamiento", type: "duration", units: ["DAY", "WEEK", "MONTH", "YEAR"], showIf: yes("noTreated") },
      { id: "noControls", label: "¿Mantiene controles?", type: "tri", options: TRI_MENTION },
      { id: "noControlSpecialty", label: "Especialidad de control", type: "select", catalog: "medical_specialty", required: true, showIf: yes("noControls") },
      { id: "noPeriodicity", label: "Periodicidad de controles", type: "duration", units: ["WEEK", "MONTH", "YEAR"], showIf: yes("noControls") },
      {
        id: "noStatus",
        label: "Estado",
        type: "choice",
        options: [
          { value: "ACTIVE", label: "Activo" },
          { value: "DISCHARGED", label: "Dado de alta" },
        ],
      },
      { id: "noDischargedOn", label: "Fecha del alta", type: "date", showIf: is("noStatus", "DISCHARGED") },
      { id: "noDischargeReason", label: "Motivo del alta", type: "textarea", required: true, showIf: is("noStatus", "DISCHARGED") },
    ],
  },
]

type Props = SheetTabProps & {
  current: PatientDiagnosticStatusEvent | null | undefined
  /** Enrolado ya con diagnóstico de cáncer: no hay búsqueda que cerrar. */
  locked: boolean
  /** Evento de descarte ya guardado al que se asocia el diagnóstico no oncológico. */
  ruledOutEventId: string | null
  /** Diagnóstico no oncológico que contó en Síntomas, para no volver a escribirlo. */
  reportedOther: string | null
}

function initialValues(drafts: ClinicalDrafts, current: Props["current"], reportedOther: string | null): Values {
  const ds = drafts.diagnosticStatus
  const no = drafts.nonOncologicalFollowUp
  return compact({
    dsStatus: ds?.status,
    dsSubcategory: ds?.healthSubcategory ?? "ACTIVE_TREATMENT",
    dsDiagnosis: ds?.diagnosis ?? current?.reportedDiagnosis,
    dsSepa: fromBool(ds?.supportedBySepa ?? current?.supportedBySepa ?? undefined),
    dsNotes: ds?.notes ?? current?.notes,
    // Lo que contó en Síntomas como diagnóstico no oncológico no se vuelve a escribir.
    noDiagnosis: no?.diagnosis ?? reportedOther,
    noOccurredOn: no?.occurredOn,
    noTreated: fromBool(no?.receivesTreatment),
    noTreatment: no?.treatmentName,
    noMedication: no?.medication,
    noFrequency: fromDuration(no?.treatmentFrequency),
    noControls: fromBool(no?.hasControls),
    noControlSpecialty: no?.controlSpecialty,
    noPeriodicity: fromDuration(no?.controlPeriodicity),
    noStatus: no?.status ?? "ACTIVE",
    noDischargedOn: no?.dischargedOn,
    noDischargeReason: no?.dischargeReason,
  })
}

function statusDraft(v: Values): DiagnosticStatusDraft | undefined {
  if (!v.dsStatus || !complete(statusGroups, v)) return undefined
  const status = v.dsStatus as DiagnosticStatusDraft["status"]
  return {
    status,
    supportedBySepa: toBool(v.dsSepa),
    notes: v.dsNotes ?? "",
    ...(status === "CONFIRMED" ? { diagnosis: v.dsDiagnosis ?? "", healthSubcategory: v.dsSubcategory as DiagnosticStatusDraft["healthSubcategory"] } : {}),
  }
}

function nonOncologicalDraft(v: Values, previous: NonOncologicalFollowUpDraft | undefined, eventId: string | null): NonOncologicalFollowUpDraft | undefined {
  // Sin diagnóstico no oncológico no hay nada que registrar: el descarte no lo exige.
  if (!hasDiagnosis(v) || !complete(nonOncologicalGroups, v)) return undefined
  const treated = toTri(v.noTreated)
  const controls = toTri(v.noControls)
  const discharged = v.noStatus === "DISCHARGED"
  return {
    id: previous?.id,
    diagnosticStatusEventId: eventId ?? previous?.diagnosticStatusEventId ?? null,
    diagnosis: v.noDiagnosis!.trim(),
    occurredOn: v.noOccurredOn || null,
    receivesTreatment: treated,
    treatmentName: treated === false ? null : (text(v.noTreatment) ?? null),
    medication: treated === false ? null : (text(v.noMedication) ?? null),
    treatmentFrequency: toDuration(v.noFrequency),
    hasControls: controls,
    controlSpecialty: controls === true ? (v.noControlSpecialty ?? null) : null,
    controlPeriodicity: toDuration(v.noPeriodicity),
    status: discharged ? "DISCHARGED" : "ACTIVE",
    dischargedOn: discharged ? v.noDischargedOn || null : null,
    dischargeReason: discharged ? (text(v.noDischargeReason) ?? null) : null,
  }
}

export function BusquedaSection({ drafts, onDraftsChange, current, locked, ruledOutEventId, reportedOther }: Props) {
  const { values, answer } = useAnswers(
    () => initialValues(drafts, current, reportedOther),
    (v, changed) =>
      onDraftsChange((prev) => ({
        ...prev,
        diagnosticStatus: changed.startsWith("ds") ? statusDraft(v) : prev.diagnosticStatus,
        nonOncologicalFollowUp:
          changed.startsWith("no") || (changed === "dsStatus" && v.dsStatus === "RULED_OUT") ? nonOncologicalDraft(v, prev.nonOncologicalFollowUp, ruledOutEventId) : prev.nonOncologicalFollowUp,
      })),
  )
  const status = values.dsStatus ?? current?.status

  if (locked)
    return <TabNote>Este paciente se enroló con diagnóstico de cáncer, sin pasar por signos y síntomas: no hay una búsqueda diagnóstica que cerrar.</TabNote>
  return (
    <div className="space-y-6 border-t border-zinc-100 pt-5">
      {current && (
        <TabNote>
          Búsqueda diagnóstica actual: {diagnosticStatusLabels[current.status]}
          {current.occurredAt ? `, desde el ${formatDate(current.occurredAt)}` : ""}
          {current.supportedBySepa !== null ? `. Soporte SEPA: ${current.supportedBySepa ? "sí" : "no"}` : ""}.
        </TabNote>
      )}
      <QuestionForm groups={statusGroups} values={values} onChange={answer} />
      {values.dsStatus && (
        <TabNote>
          Al guardar el seguimiento el paciente pasará a{" "}
          {values.dsStatus === "CONFIRMED"
            ? `diagnóstico de cáncer, ${patientHealthSubcategoryLabels[values.dsSubcategory as keyof typeof patientHealthSubcategoryLabels]?.toLowerCase()}`
            : "control anual, en la subcategoría de pacientes con descarte"}
          .
        </TabNote>
      )}
      <MissingNote groups={statusGroups} values={values} what="el resultado de la búsqueda" />
      {status === "RULED_OUT" && (
        <>
          <QuestionForm groups={nonOncologicalGroups} values={values} onChange={answer} />
          <MissingNote groups={nonOncologicalGroups} values={values} what="el diagnóstico no oncológico" />
        </>
      )}
    </div>
  )
}
