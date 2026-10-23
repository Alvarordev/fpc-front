import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export const dashboardPanelClass =
  "gap-0 rounded-[14px] py-5 ring-1 ring-foreground/10"

export function DashboardSectionTitle({
  children,
  badge,
  hint,
}: {
  children: ReactNode
  badge?: ReactNode
  hint?: string
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-[15px] font-semibold tracking-tight">
        {children}
        {badge ? <span className="ml-1.5 inline-block align-[2px]">{badge}</span> : null}
      </h2>
      {hint ? (
        <p className="text-muted-foreground mt-0.5 text-[12.5px] leading-relaxed">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function ScopeBadge({
  kind,
  className,
}: {
  kind: "flujo" | "estado"
  className?: string
}) {
  return (
    <em
      className={cn(
        "not-italic inline-flex rounded-full px-1.5 py-px text-[11px] font-medium",
        kind === "flujo"
          ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {kind === "flujo" ? "Flujo" : "Estado"}
    </em>
  )
}
