import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Volunteer, AvailabilitySlot } from "@/types"

const statusStyles: Record<string, string> = {
  true: "bg-emerald-50 text-emerald-700 border-emerald-200",
  false: "bg-zinc-100 text-zinc-600 border-zinc-200",
}

export function getVolunteerColumns(
  slots: AvailabilitySlot[],
): ColumnDef<Volunteer>[] {
  return [
    {
      accessorKey: "firstName",
      header: "Voluntario",
      cell: ({ row }) => {
        const v = row.original
        const initials = `${v.firstName[0]}${v.lastName[0]}`
        return (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-foreground text-sm leading-none font-medium">
                {v.firstName} {v.lastName}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">{v.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "specialty",
      header: "Especialidad",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ getValue }) => {
        const active = getValue() as boolean
        return (
          <Badge
            className={cn("border font-medium", statusStyles[String(active)])}
          >
            {active ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "commitmentEndAt",
      header: "Fin del acta",
      cell: ({ getValue }) => {
        const value = getValue() as string | null
        return (
          <span className="text-muted-foreground text-sm">
            {value
              ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
                  "es-PE",
                  { day: "numeric", month: "short", year: "numeric" },
                )
              : "Sin fecha"}
          </span>
        )
      },
    },
    {
      accessorKey: "hasVolunteerCertificate",
      header: "Certificado",
      cell: ({ getValue }) => (
        <Badge
          className={cn(
            "border font-medium",
            getValue()
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-zinc-200 bg-zinc-100 text-zinc-600",
          )}
        >
          {getValue() ? "Sí" : "No"}
        </Badge>
      ),
    },
    {
      id: "slotsDisponibles",
      header: "Slots disponibles",
      cell: ({ row }) => {
        const count = slots.filter(
          (s) => s.volunteerId === row.original.id && s.status === "AVAILABLE",
        ).length
        return (
          <span className="text-foreground text-sm font-medium">{count}</span>
        )
      },
    },
  ]
}
