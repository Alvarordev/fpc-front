import { QuestionForm } from "@/components/ds/question-form"
import type { Group, Values } from "@/components/ds/questions"
import { SectionBlock } from "../section-block"

export function ContactsSection({
  embedded,
  groups,
  values,
  showMissing,
  onChange,
}: {
  embedded?: boolean
  groups: Group[]
  values: Values
  showMissing: boolean
  onChange: (id: string, value: string | null) => void
}) {
  return (
    <SectionBlock embedded={embedded} title="Contacto para seguimiento">
      <QuestionForm groups={groups} values={values} showMissing={showMissing} onChange={onChange} />
    </SectionBlock>
  )
}
