import { QuestionForm } from "@/components/ds/question-form"
import type { Values } from "@/components/ds/questions"
import { SectionBlock } from "../section-block"
import { residenceGroups } from "./config"

export function ResidenceSection({
  embedded,
  values,
  showMissing,
  onChange,
}: {
  embedded?: boolean
  values: Values
  showMissing: boolean
  onChange: (id: string, value: string | null) => void
}) {
  return (
    <SectionBlock embedded={embedded} title="Datos de procedencia y residencia">
      <QuestionForm groups={residenceGroups} values={values} showMissing={showMissing} onChange={onChange} />
    </SectionBlock>
  )
}
