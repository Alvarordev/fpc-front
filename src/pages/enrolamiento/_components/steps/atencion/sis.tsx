import { QuestionForm } from "@/components/ds/question-form"
import type { Group } from "@/components/ds/questions"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import { SectionBlock } from "../section-block"

const groups: Group[] = [
  {
    title: "SIS",
    questions: [
      { id: "can", label: "¿Puede afiliarse al SIS?", type: "yesno", wide: true },
      { id: "expected", label: "Fecha esperada de afiliación", type: "date", showIf: (v) => v.can !== "no" },
      { id: "reason", label: "Motivo por el que no puede afiliarse", type: "text", showIf: (v) => v.can === "no" },
    ],
  },
]

export function SisSection({ embedded = false }: { embedded?: boolean }) {
  const { draft, updateDraft } = useEnrollmentStore()
  const sis = draft.sisAffiliation
  return (
    <SectionBlock embedded={embedded} title="Afiliación SIS">
      <QuestionForm
        groups={groups}
        values={{
          can: sis.canAffiliate === false ? "no" : "yes",
          expected: sis.expectedDate ?? null,
          reason: sis.cantAffiliateReason ?? null,
        }}
        onChange={(id, value) => {
          if (id === "can") {
            updateDraft({ sisAffiliation: { ...sis, canAffiliate: value !== "no", ...(value === "no" ? { expectedDate: null } : { cantAffiliateReason: null }) } })
            return
          }
          if (id === "expected") updateDraft({ sisAffiliation: { ...sis, expectedDate: value } })
          if (id === "reason") updateDraft({ sisAffiliation: { ...sis, cantAffiliateReason: value } })
        }}
      />
    </SectionBlock>
  )
}
