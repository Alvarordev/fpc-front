import { CatalogPicker } from "./catalog-picker"
import { useCatalogSource } from "./catalog-source"
import { ChoiceGroup, DurationField, Field, ScaleField, SelectField, TextArea, TextInput } from "./form"
import { cn } from "@/lib/utils"
import type { Group, Question, Values } from "./questions"

// Dibuja grupos de preguntas (`questions.ts`). Las respuestas cortas son botones
// de un toque para registrar rápido mientras se conversa. `framed` pone cada
// grupo en un bloque blanco, para usarlo dentro de un `Modal`.

const YES_NO = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
]
const TRI = [...YES_NO, { value: "unknown", label: "No sabe" }]

export function QuestionForm({ groups, values, onChange, framed = false }: { groups: Group[]; values: Values; onChange: (id: string, value: string | null) => void; framed?: boolean }) {
  const visible = groups.filter((g) => !g.showIf || g.showIf(values))
  return (
    <div className={cn(framed ? "space-y-3" : "space-y-6")}>
      {visible.map((g) => {
        const body = (
          <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
            {g.questions
              .filter((q) => !q.showIf || q.showIf(values))
              .map((q) => (
                <QuestionField key={q.id} question={q} value={values[q.id] ?? null} values={values} onChange={onChange} />
              ))}
          </div>
        )
        return (
          <section key={g.title} className={framed ? "rounded-[18px] bg-white p-4 ring-1 ring-zinc-200/70" : "border-t border-zinc-100 pt-5 first:border-0 first:pt-0"}>
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-zinc-900">{g.title}</h4>
              {g.description && <p className="mt-0.5 text-[13px] text-zinc-500">{g.description}</p>}
            </div>
            {body}
          </section>
        )
      })}
    </div>
  )
}

function QuestionField({ question: q, value, values, onChange }: { question: Question; value: string | null; values: Values; onChange: (id: string, value: string | null) => void }) {
  const wide = q.wide ?? (q.type === "textarea" || q.type === "scale")
  const set = (v: string | null) => onChange(q.id, v)
  const options = q.optionsFrom?.(values) ?? q.options ?? []
  const text = (type: string) => (id: string) => <TextInput id={id} type={type} value={value ?? ""} onChange={(e) => set(e.target.value || null)} placeholder={q.placeholder} />
  return (
    <Field label={q.required ? `${q.label} *` : q.label} hint={q.hint} className={cn("animate-in fade-in-0 duration-200 motion-reduce:animate-none", wide && "md:col-span-2")}>
      {(id) => {
        switch (q.type) {
          case "yesno":
            return <ChoiceGroup label={q.label} value={value} onChange={set} options={YES_NO} />
          case "tri":
            return <ChoiceGroup label={q.label} value={value} onChange={set} options={TRI} />
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
            return <DurationField id={id} value={value} onChange={set} />
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
      }}
    </Field>
  )
}

function CatalogQuestion({ id, catalog, placeholder, value, onChange }: { id: string; catalog: string; placeholder?: string; value: string | null; onChange: (v: string) => void }) {
  const source = useCatalogSource()
  return (
    <CatalogPicker
      id={id}
      value={value}
      onChange={onChange}
      options={source.options(catalog)}
      searchable={source.searchable(catalog)}
      placeholder={placeholder ?? "Seleccionar"}
      addLabel={`Agregar ${source.singular(catalog)}`}
      onAdd={() => source.requestAdd(catalog, onChange)}
    />
  )
}
