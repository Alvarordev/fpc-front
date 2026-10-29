import { useId } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Controles de formulario del sistema de diseño. Misma altura (36px), radio de
// 10px y borde fino que los botones; el foco es un anillo oscuro suave.

const control =
  "w-full rounded-[10px] bg-white text-sm text-zinc-900 ring-1 ring-zinc-200 transition-[box-shadow] outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500"

/** Etiqueta, control y ayuda. El `id` se pasa al control con `children(id)`. */
export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: (id: string) => React.ReactNode
}) {
  const id = useId()
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <label htmlFor={id} className="block text-[13px] font-medium text-zinc-700">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(control, "h-9 px-3", className)} {...props} />
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24 resize-y px-3 py-2.5 leading-relaxed", className)} {...props} />
}

/**
 * Select con la tabla de etiquetas en la raíz (`items`), para que el valor ya
 * asignado nunca se muestre crudo (regla de AGENTS.md).
 */
export function SelectField<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder = "Seleccionar",
  disabled,
}: {
  id?: string
  value: T | null
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => v && onChange(v as T)} disabled={disabled}>
      <SelectTrigger id={id} className={cn(control, "h-9 w-full justify-between rounded-[10px] border-0 px-3 shadow-none")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        sideOffset={6}
        className="font-ds max-h-72 rounded-[14px] bg-white p-1.5 text-zinc-900 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.25)] ring-1 ring-zinc-200"
      >
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="cursor-pointer rounded-[9px] py-2 pr-8 pl-2.5 focus:bg-zinc-100 focus:text-zinc-900">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Opciones cortas excluyentes (Sí / No, canal, resultado) como botones. */
export function ChoiceGroup<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T | null
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium transition-[background-color,color,box-shadow,transform] active:scale-[0.97]",
              active ? "bg-zinc-900 text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50",
            )}
          >
            {o.icon && <o.icon className="size-4" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Escala 0 a 10 de un toque (p. ej. intensidad del dolor); el color sube de verde a rojo. */
export function ScaleField({ value, onChange, label, max = 10 }: { value: string | null; onChange: (v: string) => void; label: string; max?: number }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {Array.from({ length: max + 1 }, (_, n) => {
        const active = value === String(n)
        const ratio = n / max
        const tone = ratio <= 0.3 ? "bg-emerald-600" : ratio <= 0.6 ? "bg-amber-500" : "bg-red-600"
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(String(n))}
            className={cn(
              "size-9 cursor-pointer rounded-[10px] text-sm font-medium tabular-nums transition-[background-color,color,transform] active:scale-[0.94]",
              active ? `${tone} text-white` : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50",
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

const DURATION_UNITS = [
  { value: "minutes", label: "minutos" },
  { value: "hours", label: "horas" },
  { value: "days", label: "días" },
  { value: "weeks", label: "semanas" },
  { value: "months", label: "meses" },
  { value: "years", label: "años" },
]

/** Duración como cantidad y unidad. El valor es "2 months"; `null` si no hay cantidad. */
export function DurationField({ id, value, onChange }: { id?: string; value: string | null; onChange: (value: string | null) => void }) {
  const [amount = "", unit = "months"] = (value ?? "").split(" ")
  const set = (a: string, u: string) => onChange(a ? `${a} ${u}` : null)
  return (
    <div className="flex gap-2">
      <TextInput id={id} type="number" min={0} inputMode="numeric" value={amount} onChange={(e) => set(e.target.value, unit)} placeholder="Cantidad" className="w-28" />
      <div className="flex-1">
        <SelectField value={unit} onChange={(u) => set(amount, u)} options={DURATION_UNITS} />
      </div>
    </div>
  )
}
