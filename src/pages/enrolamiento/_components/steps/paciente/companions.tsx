import { useState } from "react"
import { Users } from "lucide-react"
import { FormModal } from "@/components/ds/form-modal"
import { QuestionForm } from "@/components/ds/question-form"
import type { Group, Values } from "@/components/ds/questions"
import { Item } from "@/components/ds/card"
import { RecordSection, RemoveButton } from "@/components/ds/record-section"
import type { CompanionDraft, EnrollmentDraft } from "../../../_store/enrollment-store"
import { SectionBlock } from "../section-block"
import { companionValues, toCompanion } from "./adapter"
import { personGroups } from "./config"

type Target = "primary" | "secondary" | "extra" | number

export function CompanionsSection({
  embedded,
  draft,
  callerReady,
  groups,
  values,
  showMissing,
  onChange,
  onPeople,
}: {
  embedded?: boolean
  draft: EnrollmentDraft
  callerReady: boolean
  groups: Group[]
  values: Values
  showMissing: boolean
  onChange: (id: string, value: string | null) => void
  onPeople: (partial: Partial<EnrollmentDraft>) => void
}) {
  const [target, setTarget] = useState<Target | null>(null)
  const caller = draft.companion
  const people: { id: Target; title: string; detail: string }[] = []
  if (draft.primaryContactSource === "NEW" && draft.primaryContact.fullName.trim()) {
    people.push({ id: "primary", title: draft.primaryContact.fullName, detail: "Contacto principal" })
  }
  if (draft.secondaryContactEnabled && draft.secondaryContactSource === "NEW" && draft.secondaryContact.fullName.trim()) {
    people.push({ id: "secondary", title: draft.secondaryContact.fullName, detail: "Contacto secundario" })
  }
  draft.additionalSecondaryContacts.forEach((person, index) => {
    if (person.fullName.trim()) people.push({ id: index, title: person.fullName, detail: `Contacto secundario ${index + 2}` })
  })

  function current(): CompanionDraft {
    if (target === "primary") return draft.primaryContact
    if (target === "secondary") return draft.secondaryContact
    if (typeof target === "number") return draft.additionalSecondaryContacts[target] ?? { fullName: "", primaryPhone: "" }
    return { fullName: "", primaryPhone: "" }
  }

  function save(nextValues: Values) {
    const person = toCompanion(nextValues)
    if (target === "primary") onPeople({ primaryContact: person, primaryContactSource: "NEW" })
    else if (target === "secondary") onPeople({ secondaryContact: person, secondaryContactSource: "NEW", secondaryContactEnabled: true })
    else if (typeof target === "number") {
      onPeople({
        additionalSecondaryContacts: draft.additionalSecondaryContacts.map((item, index) => (index === target ? person : item)),
      })
    } else {
      onPeople({
        secondaryContactEnabled: true,
        secondaryContactSource: draft.secondaryContactSource ?? "NEW",
        additionalSecondaryContacts: [...draft.additionalSecondaryContacts, person],
      })
    }
    setTarget(null)
  }

  function remove(id: Target) {
    if (id === "primary") onPeople({ primaryContact: { fullName: "", primaryPhone: "" } })
    else if (id === "secondary") onPeople({ secondaryContact: { fullName: "", primaryPhone: "" } })
    else onPeople({ additionalSecondaryContacts: draft.additionalSecondaryContacts.filter((_, index) => index !== id) })
  }

  function add() {
    if ((draft.primaryContactSource === "NEW" || !draft.primaryContactSource) && !draft.primaryContact.fullName.trim()) {
      setTarget("primary")
      return
    }
    if (draft.secondaryContactEnabled && draft.secondaryContactSource === "NEW" && !draft.secondaryContact.fullName.trim()) {
      setTarget("secondary")
      return
    }
    setTarget("extra")
  }

  return (
    <SectionBlock embedded={embedded} title="Acompañantes" description="Quién recibe el seguimiento y, si hace falta, otros contactos.">
      <QuestionForm groups={groups} values={values} showMissing={showMissing} onChange={onChange} />
      {callerReady && (values.primarySource === "CALLER" || values.secondarySource === "CALLER") && (
        <p className="mt-3 text-[13px] text-zinc-600">
          Se reutilizarán los datos de quien llama: {caller.fullName} · {caller.relationship} · {caller.primaryPhone}
        </p>
      )}
      <div className="mt-4">
        <RecordSection title="Personas registradas" addLabel="Agregar acompañante" onAdd={add} empty="Todavía no hay un acompañante nuevo.">
          {people.map((person) => (
            <Item
              key={String(person.id)}
              title={person.title}
              meta={person.detail}
              onOpen={() => setTarget(person.id)}
              actions={<RemoveButton label={`Quitar ${person.title}`} onClick={() => remove(person.id)} />}
            />
          ))}
        </RecordSection>
      </div>
      {target !== null && (
        <FormModal
          icon={Users}
          title="Acompañante"
          groups={personGroups}
          initial={companionValues(current())}
          submitLabel="Guardar acompañante"
          onClose={() => setTarget(null)}
          onSubmit={save}
        />
      )}
    </SectionBlock>
  )
}
