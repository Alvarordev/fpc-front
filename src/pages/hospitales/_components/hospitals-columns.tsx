import type { ColumnDef } from "@tanstack/react-table"
import type { HealthCenter } from "@/api/health-centers"
import { Chip } from "@/components/ds/badge"
import { careLevelLabel, institutionLabel } from "@/lib/health-center-labels"
import { DEPARTMENT_LABELS } from "../_utils/departments"

export function hospitalColumns(): ColumnDef<HealthCenter, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: "Hospital",
      enableSorting: true,
      cell: ({ row }) => {
        const detail = institutionLabel(row.original.institution)
        return (
          <div className="min-w-0">
            <p className="font-medium text-zinc-900">{row.original.name}</p>
            {detail && <p className="mt-0.5 text-[13px] text-zinc-500">{detail}</p>}
          </div>
        )
      },
    },
    {
      id: "department",
      header: "Departamento",
      enableSorting: true,
      accessorFn: (center) => DEPARTMENT_LABELS[center.department] ?? center.department,
      cell: ({ getValue }) => <span className="text-zinc-700">{String(getValue())}</span>,
    },
    {
      id: "level",
      header: "Nivel / categoría",
      accessorFn: (center) => [careLevelLabel(center.careLevel), center.careCategory].filter(Boolean).join(" · "),
      cell: ({ getValue }) => <span className="text-zinc-700">{String(getValue() || "Sin registrar")}</span>,
    },
    {
      accessorKey: "patientCount",
      header: "Pacientes",
      enableSorting: true,
      meta: { align: "right" },
      cell: ({ row }) => <span className="tabular-nums">{row.original.patientCount}</span>,
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) =>
        row.original.isActive ? <Chip tone="green">Activo</Chip> : <Chip tone="gray">Inactivo</Chip>,
    },
  ]
}
