import { QuestionForm } from "@/components/ds/question-form"
import type { Values } from "@/components/ds/questions"
import { residenceGroups } from "./config"
import { withIcons } from "../../../_utils/section-icons"

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
  // Cada grupo es su propia tarjeta; en el modo continuo, un subtítulo dentro del paso.
  return <QuestionForm cards={!embedded} groups={withIcons(residenceGroups)} values={values} showMissing={showMissing} onChange={onChange} />
}
