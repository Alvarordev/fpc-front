import type { LucideIcon } from "lucide-react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ToneIcon } from "./icon"
import type { Tone } from "./tone"

/** Acción que abre un formulario. `done` la marca como agregada y cambia su ayuda. */
export function ActionTile({ icon, tone, label, hint, done, doneHint = "Agregado, toca para editar", onClick }: { icon: LucideIcon; tone: Tone; label: string; hint: string; done?: boolean; doneHint?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-[14px] p-3 text-left ring-1 transition-[background-color,transform] active:scale-[0.99]",
        done ? "bg-white ring-zinc-300" : "bg-zinc-50 ring-zinc-200/60 hover:bg-zinc-100/70",
      )}
    >
      <ToneIcon icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-[13px] text-zinc-500">{done ? doneHint : hint}</span>
      </span>
      {done && <CheckCircle2 className="size-4 text-emerald-600 animate-in zoom-in-50 duration-200 motion-reduce:animate-none" />}
    </button>
  )
}
