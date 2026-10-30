import { Link, useSearchParams } from "react-router-dom"
import { cn } from "@/lib/utils"

// Marco común de los laboratorios: barra superior con la pantalla, los
// selectores de cada laboratorio y la opción de simular el menú lateral.

const SCREENS = [
  { path: "/lab/paciente", label: "Ficha del paciente" },
  { path: "/lab/seguimiento", label: "Seguimiento" },
]

export function LabShell({ current, controls, hint, children }: { current: string; controls: React.ReactNode; hint?: string; children: React.ReactNode }) {
  const [params, setParams] = useSearchParams()
  const withShell = params.get("menu") === "1"
  return (
    <div className="flex min-h-dvh flex-col bg-white [--lab-bar:52px]">
      <div className="sticky top-0 z-30 flex h-[var(--lab-bar)] items-center gap-3 overflow-x-auto border-b border-zinc-200 bg-white/95 px-3 text-sm backdrop-blur">
        <nav className="flex shrink-0 gap-1" aria-label="Pantallas del laboratorio">
          {SCREENS.map((s) => (
            <Link
              key={s.path}
              to={s.path}
              className={cn("rounded-md px-2 py-1", s.path === current ? "font-semibold text-zinc-900" : "text-zinc-500 hover:text-zinc-900")}
            >
              {s.label}
            </Link>
          ))}
        </nav>
        <span className="h-5 w-px shrink-0 bg-zinc-200" />
        {controls}
        <label className="flex shrink-0 items-center gap-2 text-zinc-600">
          <input
            type="checkbox"
            checked={withShell}
            onChange={(e) => {
              const copy = new URLSearchParams(params)
              copy.set("menu", e.target.checked ? "1" : "0")
              setParams(copy, { replace: true })
            }}
          />
          Con menú lateral
        </label>
        {hint && <span className="ml-auto hidden shrink-0 text-zinc-500 xl:block">{hint}</span>}
      </div>
      <div className="flex flex-1">
        {withShell && <div className="hidden w-60 shrink-0 bg-[var(--sidebar)] md:block" aria-hidden />}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: readonly { id: T; label: string; title?: string }[]; onChange: (value: T) => void }) {
  return (
    <div className="flex shrink-0 rounded-lg bg-zinc-100 p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          title={option.title}
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={cn("rounded-md px-2.5 py-1 transition-colors", value === option.id ? "bg-white font-medium shadow-sm" : "text-zinc-600 hover:text-zinc-900")}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
