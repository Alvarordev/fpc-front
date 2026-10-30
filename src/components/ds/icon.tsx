import { useId } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { toneIcon, type Tone } from "./tone"

/** Ícono enmarcado neutro: encabezados de modal y filas clave. */
export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-zinc-700 shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-zinc-200", className)}>
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </span>
  )
}

/** Ícono enmarcado con el color de un estado: actividad y próximos pasos. */
export function ToneIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg ring-1", toneIcon[tone])}>
      <Icon className="size-4" strokeWidth={1.75} />
    </span>
  )
}

/** Ícono de contenido generado por IA: el trazo lleva un degradado azul a violeta. */
export function AiMark({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  const id = `ai-${useId().replace(/:/g, "")}`
  return (
    <span className={cn("relative shrink-0", className)}>
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="55%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
      </svg>
      <Icon className="size-5" strokeWidth={1.75} stroke={`url(#${id})`} />
    </span>
  )
}
