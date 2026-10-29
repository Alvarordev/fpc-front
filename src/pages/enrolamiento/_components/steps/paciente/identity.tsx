import { InlineAlert } from "@/components/ds/inline-alert"
import { Field } from "@/components/ds/form"
import { QuestionForm } from "@/components/ds/question-form"
import type { Values } from "@/components/ds/questions"
import { IdentityDocumentInput } from "@/components/identity-document-input"
import type { IdentityDocumentType } from "@/types/identity-document"
import { EnrollmentDniLookup } from "../../enrollment-dni-lookup"
import type { EnrollmentDraft } from "../../../_store/enrollment-store"
import { SectionBlock } from "../section-block"
import { identityGroups } from "./config"

export function IdentitySection({
  embedded,
  draft,
  minor,
  values,
  showMissing,
  onChange,
  onDocument,
  onReenroll,
}: {
  embedded?: boolean
  draft: EnrollmentDraft
  minor: boolean
  values: Values
  showMissing: boolean
  onChange: (id: string, value: string | null) => void
  onDocument: (type: IdentityDocumentType, number: string) => void
  onReenroll: (patientId: string) => void
}) {
  const pd = draft.patientData
  return (
    <SectionBlock embedded={embedded} title="Información de identidad" description="Documento, nombre y fecha de nacimiento del paciente.">
      <div className="mb-4 max-w-md">
        <Field label="Documento de identidad">
          {() => (
            <IdentityDocumentInput
              type={(pd.documentType ?? "DNI") as IdentityDocumentType}
              number={pd.dni ?? ""}
              onChange={({ type, number }) => onDocument(type, number)}
            />
          )}
        </Field>
        <div className="mt-2">
          <EnrollmentDniLookup
            documentType={pd.documentType}
            dni={pd.dni}
            patientId={draft.patientId}
            onReenroll={(patient) => onReenroll(patient.id)}
          />
        </div>
      </div>
      <QuestionForm groups={identityGroups} values={values} showMissing={showMissing} onChange={onChange} />
      {minor && (
        <div className="mt-4">
          <InlineAlert tone="warning">Paciente menor de edad. El contacto principal debe ser un acompañante o tutor.</InlineAlert>
        </div>
      )}
    </SectionBlock>
  )
}
