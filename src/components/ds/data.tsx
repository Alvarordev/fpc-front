import type { LucideIcon } from "lucide-react"
import { IconTile } from "./icon"

type Pair = [string, React.ReactNode]

/** Datos de consulta como texto: etiqueta a la izquierda, valor a la derecha. Sin íconos. */
export function DataList({ items, labelWidth = 150 }: { items: Pair[]; labelWidth?: number }) {
  return (
    <dl className="divide-y divide-zinc-100">
      {items.map(([label, value]) => (
        <div key={label} className="grid gap-3 py-2 text-[13px]" style={{ gridTemplateColumns: `${labelWidth}px minmax(0,1fr)` }}>
          <dt className="text-zinc-500">{label}</dt>
          <dd className="min-w-0 font-medium text-zinc-900">{value ?? "Sin registrar"}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Campos en dos columnas, etiqueta sobre valor. */
export function FieldGrid({ items }: { items: Pair[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-3">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[13px] text-zinc-500">{label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-zinc-900">{value ?? "Sin registrar"}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Fila gris con ícono enmarcado: datos clave que el usuario vino a revisar (modales). */
export function InsetRow({ icon, label, value, trailing }: { icon: LucideIcon; label: string; value: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-200/60">
      <IconTile icon={icon} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-zinc-500">{label}</p>
        <p className="truncate text-sm font-medium text-zinc-900">{value}</p>
      </div>
      {trailing}
    </div>
  )
}
