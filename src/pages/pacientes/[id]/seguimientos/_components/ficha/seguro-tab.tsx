import { QuestionForm } from "@/components/ds/question-form"
import { is, yes, type Group, type Values } from "@/components/ds/questions"
import type { PatientInsurance, PatientSisAffiliation } from "@/api/patients"
import type { EpsProvider, InsuranceType } from "../../../_lib/clinical-labels"
import type { InsuranceDraft, SisAffiliationDraft } from "../clinical-drafts"
import { compact, fromBool, text, toBool, useAnswers } from "./answers"
import type { SheetTabProps } from "./sheet-types"

// Seguro: el seguro actual y su afiliación, separada por SIS (o sin seguro) y
// EsSalud: cada una alimenta su propio indicador de atribución SEPA.

const groups: Group[] = [
  {
    title: "Seguro de salud",
    description: "Registra el seguro actual. Si cambió, indica desde cuándo y por qué.",
    questions: [
      { id: "type", label: "Tipo de seguro", type: "select", catalog: "insurance_type", required: true },
      { id: "eps", label: "Proveedor EPS", type: "select", catalog: "eps_provider", showIf: is("type", "EPS") },
      { id: "startDate", label: "Fecha de afiliación", type: "date" },
      { id: "reason", label: "Motivo del cambio", type: "text", placeholder: "Opcional" },
    ],
  },
  {
    title: "Afiliación SIS",
    showIf: is("type", "SIS", "NONE"),
    questions: [
      { id: "sisViaSepa", label: "¿Afiliación al SIS desde SEPA?", type: "yesno", showIf: is("type", "SIS") },
      { id: "canAffiliate", label: "¿Puede afiliarse al SIS?", type: "yesno", showIf: is("type", "NONE") },
      { id: "expectedDate", label: "Fecha esperada de afiliación", type: "date", showIf: (v) => v.type === "NONE" && yes("canAffiliate")(v) },
    ],
  },
  {
    title: "Afiliación EsSalud",
    showIf: is("type", "ESSALUD"),
    questions: [{ id: "essaludViaSepa", label: "¿Afiliación al ESSALUD desde SEPA?", type: "yesno" }],
  },
]

type Props = SheetTabProps & {
  currentInsurance: PatientInsurance | undefined
  currentSis: PatientSisAffiliation | undefined
}

function initialValues({ drafts, currentInsurance: ins, currentSis: sis }: Props): Values {
  const draft = drafts.insurance
  const type = draft?.insuranceType ?? ins?.insuranceType
  return compact({
    type,
    eps: draft?.epsProvider ?? ins?.epsProvider,
    startDate: draft?.startDate ?? ins?.startDate,
    reason: draft?.changeReason,
    sisViaSepa: fromBool(drafts.sisAffiliation?.affiliatedViaSepa ?? sis?.affiliatedViaSepa ?? undefined),
    essaludViaSepa: fromBool(draft?.affiliatedViaSepa ?? ins?.affiliatedViaSepa ?? undefined),
    canAffiliate: fromBool(drafts.sisAffiliation?.canAffiliate ?? sis?.canAffiliate),
    expectedDate: drafts.sisAffiliation?.expectedDate ?? sis?.expectedDate,
  })
}

function toDrafts(v: Values): { insurance?: InsuranceDraft; sisAffiliation?: SisAffiliationDraft } {
  if (!v.type) return {}
  const type = v.type as InsuranceType
  const insurance: InsuranceDraft = {
    insuranceType: type,
    epsProvider: type === "EPS" ? ((v.eps ?? undefined) as EpsProvider | undefined) : undefined,
    changeReason: text(v.reason),
    startDate: v.startDate ?? undefined,
    ...(type === "ESSALUD" ? { affiliatedViaSepa: toBool(v.essaludViaSepa) } : {}),
  }
  const sisAffiliation: SisAffiliationDraft | undefined =
    type === "SIS"
      ? { canAffiliate: true, affiliatedViaSepa: toBool(v.sisViaSepa), affiliatedAt: v.startDate ?? undefined }
      : type === "NONE"
        ? { canAffiliate: toBool(v.canAffiliate) ?? false, expectedDate: v.expectedDate ?? undefined }
        : undefined
  return { insurance, sisAffiliation }
}

export function SeguroTab(props: Props) {
  const { values, answer } = useAnswers(
    () => initialValues(props),
    (v) => props.onDraftsChange((prev) => ({ ...prev, ...toDrafts(v) })),
  )
  return <QuestionForm groups={groups} values={values} onChange={answer} />
}
