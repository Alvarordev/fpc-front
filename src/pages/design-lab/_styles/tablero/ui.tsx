import type { LucideIcon } from "lucide-react"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tone } from "../../_data/mock-patient"
import { toneDot, toneIcon } from "../../_data/tones"

// Primitivas de Tablero: tarjetas blancas de borde fino, cifras grandes con un
// botón de flecha para profundizar y tablas limpias para los registros.

export function Card({ title, action, className, children }: { title?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-[20px] border border-zinc-200 bg-white p-5", className)}>
      {title && (
        <header className="mb-4 flex items-center gap-3">
          <h3 className="flex-1 text-[15px] font-semibold">{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function ArrowButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="group flex size-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-[background-color,transform] hover:bg-zinc-50 active:scale-[0.95]"
    >
      <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  )
}

export function Pill({ children, onClick, dark }: { children: React.ReactNode; onClick?: () => void; dark?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-[background-color,transform] active:scale-[0.97]",
        dark ? "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
      )}
    >
      {children}
    </button>
  )
}

export function Status({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap text-zinc-700">
      <span className={cn("size-1.5 rounded-full", toneDot[tone])} />
      {children}
    </span>
  )
}

export function ToneIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg ring-1", toneIcon[tone])}>
      <Icon className="size-4" strokeWidth={1.75} />
    </span>
  )
}

export function Kpi({
  label,
  value,
  hint,
  hintTone,
  onOpen,
}: {
  label: string
  value: React.ReactNode
  hint: string
  hintTone?: "red" | "green"
  onOpen?: () => void
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-[20px] border border-zinc-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <p className="flex-1 text-[13px] text-zinc-500">{label}</p>
        {onOpen && <ArrowButton label={`Ver ${label.toLowerCase()}`} onClick={onOpen} />}
      </div>
      <p className="mt-1 truncate text-[28px] leading-tight font-semibold tracking-tight tabular-nums">{value}</p>
      <p className={cn("mt-1 text-[13px]", hintTone === "red" ? "text-red-600" : hintTone === "green" ? "text-emerald-600" : "text-zinc-500")}>{hint}</p>
    </div>
  )
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead>
          <tr className="text-zinc-500">
            {head.map((h) => (
              <th key={h} className="border-b border-zinc-100 px-5 pb-2.5 font-normal first:pl-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-zinc-100 [&>tr:last-child]:border-0 [&>tr:hover]:bg-zinc-50/80">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-5 py-3 align-top", className)}>{children}</td>
}

export function Empty({ title, body, action }: { title: string; body: string; action?: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-zinc-50 px-6 py-10 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-zinc-500">{body}</p>
      {action && (
        <div className="mt-4">
          <Pill dark>{action}</Pill>
        </div>
      )}
    </div>
  )
}
