import type { LucideIcon } from "lucide-react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tone } from "../../_data/mock-patient"
import { toneSoft } from "../../_data/tones"

// Primitivas de Lienzo: paneles blancos sobre lienzo gris y filas internas en
// gris suave con un ícono enmarcado, como en las consolas de infraestructura.

export function Panel({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("rounded-[20px] bg-white p-5 ring-1 ring-zinc-200/70", className)}>
      {title && (
        <header className="mb-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-zinc-900">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-zinc-700 shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-zinc-200",
        className,
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </span>
  )
}

export function InsetRow({
  icon,
  title,
  subtitle,
  trailing,
  onClick,
}: {
  icon?: LucideIcon
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode
  onClick?: () => void
}) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[14px] bg-zinc-50 px-3 py-2.5 text-left ring-1 ring-zinc-200/60",
        onClick && "transition-[background-color,transform] hover:bg-zinc-100 active:scale-[0.995]",
      )}
    >
      {icon && <IconTile icon={icon} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zinc-900">{title}</span>
        {subtitle && <span className="block text-[13px] text-zinc-500">{subtitle}</span>}
      </span>
      {trailing}
    </Comp>
  )
}

export function Chip({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium", toneSoft[tone])}>{children}</span>
}

export function GhostButton({ icon: Icon = Plus, children, onClick }: { icon?: LucideIcon; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] bg-white px-3 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 transition-[background-color,transform] hover:bg-zinc-50 active:scale-[0.97]"
    >
      <Icon className="size-4" />
      {children}
    </button>
  )
}

export function PrimaryButton({ icon: Icon = Plus, children }: { icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <button className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-zinc-900 px-3.5 text-sm font-medium text-white transition-[background-color,transform] hover:bg-zinc-800 active:scale-[0.97]">
      <Icon className="size-4" />
      {children}
    </button>
  )
}

export function Empty({ icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: string }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-zinc-50 px-6 py-10 text-center ring-1 ring-zinc-200/60">
      <IconTile icon={icon} />
      <p className="mt-3 text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{body}</p>
      {action && (
        <div className="mt-4">
          <GhostButton>{action}</GhostButton>
        </div>
      )}
    </div>
  )
}

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-zinc-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-zinc-900">{value ?? "Sin registrar"}</dd>
    </div>
  )
}

export function Segments({ value, options, onChange }: { value: string; options: { id: string; label: string; icon?: LucideIcon }[]; onChange: (id: string) => void }) {
  return (
    <div className="inline-flex rounded-[12px] bg-zinc-100 p-1">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-sm transition-[background-color,color,box-shadow]",
            value === option.id ? "bg-white font-medium text-zinc-900 shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-zinc-500 hover:text-zinc-800",
          )}
        >
          {option.icon && <option.icon className="size-4" />}
          {option.label}
        </button>
      ))}
    </div>
  )
}
