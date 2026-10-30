import { QuestionForm } from "@/components/ds/question-form"
import type { Group, Values } from "@/components/ds/questions"
import { withIcons } from "../../../_utils/section-icons"

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
  // Cada grupo es su propia tarjeta; en el modo continuo, un subtítulo dentro del paso.
  return <QuestionForm cards={!embedded} groups={withIcons(groups)} values={values} showMissing={showMissing} onChange={onChange} />
}
