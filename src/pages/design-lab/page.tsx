import { useSearchParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { TABS, emptyPatient, samplePatient, type LabState, type TabId } from "./_data/mock-patient"
import { LienzoStyle } from "./_styles/lienzo"
import { TableroStyle } from "./_styles/tablero"
import { SintesisStyle } from "./_styles/sintesis"

// Laboratorio de diseño de la ficha del paciente. Solo se registra en desarrollo.

const STYLES = [
  { id: "sintesis", name: "Síntesis", hint: "Cabecera y tipografía de Tablero con las pestañas de Lienzo", Component: SintesisStyle },
  { id: "lienzo", name: "Lienzo (ref.)", hint: "Referencia: índice lateral propio y paneles con filas internas", Component: LienzoStyle },
  { id: "tablero", name: "Tablero (ref.)", hint: "Referencia: cifras clave arriba, pestañas en píldora y tablas", Component: TableroStyle },
] as const

const STATES: { id: LabState; name: string }[] = [
  { id: "data", name: "Con datos" },
  { id: "empty", name: "Vacío" },
  { id: "loading", name: "Cargando" },
]

export default function DesignLabPage() {
  const [params, setParams] = useSearchParams()
  const style = STYLES.find((s) => s.id === params.get("estilo")) ?? STYLES[0]
  const state = STATES.find((s) => s.id === params.get("estado"))?.id ?? "data"
  const withShell = params.get("menu") === "1"
  const patient = state === "empty" ? emptyPatient : samplePatient
  const initialTab = TABS.find((t) => t.id === params.get("tab"))?.id as TabId | undefined

  function set(key: string, value: string) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white [--lab-bar:52px]">
      <div className="sticky top-0 z-30 flex h-[var(--lab-bar)] items-center gap-3 overflow-x-auto border-b border-zinc-200 bg-white/95 px-3 text-sm backdrop-blur">
        <span className="shrink-0 font-semibold">Ficha del paciente</span>
        <Segmented
          value={style.id}
          options={STYLES.map((s) => ({ id: s.id, label: s.name, title: s.hint }))}
          onChange={(v) => set("estilo", v)}
        />
        <Segmented value={state} options={STATES.map((s) => ({ id: s.id, label: s.name }))} onChange={(v) => set("estado", v)} />
        <label className="flex shrink-0 items-center gap-2 text-zinc-600">
          <input type="checkbox" checked={withShell} onChange={(e) => set("menu", e.target.checked ? "1" : "0")} />
          Con menú lateral
        </label>
        <span className="ml-auto hidden shrink-0 text-zinc-500 xl:block">{style.hint}</span>
      </div>
      <div className="flex flex-1">
        {withShell && <div className="hidden w-60 shrink-0 bg-[var(--sidebar)] md:block" aria-hidden />}
        <div className="min-w-0 flex-1">
          <style.Component key={`${style.id}-${state}`} patient={patient} state={state} initialTab={initialTab} />
        </div>
      </div>
    </div>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { id: T; label: string; title?: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex shrink-0 rounded-lg bg-zinc-100 p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          title={option.title}
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            value === option.id ? "bg-white font-medium shadow-sm" : "text-zinc-600 hover:text-zinc-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
