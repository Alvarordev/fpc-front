import { QuestionForm } from "@/components/ds/question-form"
import { catalogSelectItems, useCatalog } from "@/hooks/use-catalog"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import { SectionBlock } from "../section-block"
import { applySymptom, symptomValues } from "./symptom-adapter"
import { symptomGroups } from "./symptom-config"

export function SymptomsSection({ embedded = false, historical = false }: { embedded?: boolean; historical?: boolean }) {
  const { draft, updateDraft } = useEnrollmentStore()
  const report = draft.symptomReport
  const catalog = useCatalog("cancer_diagnosis")
  const codes = new Set(catalogSelectItems(catalog.data ?? []).map((item) => item.value))
  const reported = report.reportedDiagnosis?.trim() ?? ""
  const other = catalog.isFetched && Boolean(reported) && !codes.has(reported)
  const values = symptomValues(report, other)

  return (
    <SectionBlock embedded={embedded} title="Signos y síntomas">
      <QuestionForm
        groups={symptomGroups}
        values={values}
        onChange={(id, value) => updateDraft({ symptomReport: applySymptom(report, id, value, historical, other) })}
      />
    </SectionBlock>
  )
}
