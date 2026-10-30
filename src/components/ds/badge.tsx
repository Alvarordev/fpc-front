import { cn } from "@/lib/utils"
import { toneDot, toneSoft, type Tone } from "./tone"

/** Etiqueta de estado con fondo suave. Para estados que deben verse de un vistazo. */
export function Chip({ tone = "gray", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium", toneSoft[tone], className)}>{children}</span>
}

/** Estado discreto: punto de color y texto. Para tablas y listas densas. */
export function Status({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap text-zinc-700">
      <span className={cn("size-1.5 rounded-full", toneDot[tone])} />
      {children}
    </span>
  )
}

/** Etiqueta con borde para metadatos de identidad (documento, celular, distrito). */
export function MetaTag({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600">
      {Icon && <Icon className="size-3 text-zinc-400" />}
      {children}
    </span>
  )
}
