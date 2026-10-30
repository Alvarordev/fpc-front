import { useId, useRef } from "react"
import { FileUp, X } from "lucide-react"
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
  error,
  className,
  children,
}: {
  label: string
  hint?: string
  /** Dato obligatorio sin responder u otro problema: la etiqueta y el aviso van en rojo. */
  error?: string
  className?: string
  children: (id: string) => React.ReactNode
}) {
  const id = useId()
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <label htmlFor={id} className={cn("block text-[13px] font-medium transition-colors", error ? "text-red-700" : "text-zinc-700")}>
        {label}
      </label>
      {children(id)}
      {error ? <p className="text-xs text-red-700">{error}</p> : hint && <p className="text-xs text-zinc-500">{hint}</p>}
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
  { value: "MINUTE", label: "minutos" },
  { value: "HOUR", label: "horas" },
  { value: "DAY", label: "días" },
  { value: "WEEK", label: "semanas" },
  { value: "MONTH", label: "meses" },
  { value: "YEAR", label: "años" },
]

/**
 * Duración como cantidad y unidad, con las unidades de la API. El valor es
 * "2 MONTH"; `null` si no hay cantidad. `units` limita las unidades ofrecidas.
 */
export function DurationField({ id, value, onChange, units }: { id?: string; value: string | null; onChange: (value: string | null) => void; units?: string[] }) {
  const options = units ? DURATION_UNITS.filter((u) => units.includes(u.value)) : DURATION_UNITS
  const [amount = "", unit = options.find((u) => u.value === "MONTH")?.value ?? options[0].value] = (value ?? "").split(" ")
  const set = (a: string, u: string) => onChange(a ? `${a} ${u}` : null)
  return (
    <div className="flex gap-2">
      <TextInput id={id} type="number" min={0} inputMode="numeric" value={amount} onChange={(e) => set(e.target.value, unit)} placeholder="Cantidad" className="w-28" />
      <div className="flex-1">
        <SelectField value={unit} onChange={(u) => set(amount, u)} options={options} />
      </div>
    </div>
  )
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

/** Archivo elegido con su nombre y peso; se quita con la X. `accept` limita los tipos. */
export function FileField({ id, file, onChange, accept, disabled }: { id?: string; file: File | null; onChange: (file: File | null) => void; accept?: string; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div>
      <input ref={input} id={id} type="file" accept={accept} disabled={disabled} className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      {file ? (
        <div className="flex h-9 items-center gap-2 rounded-[10px] bg-white px-3 text-sm ring-1 ring-zinc-200">
          <FileUp className="size-4 shrink-0 text-zinc-500" />
          <span className="min-w-0 flex-1 truncate font-medium text-zinc-900">{file.name}</span>
          <span className="shrink-0 text-[13px] text-zinc-500 tabular-nums">{formatBytes(file.size)}</span>
          <button
            type="button"
            aria-label="Quitar archivo"
            disabled={disabled}
            onClick={() => {
              onChange(null)
              if (input.current) input.current.value = ""
            }}
            className="-mr-1 flex size-6 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          className="flex h-9 w-full items-center gap-2 rounded-[10px] border border-dashed border-zinc-300 bg-white px-3 text-sm text-zinc-500 transition-[color,box-shadow] hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/20 focus-visible:outline-none disabled:opacity-50"
        >
          <FileUp className="size-4" />
          Elegir archivo
        </button>
      )}
    </div>
  )
}
