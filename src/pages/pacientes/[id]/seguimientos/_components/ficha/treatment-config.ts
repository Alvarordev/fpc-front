import { is, multiValues, yes, type Group, type Option, type Values } from "@/components/ds/questions"
import type { CreateTreatmentMedicationInput, PatientTreatment } from "@/api/patients"
import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { toDurationInput } from "@/types/duration"
import { interruptionReasonLabels } from "../../../_lib/clinical-labels"
import type { TreatmentDraft } from "../clinical-drafts"
import { compact, fromBool, fromDuration, fromNumber, text, toBool, toDuration, toInt } from "./answers"

// Preguntas de un tratamiento y de sus medicamentos, y su conversión al
// borrador que se guarda al completar el seguimiento.

export type Medication = NonNullable<TreatmentDraft["medications"]>[number]

export function treatmentGroups(diagnoses: Option[], replacing: boolean): Group[] {
  return [
    {
      title: "Tratamiento",
      questions: [
        { id: "diagnosisId", label: "Diagnóstico asociado", type: "select", options: diagnoses, required: true },
        { id: "type", label: "Tipo de tratamiento", type: "select", catalog: "treatment_type", required: true },
        { id: "chemoRoute", label: "Vía de quimioterapia", type: "select", catalog: "chemotherapy_route", showIf: is("type", "QUIMIOTERAPIA") },
        { id: "operation", label: "Procedimiento quirúrgico", type: "select", catalog: "surgical_procedure", required: true, showIf: is("type", "CIRUGIA") },
        { id: "program", label: "Programa de atención", type: "select", catalog: "care_program" },
        { id: "frequency", label: "Frecuencia del tratamiento", type: "duration", units: ["DAY", "WEEK", "MONTH", "YEAR"] },
        { id: "startDate", label: "Fecha de inicio", type: "date" },
        { id: "endDate", label: "Fecha de fin", type: "date", hint: "Opcional." },
        { id: "scheduled", label: "Sesiones programadas", type: "number" },
        { id: "completed", label: "Sesiones realizadas", type: "number" },
      ],
    },
    {
      title: "Situación",
      questions: [
        { id: "situation", label: "Situación del tratamiento", type: "select", catalog: "treatment_situation" },
        { id: "interruption", label: "Motivo de interrupción", type: "select", required: true, options: Object.entries(interruptionReasonLabels).map(([value, label]) => ({ value, label })), showIf: is("situation", "SUSPENDIDO") },
        { id: "interruptionOther", label: "Otro motivo de interrupción", type: "text", required: true, showIf: (v) => v.situation === "SUSPENDIDO" && v.interruption === "OTHER" },
        { id: "abandonment", label: "Motivo de abandono", type: "textarea", required: true, showIf: is("situation", "ABANDONADO") },
        { id: "notReceiving", label: "Motivo de no recibir tratamiento", type: "textarea", placeholder: "Completa si corresponde" },
        { id: "hormonal", label: "¿Cumplió el tratamiento hormonal?", type: "yesno" },
        { id: "barrier", label: "Barrera de acceso", type: "select", catalog: "access_barrier" },
        { id: "barrierOther", label: "Otra barrera", type: "text", showIf: is("barrier", "OTHER") },
        { id: "oriented", label: "¿Fue orientado ante las barreras de acceso?", type: "yesno" },
      ],
    },
    {
      title: "Dónde se atiende",
      questions: [
        { id: "referred", label: "¿Recibe este tratamiento por derivación?", type: "yesno", wide: true },
        { id: "source", label: "Hospital de origen", type: "select", catalog: HEALTH_CENTER, required: true, showIf: yes("referred") },
        { id: "receiving", label: "Hospital receptor", type: "select", catalog: HEALTH_CENTER, required: true, showIf: yes("referred") },
        { id: "receivingDirect", label: "Hospital donde recibe el tratamiento", type: "select", catalog: HEALTH_CENTER, showIf: (v) => v.referred !== "yes", wide: true },
        { id: "viaSepa", label: "¿Tratamiento gestionado desde SEPA?", type: "yesno" },
        { id: "tele", label: "¿Recibe teleconsulta?", type: "yesno" },
        { id: "teleNote", label: "Nota de teleconsulta", type: "text", showIf: yes("tele") },
        { id: "teleSpecialties", label: "Especialidades de teleconsulta", type: "multi", catalog: "medical_specialty", showIf: yes("tele"), wide: true },
      ],
    },
    {
      title: replacing ? "Motivo de la actualización" : "Motivo",
      questions: [{ id: "reason", label: replacing ? "¿Qué cambió en este tratamiento?" : "Motivo del cambio", type: "textarea", required: replacing, placeholder: replacing ? "Ej: pasó al ciclo 4 de 6" : "Opcional" }],
    },
  ]
}

