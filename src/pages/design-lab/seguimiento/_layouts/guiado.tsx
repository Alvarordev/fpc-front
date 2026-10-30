import { StepSection } from "@/components/ds/step-section"
import type { MockPatient } from "../../_data/mock-patient"
import type { MockFollowUp } from "../_data/mock-follow-up"
import { DerivedActionsCard, NotesDock } from "../_parts/actions"
import { AttemptsCard, NotesCard, OverdueNotice } from "../_parts/contact"
import { ClinicalGlanceCard, OutcomesCard } from "../_parts/context"
import { FollowUpHeader } from "../_parts/header"
import { CatalogProvider } from "../_parts/sheet/catalog-provider"
import { ClinicalSheet } from "../_parts/sheet/clinical-sheet"
import { useFollowUpDraft } from "../_parts/use-draft"

// Guiado: una columna en el orden en que ocurre el seguimiento. La ficha clínica
// es el centro; la nota y el cierre van en un panel fijo al pie, siempre a mano.

export function GuiadoLayout({ followUp, patient }: { followUp: MockFollowUp; patient: MockPatient }) {
  const draft = useFollowUpDraft(followUp)
  const isOpen = followUp.status === "SCHEDULED" || followUp.status === "OVERDUE"
  return (
    <div className="mx-auto max-w-[1120px] space-y-4 px-4 py-6 sm:px-6">
      <FollowUpHeader followUp={followUp} patient={patient} isOpen={isOpen} />
      {followUp.status === "OVERDUE" && <OverdueNotice />}

      {isOpen ? (
        <>
          <StepSection n={1} title="Contacta al paciente" done={draft.contacted}>
            <AttemptsCard draft={draft} editable />
          </StepSection>
          <CatalogProvider>
            <StepSection n={2} title="Actualiza la ficha clínica" done={draft.changedTabs.size > 0}>
              <ClinicalSheet patient={patient} draft={draft} />
            </StepSection>
            <StepSection n={3} title="Decide los siguientes pasos" done={draft.derived.length > 0}>
              <DerivedActionsCard draft={draft} patient={patient} />
            </StepSection>
          </CatalogProvider>
          <NotesDock draft={draft} patient={patient} />
        </>
      ) : (
        <>
          <OutcomesCard followUp={followUp} />
          <div className="grid gap-4 lg:grid-cols-2">
            <NotesCard draft={draft} patient={patient} />
            <AttemptsCard draft={draft} editable={false} />
          </div>
          <ClinicalGlanceCard patient={patient} />
        </>
      )}
    </div>
  )
}

