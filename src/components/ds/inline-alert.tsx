import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

/** Aviso en línea. `danger` para alertas abiertas; `warning` para algo que revisar. */
export function InlineAlert({ tone = "danger", children, aside }: { tone?: "danger" | "warning"; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px]",
        tone === "danger" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900",
      )}
    >
      <AlertTriangle className={cn("size-4 shrink-0", tone === "danger" ? "text-red-600" : "text-amber-600")} />
      <span className="flex-1">{children}</span>
      {aside && <span className={tone === "danger" ? "text-red-700/70" : "text-amber-800/70"}>{aside}</span>}
    </div>
  )
}
