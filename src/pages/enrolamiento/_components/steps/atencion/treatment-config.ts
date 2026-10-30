import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { compact, fromDuration, text, toDuration } from "@/pages/pacientes/[id]/seguimientos/_components/ficha/answers"
import { is, yes, type Group, type Option, type Values } from "@/components/ds/questions"
import { interruptionReasonLabels } from "@/pages/pacientes/[id]/_lib/clinical-labels"
import type { InterruptionReason, TreatmentSituation } from "@/types"
import type { EnrollmentTreatmentDraft } from "../../../_store/enrollment-store"

export function treatmentGroups(diagnoses: Option[]): Group[] {
  return [
    {
      title: "Tratamiento",
      questions: [
        { id: "diagnosisId", label: "Diagnóstico asociado", type: "select", options: diagnoses, required: true, wide: true },
        { id: "type", label: "Tipo de tratamiento", type: "select", catalog: "treatment_type", required: true },
        { id: "operation", label: "Procedimiento quirúrgico", type: "select", catalog: "surgical_procedure", required: true, showIf: is("type", "CIRUGIA") },
        { id: "chemoRoute", label: "Vía de quimioterapia", type: "select", catalog: "chemotherapy_route", showIf: is("type", "QUIMIOTERAPIA") },
        { id: "frequency", label: "Frecuencia del tratamiento", type: "duration", units: ["DAY", "WEEK", "MONTH", "YEAR"] },
        { id: "startDate", label: "Fecha de inicio", type: "date" },
        { id: "endDate", label: "Fecha de fin", type: "date" },
      ],
    },
    {
      title: "Situación",
      questions: [
        { id: "situation", label: "Situación del tratamiento", type: "select", catalog: "treatment_situation" },
        {
          id: "interruption",
          label: "Motivo de interrupción",
          type: "select",
          required: true,
          options: Object.entries(interruptionReasonLabels).map(([value, label]) => ({ value, label })),
          showIf: is("situation", "SUSPENDIDO"),
        },
        { id: "interruptionOther", label: "Otro motivo de interrupción", type: "text", required: true, showIf: (v) => v.situation === "SUSPENDIDO" && v.interruption === "OTHER" },
        { id: "abandonment", label: "Motivo de abandono", type: "textarea", required: true, showIf: is("situation", "ABANDONADO") },
      ],
    },
    {
      title: "Dónde se atiende",
      questions: [
        { id: "referred", label: "¿Recibe este tratamiento por derivación?", type: "yesno", wide: true },
        { id: "source", label: "Hospital de origen", type: "select", catalog: HEALTH_CENTER, required: true, showIf: yes("referred") },
        { id: "receiving", label: "Hospital receptor", type: "select", catalog: HEALTH_CENTER, required: true, showIf: yes("referred") },
      ],
    },
  ]
}

export function treatmentValues(treatment: EnrollmentTreatmentDraft): Values {
  return compact({
    diagnosisId: treatment.diagnosisRef,
    type: treatment.treatmentType,
    operation: treatment.operationName,
    chemoRoute: treatment.chemotherapyRoute,
    frequency: fromDuration(treatment.treatmentFrequency),
    startDate: treatment.startDate,
    endDate: treatment.endDate,
    situation: treatment.treatmentSituation,
    interruption: treatment.interruptionReason,
    interruptionOther: treatment.interruptionReasonOther,
    abandonment: treatment.treatmentAbandonmentReason,
    referred: treatment.isReferred ? "yes" : "no",
    source: treatment.sourceHealthCenterId,
    receiving: treatment.receivingHealthCenterId,
  })
}

export function toTreatment(values: Values, base: EnrollmentTreatmentDraft): EnrollmentTreatmentDraft {
  const referred = values.referred === "yes"
  const situation = (values.situation || null) as TreatmentSituation | null
  return {
    ...base,
    diagnosisRef: values.diagnosisId || base.diagnosisRef,
    treatmentType: values.type?.trim() ?? "",
    operationName: values.type === "CIRUGIA" ? text(values.operation) : undefined,
    chemotherapyRoute: values.type === "QUIMIOTERAPIA" ? text(values.chemoRoute) : undefined,
    treatmentFrequency: toDuration(values.frequency),
    startDate: text(values.startDate) ?? null,
    endDate: text(values.endDate) ?? null,
    treatmentSituation: situation,
    interruptionReason: situation === "SUSPENDIDO" ? (values.interruption as InterruptionReason) : undefined,
    interruptionReasonOther: situation === "SUSPENDIDO" && values.interruption === "OTHER" ? text(values.interruptionOther) : undefined,
    treatmentAbandonmentReason: situation === "ABANDONADO" ? text(values.abandonment) : undefined,
    isReferred: referred,
    sourceHealthCenterId: referred ? text(values.source) : undefined,
    receivingHealthCenterId: referred ? text(values.receiving) : undefined,
    isCurrent: true,
  }
}
