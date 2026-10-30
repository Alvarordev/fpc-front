import type { LucideIcon } from "lucide-react"

/** Cifra con contexto: ícono, etiqueta, número y una línea que explica el número. */
export function StatTile({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-zinc-200 bg-white p-4">
      <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200">
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-[13px] text-zinc-500">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="text-[13px] text-zinc-500">{hint}</p>}
      </div>
    </div>
  )
}
