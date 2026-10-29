import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/** Contexto en una línea que se expande al tocarlo, para no robar espacio. */
export function ExpandableLine({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="flex w-full cursor-pointer items-start gap-2.5 rounded-[12px] bg-zinc-50 px-3 py-2 text-left ring-1 ring-zinc-200/60 transition-colors hover:bg-zinc-100/70"
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className={cn("min-w-0 flex-1 text-[13px]", !open && "line-clamp-1")}>
        <span className="font-medium text-zinc-900">{label}: </span>
        <span className="text-zinc-600">{text}</span>
      </span>
      <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-zinc-400 transition-transform duration-200", open && "rotate-180")} />
    </button>
  )
}
