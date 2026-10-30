import { ChevronRight, type LucideIcon } from "lucide-react"
import { ToneIcon } from "./icon"
import type { Tone } from "./tone"
import { cn } from "@/lib/utils"

/**
 * Tarjeta de sección: título 15px, descripción 13px y una acción opcional.
 * `icon` con `tone` marca la sección para distinguirla de las vecinas.
 */
export function Card({
  title,
  description,
  icon,
  tone = "gray",
  action,
  className,
  children,
}: {
  title?: string
  description?: string
  icon?: LucideIcon
  tone?: Tone
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("rounded-[20px] border border-zinc-200 bg-white p-5", className)}>
      {title && (
        <header className={cn("mb-4 flex gap-3", description ? "items-start" : "items-center")}>
          {icon && <ToneIcon icon={icon} tone={tone} />}
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-zinc-900">{title}</h3>
            {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

/**
 * Tarjeta interna gris: un registro que se gestiona o se abre (seguimiento,
 * sesión, diagnóstico). `actions` va a la derecha; `footer`, bajo el contenido
 * cuando las acciones necesitan espacio. `highlight` marca lo de hoy.
 */
export function Item({
  leading,
  title,
  tags,
  meta,
  body,
  actions,
  footer,
  onOpen,
  openLabel = "Abrir",
  highlight,
}: {
  leading?: React.ReactNode
  title: React.ReactNode
  tags?: React.ReactNode
  meta?: React.ReactNode
  body?: React.ReactNode
  actions?: React.ReactNode
  footer?: React.ReactNode
  onOpen?: () => void
  openLabel?: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-[14px] p-3 ring-1 transition-colors",
        highlight ? "bg-red-50/60 ring-red-200/70" : "bg-zinc-50 ring-zinc-200/60",
        onOpen && (highlight ? "hover:bg-red-50" : "hover:bg-zinc-100/70"),
      )}
    >
      {onOpen && <button type="button" onClick={onOpen} aria-label={openLabel} className="absolute inset-0 cursor-pointer rounded-[14px]" />}
      {leading}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-900">{title}</span>
          {tags}
        </div>
        {meta && <p className="mt-0.5 text-[13px] text-zinc-500">{meta}</p>}
        {body && <div className="mt-1.5 text-[13px] leading-relaxed text-zinc-700">{body}</div>}
        {footer && <div className="relative z-10 mt-3 flex flex-wrap gap-2">{footer}</div>}
      </div>
      {actions && <div className="relative z-10 flex shrink-0 gap-2">{actions}</div>}
      {onOpen && !actions && <ChevronRight className="mt-2.5 size-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5" />}
    </div>
  )
}

/** Bloque blanco dentro de un lienzo gris (cuerpo de los modales). */
export function Panel({ title, className, children }: { title?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-[18px] bg-white p-4 ring-1 ring-zinc-200/70", className)}>
      {title && <h4 className="mb-3 text-[13px] font-medium text-zinc-500">{title}</h4>}
      {children}
    </section>
  )
}

/** Subtítulo dentro de una tarjeta para separar grupos (p. ej. "Anteriores"). */
export function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-1 pt-2 text-[13px] text-zinc-500">{children}</p>
}
