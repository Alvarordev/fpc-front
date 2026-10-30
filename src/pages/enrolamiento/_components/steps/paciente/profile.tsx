import { CatalogSelect } from "@/components/catalog-select"
import { Field } from "@/components/ds/form"
import { QuestionForm } from "@/components/ds/question-form"
import type { Values } from "@/components/ds/questions"
import type { EnrollmentDraft } from "../../../_store/enrollment-store"
import { SectionBlock } from "../section-block"
import { profileGroups } from "./config"

export function ProfileSection({
  embedded,
  draft,
  values,
  showMissing,
  onChange,
}: {
  embedded?: boolean
  draft: EnrollmentDraft
  values: Values
  showMissing: boolean
  onChange: (id: string, value: string | null) => void
}) {
  const insurance = draft.insurance
  const meta = draft.enrollmentMetadata
  const hasInsurance = values.hasInsurance === "yes"
  const [socio, insuranceGroup] = profileGroups
  return (
    <>
      <QuestionForm cards={!embedded} groups={[socio]} values={values} showMissing={showMissing} onChange={onChange} />
      <SectionBlock embedded={embedded} title="Seguro de salud">
        <QuestionForm groups={[{ ...insuranceGroup, title: "", questions: insuranceGroup.questions.filter((q) => q.id === "hasInsurance") }]} values={values} showMissing={showMissing} onChange={onChange} />
        {hasInsurance && (
          <div className="mt-4 grid gap-x-5 gap-y-4 md:grid-cols-2">
            <Field label="Tipo de seguro *">
              {() => (
                <CatalogSelect
                  kind="insurance_type"
                  excludeCodes={["NONE"]}
                  value={insurance.insuranceType === "NONE" ? null : insurance.insuranceType}
                  onValueChange={(code) => onChange("insuranceType", code)}
                  placeholder="Seleccionar"
                />
              )}
            </Field>
            <QuestionForm groups={[{ title: "", questions: insuranceGroup.questions.filter((q) => q.id !== "hasInsurance").map((q) => ({ ...q, wide: true })) }]} values={values} showMissing={showMissing} onChange={onChange} />
          </div>
        )}
      </SectionBlock>
      <SectionBlock embedded={embedded} title="Punto de ingreso">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="¿Cuál fue el punto de ingreso al programa?">
            {() => (
              <CatalogSelect
                kind="entry_source"
                value={meta.programEntryPoint ?? null}
                onValueChange={(code) => onChange("entry", code)}
                placeholder="Seleccionar"
              />
            )}
          </Field>
          <Field label="¿Cómo se enteró concretamente?">
            {() => (
              <CatalogSelect
                kind="entry_sub_source"
                parentCode={meta.programEntryPoint ?? null}
                value={meta.programEntrySubSource ?? null}
                onValueChange={(code) => onChange("entrySub", code)}
                placeholder="Seleccionar"
              />
            )}
          </Field>
        </div>
      </SectionBlock>
    </>
  )
}
