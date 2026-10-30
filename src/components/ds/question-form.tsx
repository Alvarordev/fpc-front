import { useState } from "react"
import { CatalogPicker } from "./catalog-picker"
import { useCatalogSource } from "./catalog-source"
import { ChoiceGroup, DurationField, Field, ScaleField, SelectField, TextArea, TextInput } from "./form"
import { cn } from "@/lib/utils"
import { Chip } from "./badge"
import { Card } from "./card"
import { RemoveButton } from "./record-section"
import { multiValues, type Group, type Question, type Values } from "./questions"

// Dibuja grupos de preguntas (`questions.ts`). Las respuestas cortas son botones
// de un toque para registrar rápido mientras se conversa. `framed` pone cada
// grupo en un bloque blanco, para usarlo dentro de un `Modal`; `cards` pone cada
// grupo en su `Card`, para usarlo suelto en una pantalla. Sin ninguno de los dos,
// el título del grupo es un subtítulo pequeño dentro de la tarjeta que lo contiene.
// `showMissing` marca en rojo las preguntas `required` que siguen vacías. No
// deshabilita el envío: el aviso de cuántas faltan vive fuera.

const YES_NO = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
]
const TRI = [...YES_NO, { value: "unknown", label: "No sabe" }]

export function QuestionForm({
  groups,
  values,
  onChange,
  framed = false,
  cards = false,
  showMissing = false,
}: {
  groups: Group[]
  values: Values
  onChange: (id: string, value: string | null) => void
  framed?: boolean
  /** Cada grupo en su propia tarjeta (título 15px). */
  cards?: boolean
  /** Marca en rojo cada obligatorio visible que sigue vacío. */
  showMissing?: boolean
}) {
  const visible = groups.filter((g) => !g.showIf || g.showIf(values))
  return (
    <div className={cn(framed ? "space-y-3" : cards ? "space-y-4" : "space-y-6")}>
      {visible.map((g) => {
        const body = (
          <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
            {g.questions
              .filter((q) => !q.showIf || q.showIf(values))
              .map((q) => (
                <QuestionField
                  key={q.id}
                  question={q}
                  value={values[q.id] ?? null}
                  values={values}
                  onChange={onChange}
                  showMissing={showMissing}
                />
              ))}
          </div>
        )
        if (cards)
          return (
            <Card key={g.title || "group"} title={g.title || undefined} description={g.description}>
              {body}
            </Card>
          )
        return (
          <section key={g.title || "group"} className={framed ? "rounded-[18px] bg-white p-4 ring-1 ring-zinc-200/70" : "border-t border-zinc-100 pt-5 first:border-0 first:pt-0"}>
            {g.title && (
              <div className="mb-4">
                <h4 className={framed ? "text-sm font-semibold text-zinc-900" : "text-xs font-semibold tracking-wide text-zinc-500 uppercase"}>{g.title}</h4>
                {g.description && <p className="mt-1 text-[13px] text-zinc-500">{g.description}</p>}
              </div>
            )}
            {body}
          </section>
        )
      })}
    </div>
  )
}

