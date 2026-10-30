import { X } from "lucide-react"
import { Chip } from "./badge"
import { AddButton } from "./button"
import { GroupLabel, Item } from "./card"
import type { Tone } from "./tone"

// Registros de una sección de formulario (diagnósticos, tratamientos,
// direcciones): lo que ya existe, lo que queda pendiente de guardar y el botón
// para agregar. Los pendientes se pueden quitar antes de confirmar.

export type PendingKind = "Nuevo" | "Corrección" | "Actualización"

export type PendingRecord = { id: string; title: string; detail: string; kind: PendingKind }

const KIND_TONE: Record<PendingKind, Tone> = { Nuevo: "green", Corrección: "amber", Actualización: "blue" }

export function RecordSection({
  title,
  description,
  addLabel,
  onAdd,
  pending = [],
  pendingLabel = "Por guardar",
  onRemovePending,
  onOpenPending,
  empty = "Nada registrado.",
  children,
}: {
  title: string
  description?: string
  addLabel: string
  onAdd: () => void
  pending?: PendingRecord[]
  pendingLabel?: string
  onRemovePending?: (id: string) => void
  /** Abre un pendiente para editarlo antes de guardar. */
  onOpenPending?: (id: string) => void
  empty?: string
  children?: React.ReactNode
}) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <section className="border-t border-zinc-100 pt-5 first:border-0 first:pt-0">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
          {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
        </div>
        <AddButton onClick={onAdd}>{addLabel}</AddButton>
      </div>
      <div className="space-y-2">
        {hasItems ? children : !pending.length && <p className="rounded-[14px] bg-zinc-50 px-4 py-3 text-[13px] text-zinc-500">{empty}</p>}
        {pending.length > 0 && (
          <>
            <GroupLabel>{pendingLabel}</GroupLabel>
            {pending.map((p) => (
              <Item
                key={p.id}
                title={p.title}
                tags={<Chip tone={KIND_TONE[p.kind]}>{p.kind}</Chip>}
                meta={p.detail}
                onOpen={onOpenPending && (() => onOpenPending(p.id))}
                openLabel={`Editar ${p.title}`}
                actions={onRemovePending && <RemoveButton label={`Quitar ${p.title}`} onClick={() => onRemovePending(p.id)} />}
              />
            ))}
          </>
        )}
      </div>
    </section>
  )
}

/** Botón de quitar de una tarjeta interna. */
export function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-8 cursor-pointer items-center justify-center rounded-[10px] text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900 hover:ring-1 hover:ring-zinc-200"
    >
      <X className="size-4" />
    </button>
  )
}
