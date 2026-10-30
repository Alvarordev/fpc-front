import { useState } from "react"
import { Check, Users } from "lucide-react"
import { CatalogValue } from "@/components/catalog-select"
import { Chip } from "@/components/ds/badge"
import { Item } from "@/components/ds/card"
import { FormModal } from "@/components/ds/form-modal"
import { QuestionForm } from "@/components/ds/question-form"
import type { Group, Values } from "@/components/ds/questions"
import { RecordSection, RemoveButton } from "@/components/ds/record-section"
import { cn } from "@/lib/utils"
import type { CompanionDraft, EnrollmentDraft } from "../../../_store/enrollment-store"
import { CALLER, NEW_PERSON, personValue, secondaryCandidates, toggleSecondary } from "../../../_utils/contacts"
import { SectionBlock } from "../section-block"
import { companionValues, toCompanion } from "./adapter"
import { personGroups } from "./config"

// Contacto principal, contactos secundarios y los acompañantes del paciente.
// Quien llamó (paso Identificación) aparece como acompañante. Al pedir un
// contacto secundario sin nadie a quien marcar, se agrega uno ya marcado.

/** Qué crea o edita el modal: un acompañante nuevo con su rol, o uno existente. */
type Target = { kind: "new"; role: "primary" | "secondary" | "none" } | { kind: "edit"; index: number }

export function CompanionsSection({
  embedded,
  draft,
  callerReady,
  minor,
  tried,
  groups,
  values,
  showMissing,
  onChange,
  onPeople,
}: {
  embedded?: boolean
  draft: EnrollmentDraft
  callerReady: boolean
  minor: boolean
  /** Ya se intentó continuar: muestra el aviso de contacto secundario. */
  tried: boolean
  groups: Group[]
  values: Values
  showMissing: boolean
  onChange: (id: string, value: string | null) => void
  onPeople: (partial: Partial<EnrollmentDraft>) => void
}) {
  const [target, setTarget] = useState<Target | null>(null)
  const people = draft.contactPeople
  const askSecondary = draft.secondaryContactEnabled === true
  const candidates = secondaryCandidates(draft, callerReady)
  const missingSecondary = askSecondary && !candidates.some((item) => item.person.isSecondaryContact)

  function answer(id: string, value: string | null) {
    if (id === "primarySource" && value === NEW_PERSON) return setTarget({ kind: "new", role: "primary" })
    onChange(id, value)
    // Sin ningún acompañante, el contacto secundario se crea al momento. Si ya
    // hay alguno, se marca en su fila.
    if (id === "secondaryEnabled" && value === "yes" && people.length === 0 && !callerReady) setTarget({ kind: "new", role: "secondary" })
  }

  function save(next: Values) {
    if (!target) return
    const person = toCompanion(next)
    if (target.kind === "edit") {
      onPeople({ contactPeople: people.map((p, i) => (i === target.index ? { ...p, ...person } : p)) })
    } else {
      const added: CompanionDraft = {
        ...person,
        isPrimaryContact: target.role === "primary",
        isSecondaryContact: target.role === "secondary" || (target.role === "none" && askSecondary),
      }
      onPeople({
        contactPeople: [...people.map((p) => (target.role === "primary" ? { ...p, isPrimaryContact: false } : p)), added],
        ...(target.role === "primary" ? { primaryContactSource: "NEW" as const } : {}),
        ...(target.role === "secondary" ? { secondaryContactEnabled: true } : {}),
      })
    }
    setTarget(null)
  }

  function remove(index: number) {
    const wasPrimary = people[index]?.isPrimaryContact
    onPeople({
      contactPeople: people.filter((_, i) => i !== index),
      ...(wasPrimary ? { primaryContactSource: undefined } : {}),
    })
  }

  const rows = [
    ...(callerReady ? [{ key: CALLER, person: draft.companion, caller: true, index: -1 }] : []),
    ...people.map((person, index) => ({ key: personValue(index), person, caller: false, index })),
  ]
  const isPrimary = (row: (typeof rows)[number]) => (row.caller ? draft.primaryContactSource === CALLER : row.person.isPrimaryContact === true)

  return (
    <SectionBlock embedded={embedded} title="Acompañantes" description="Quién recibe el seguimiento y a quién más llamar">
      <QuestionForm groups={groups} values={values} showMissing={showMissing} onChange={answer} />
      <div className="mt-5">
        <RecordSection
          title="Personas cercanas al paciente"
          description={
            askSecondary
              ? candidates.length
                ? "Marca al menos uno como contacto secundario."
                : "El contacto principal no puede ser secundario. Agrega otro acompañante."
              : undefined
          }
          addLabel="Agregar acompañante"
          onAdd={() => setTarget({ kind: "new", role: "none" })}
          empty="Todavía no hay acompañantes."
        >
          {rows.map((row) => {
            const primary = isPrimary(row)
            const secondary = !primary && row.person.isSecondaryContact === true
            return (
              <Item
                key={row.key}
                title={row.person.fullName}
                tags={
                  <>
                    {primary && <Chip tone="blue">Contacto principal</Chip>}
                    {row.caller && <Chip>Quien llamó</Chip>}
                  </>
                }
                meta={
                  <>
                    {row.person.relationship && <CatalogValue kind="companion_relationship" code={row.person.relationship} />}
                    {row.person.relationship && row.person.primaryPhone ? " · " : ""}
                    {row.person.primaryPhone}
                  </>
                }
                onOpen={row.caller ? undefined : () => setTarget({ kind: "edit", index: row.index })}
                openLabel={`Editar a ${row.person.fullName}`}
                actions={
                  <>
                    {askSecondary && !primary && (
                      <SecondaryToggle on={secondary} onChange={(on) => onPeople(toggleSecondary(draft, row.key, on))} />
                    )}
                    {!row.caller && <RemoveButton label={`Quitar a ${row.person.fullName}`} onClick={() => remove(row.index)} />}
                  </>
                }
              />
            )
          })}
        </RecordSection>
        {missingSecondary && tried && (
          <p data-missing className="mt-2 text-xs text-red-700">
            {candidates.length ? "Marca al menos un acompañante como contacto secundario." : "Agrega un acompañante para tenerlo como contacto secundario."}
          </p>
        )}
        {minor && <p className="mt-3 text-[13px] text-zinc-500">El paciente es menor de edad: el contacto principal debe ser un acompañante o tutor.</p>}
      </div>
      {target && (
        <FormModal
          icon={Users}
          title={target.kind === "edit" ? "Editar acompañante" : target.role === "primary" ? "Contacto principal" : target.role === "secondary" ? "Contacto secundario" : "Nuevo acompañante"}
          description={target.kind === "new" && target.role === "none" ? (askSecondary ? "Queda marcado como contacto secundario; puedes desmarcarlo." : "Persona cercana al paciente") : undefined}
          groups={personGroups}
          initial={target.kind === "edit" ? companionValues(people[target.index]) : {}}
          submitLabel={target.kind === "edit" ? "Guardar cambios" : "Agregar"}
          onClose={() => setTarget(null)}
          onSubmit={save}
        />
      )}
    </SectionBlock>
  )
}

/** Marca de contacto secundario en la fila del acompañante. */
function SecondaryToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium whitespace-nowrap transition-[background-color,color,transform] active:scale-[0.97]",
        on ? "bg-zinc-900 text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:text-zinc-900",
      )}
    >
      {on && <Check className="size-3.5" />}
      Contacto secundario
    </button>
  )
}
