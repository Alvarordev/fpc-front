import type { ReactNode } from "react"
import { Chip } from "@/components/ds/badge"
import { Card } from "@/components/ds/card"
import { cn } from "@/lib/utils"

/**
 * Tarjeta de sección del dashboard sobre la `Card` del sistema de diseño: el
 * título de 15px, la descripción y, a la derecha, el alcance (flujo o estado)
 * junto a la acción de la sección.
 */
export function DashboardSection({
  title,
  hint,
  scope,
  action,
  className,
  children,
}: {
  title: string
  hint?: string
  scope?: "flujo" | "estado"
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <Card
      title={title}
      description={hint}
      className={cn("min-w-0", className)}
      action={
        scope || action ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {scope && <ScopeBadge kind={scope} />}
            {action}
          </div>
        ) : undefined
      }
    >
      {children}
    </Card>
  )
}

/** Flujo: eventos con fecha dentro del periodo. Estado: foto al cierre. */
export function ScopeBadge({ kind }: { kind: "flujo" | "estado" }) {
  return (
    <span
      title={
        kind === "flujo"
          ? "Cuenta eventos con fecha dentro del periodo"
          : "Muestra el estado de cada paciente al cierre del periodo"
      }
    >
      <Chip tone={kind === "flujo" ? "blue" : "gray"}>
        {kind === "flujo" ? "Flujo" : "Estado"}
      </Chip>
    </span>
  )
}