export const DOSE_UNITS: Option[] = [
  { value: "MG", label: "mg" },
  { value: "G", label: "g" },
  { value: "ML", label: "ml" },
  { value: "UI", label: "UI" },
  { value: "TABLET", label: "Tableta" },
  { value: "DROP", label: "Gota" },
  { value: "OTHER", label: "Otro" },
]

const ROUTES: Option[] = [
  { value: "ORAL", label: "Oral" },
  { value: "IV", label: "Intravenosa" },
  { value: "IM", label: "Intramuscular" },
  { value: "SUBCUTANEOUS", label: "Subcutánea" },
  { value: "TOPICAL", label: "Tópica" },
  { value: "OTHER", label: "Otra" },
]

export const medicationGroups: Group[] = [
  {
    title: "Medicamento",
    questions: [
      { id: "name", label: "Nombre", type: "text", required: true, wide: true },
      { id: "doseAmount", label: "Cantidad por dosis", type: "number" },
      { id: "doseUnit", label: "Unidad", type: "select", options: DOSE_UNITS },
      { id: "doseDescription", label: "Descripción de la dosis", type: "text", placeholder: "Ej: media tableta" },
      { id: "route", label: "Vía de administración", type: "select", options: ROUTES },
      { id: "frequency", label: "Frecuencia", type: "duration", units: ["HOUR", "DAY", "WEEK", "MONTH"] },
      { id: "startDate", label: "Fecha de inicio", type: "date" },
      { id: "endDate", label: "Fecha de fin", type: "date" },
      { id: "active", label: "¿Lo sigue tomando?", type: "yesno" },
      { id: "notes", label: "Notas", type: "textarea" },
    ],
  },
]

export function medicationValues(m: Medication): Values {
  return compact({
    name: m.name,
    doseAmount: fromNumber(m.doseAmount),
    doseUnit: m.doseUnit,
    doseDescription: m.doseDescription,
    route: m.route,
    frequency: fromDuration(m.frequency),
    startDate: m.startDate,
    endDate: m.endDate,
    active: fromBool(m.isActive ?? true),
    notes: m.notes,
  })
}

export function toMedication(v: Values): Medication | string {
  const frequency = toDurationInput(toDuration(v.frequency))
  if (v.frequency && !frequency) return "Completa la frecuencia del medicamento"
  if (v.startDate && v.endDate && v.endDate < v.startDate) return "La fecha de fin del medicamento es anterior a la de inicio"
  return {
    name: v.name!.trim(),
    doseAmount: v.doseAmount ? Number(v.doseAmount) : undefined,
    doseUnit: (v.doseUnit ?? undefined) as CreateTreatmentMedicationInput["doseUnit"],
    doseDescription: text(v.doseDescription),
    route: (v.route ?? undefined) as CreateTreatmentMedicationInput["route"],
    frequency,
    startDate: v.startDate ?? undefined,
    endDate: v.endDate ?? undefined,
    isActive: toBool(v.active) ?? true,
    notes: text(v.notes),
  }
}

type Source = Pick<
  TreatmentDraft,
  | "diagnosisId"
  | "treatmentType"
  | "chemotherapyRoute"
  | "operationName"
  | "careProgram"
  | "startDate"
  | "endDate"
  | "scheduledSessions"
  | "completedSessions"
  | "treatmentSituation"
  | "interruptionReason"
  | "interruptionReasonOther"
  | "treatmentAbandonmentReason"
  | "notReceivingReason"
  | "hormonalTreatmentCompleted"
  | "accessBarrierCode"
  | "accessBarrierOther"
  | "orientedRegardingBarriers"
  | "isReferred"
  | "sourceHealthCenterId"
  | "receivingHealthCenterId"
  | "treatmentViaSepa"
  | "receivesTeleconsultation"
  | "teleconsultationNote"
  | "teleconsultationSpecialties"
  | "changeReason"
> & { treatmentFrequency?: unknown }

type Nullable<T> = { [K in keyof T]?: T[K] | null }