function QuestionField({
  question: q,
  value,
  values,
  onChange,
  showMissing,
}: {
  question: Question
  value: string | null
  values: Values
  onChange: (id: string, value: string | null) => void
  showMissing: boolean
}) {
  const wide = q.wide ?? (q.type === "textarea" || q.type === "scale")
  const missing = showMissing && !!q.required && !value
  const set = (v: string | null) => onChange(q.id, v)
  const options = q.optionsFrom?.(values) ?? q.options ?? []
  const text = (type: string) => (id: string) => <TextInput id={id} type={type} value={value ?? ""} onChange={(e) => set(e.target.value || null)} placeholder={q.placeholder} />
  return (
    <Field label={q.required ? `${q.label} *` : q.label} hint={q.hint} error={missing ? "Falta responder" : undefined} className={cn("animate-in fade-in-0 duration-200 motion-reduce:animate-none", wide && "md:col-span-2")}>
      {(id) => {
        const control = (() => {
          switch (q.type) {
            case "yesno":
              return <ChoiceGroup label={q.label} value={value} onChange={set} options={YES_NO} />
            case "tri":
              return <ChoiceGroup label={q.label} value={value} onChange={set} options={q.options ?? TRI} />
            case "choice":
              return options.length ? <ChoiceGroup label={q.label} value={value} onChange={set} options={options} /> : <p className="text-[13px] text-zinc-500">No hay opciones disponibles.</p>
            case "select":
              if (q.catalog) return <CatalogQuestion id={id} catalog={q.catalog} placeholder={q.placeholder} value={value} onChange={set} />
              return <SelectField id={id} value={value} onChange={set} options={options} placeholder={q.placeholder ?? "Seleccionar"} />
            case "textarea":
              return <TextArea id={id} value={value ?? ""} onChange={(e) => set(e.target.value || null)} placeholder={q.placeholder} className="min-h-20" />
            case "scale":
              return <ScaleField value={value} onChange={set} label={q.label} />
            case "duration":
              return <DurationField id={id} value={value} onChange={set} units={q.units} />
            case "multi":
              return q.catalog ? <MultiCatalogQuestion id={id} catalog={q.catalog} placeholder={q.placeholder} value={value} onChange={set} /> : null
            case "number":
              return <TextInput id={id} type="number" min={0} inputMode="numeric" value={value ?? ""} onChange={(e) => set(e.target.value || null)} placeholder={q.placeholder} />
            case "date":
              return text("date")(id)
            case "time":
              return text("time")(id)
            case "datetime":
              return text("datetime-local")(id)
            default:
              return text("text")(id)
          }
        })()
        return (
          <div className={cn(missing && "[&_input]:ring-red-300 [&_textarea]:ring-red-300")} data-missing={missing || undefined}>
            {control}
          </div>
        )
      }}
    </Field>
  )
}

function CatalogQuestion({ id, catalog, placeholder, value, onChange }: { id: string; catalog: string; placeholder?: string; value: string | null; onChange: (v: string) => void }) {
  const source = useCatalogSource()
  const [query, setQuery] = useState("")
  const { options, loading } = source.useOptions(catalog, query, value)
  return (
    <CatalogPicker
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      onQueryChange={setQuery}
      loading={loading}
      searchable={source.searchable(catalog)}
      placeholder={placeholder ?? "Seleccionar"}
      addLabel={`Agregar ${source.singular(catalog)}`}
      onAdd={source.canAdd(catalog) ? () => source.requestAdd(catalog, onChange) : undefined}
    />
  )
}

/** Varias opciones de un catálogo: se agregan con el selector y se quitan de la lista. */
function MultiCatalogQuestion({ id, catalog, placeholder, value, onChange }: { id: string; catalog: string; placeholder?: string; value: string | null; onChange: (v: string | null) => void }) {
  const source = useCatalogSource()
  const [query, setQuery] = useState("")
  const selected = multiValues(value)
  const { options, loading } = source.useOptions(catalog, query, null)
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v
  const add = (v: string) => !selected.includes(v) && onChange([...selected, v].join(","))
  return (
    <div className="space-y-2">
      <CatalogPicker
        id={id}
        value={null}
        onChange={add}
        options={options.filter((o) => !selected.includes(o.value))}
        onQueryChange={setQuery}
        loading={loading}
        searchable={source.searchable(catalog)}
        placeholder={placeholder ?? "Agregar"}
        addLabel={`Agregar ${source.singular(catalog)}`}
        onAdd={source.canAdd(catalog) ? () => source.requestAdd(catalog, add) : undefined}
      />
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((v) => (
            <span key={v} className="inline-flex items-center gap-0.5">
              <Chip tone="blue">{labelOf(v)}</Chip>
              <RemoveButton label={`Quitar ${labelOf(v)}`} onClick={() => onChange(selected.filter((x) => x !== v).join(",") || null)} />
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