/** Respuestas a partir de un tratamiento guardado o de un borrador. */
export function treatmentValues(t: Nullable<Source>): Values {
  return compact({
    diagnosisId: t.diagnosisId,
    type: t.treatmentType,
    chemoRoute: t.chemotherapyRoute,
    operation: t.operationName,
    program: t.careProgram,
    frequency: fromDuration(t.treatmentFrequency),
    startDate: t.startDate,
    endDate: t.endDate,
    scheduled: fromNumber(t.scheduledSessions),
    completed: fromNumber(t.completedSessions),
    situation: t.treatmentSituation,
    interruption: t.interruptionReason,
    interruptionOther: t.interruptionReasonOther,
    abandonment: t.treatmentAbandonmentReason,
    notReceiving: t.notReceivingReason,
    hormonal: fromBool(t.hormonalTreatmentCompleted ?? undefined),
    barrier: t.accessBarrierCode,
    barrierOther: t.accessBarrierOther,
    oriented: fromBool(t.orientedRegardingBarriers ?? undefined),
    referred: fromBool(t.isReferred ?? false),
    source: t.sourceHealthCenterId,
    receiving: t.isReferred ? t.receivingHealthCenterId : undefined,
    receivingDirect: t.isReferred ? undefined : t.receivingHealthCenterId,
    viaSepa: fromBool(t.treatmentViaSepa ?? undefined),
    tele: fromBool(t.receivesTeleconsultation ?? undefined),
    teleNote: t.teleconsultationNote,
    teleSpecialties: t.teleconsultationSpecialties?.join(","),
    reason: t.changeReason,
  })
}

export const savedTreatmentValues = (t: PatientTreatment) => ({ ...treatmentValues(t as Nullable<Source>), reason: null })

/** Borrador del tratamiento; devuelve el error en texto si algo no cuadra. */
export function toTreatment(v: Values, base: Pick<TreatmentDraft, "mode" | "seriesId">, medications: Medication[]): TreatmentDraft | string {
  const frequency = toDurationInput(toDuration(v.frequency))
  if (v.frequency && !frequency) return "Completa correctamente la frecuencia del tratamiento"
  const referred = v.referred === "yes"
  if (referred && v.source === v.receiving) return "El hospital de origen y el receptor deben ser diferentes"
  if (v.startDate && v.endDate && v.endDate < v.startDate) return "La fecha de fin debe ser igual o posterior a la de inicio"
  const tele = toBool(v.tele)
  const specialties = multiValues(v.teleSpecialties)
  return {
    ...base,
    diagnosisId: v.diagnosisId!,
    treatmentType: v.type!,
    treatmentFrequency: frequency,
    treatmentSituation: (v.situation ?? undefined) as TreatmentDraft["treatmentSituation"],
    operationName: v.type === "CIRUGIA" ? text(v.operation) : undefined,
    chemotherapyRoute: v.type === "QUIMIOTERAPIA" ? text(v.chemoRoute) : undefined,
    careProgram: (v.program ?? undefined) as TreatmentDraft["careProgram"],
    receivesTeleconsultation: tele,
    ...(tele ? { teleconsultationNote: text(v.teleNote), ...(specialties.length ? { teleconsultationSpecialties: specialties } : {}) } : {}),
    ...(v.situation === "ABANDONADO" ? { treatmentAbandonmentReason: text(v.abandonment) } : {}),
    interruptionReason: v.situation === "SUSPENDIDO" ? ((v.interruption ?? undefined) as TreatmentDraft["interruptionReason"]) : undefined,
    interruptionReasonOther: v.situation === "SUSPENDIDO" && v.interruption === "OTHER" ? text(v.interruptionOther) : undefined,
    treatmentViaSepa: toBool(v.viaSepa),
    scheduledSessions: toInt(v.scheduled),
    completedSessions: toInt(v.completed),
    hormonalTreatmentCompleted: toBool(v.hormonal),
    accessBarrierCode: (v.barrier ?? undefined) as TreatmentDraft["accessBarrierCode"],
    accessBarrierOther: v.barrier === "OTHER" ? text(v.barrierOther) : undefined,
    orientedRegardingBarriers: toBool(v.oriented),
    isReferred: referred,
    sourceHealthCenterId: referred ? (v.source ?? undefined) : undefined,
    receivingHealthCenterId: (referred ? v.receiving : v.receivingDirect) ?? undefined,
    startDate: v.startDate ?? undefined,
    endDate: v.endDate ?? undefined,
    notReceivingReason: text(v.notReceiving),
    changeReason: text(v.reason),
    ...(medications.length ? { medications } : {}),
  }
}
