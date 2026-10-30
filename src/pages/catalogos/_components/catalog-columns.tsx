import type { ColumnDef } from "@tanstack/react-table"
import { Archive, GitMerge, Pencil, RotateCcw } from "lucide-react"
import type { CatalogItem } from "@/api/catalogs"
import { Chip } from "@/components/ds/badge"
import { CopyValue } from "@/components/ds/copy-value"
import { RowMenu } from "@/components/ds/row-menu"

export function catalogColumns({
  hierarchical,
  parentLabel,
  canMerge,
  onEdit,
  onMerge,
  onDeactivate,
  onReactivate,
}: {
  hierarchical: boolean
  parentLabel: (code: string) => string
  canMerge: boolean
  onEdit: (item: CatalogItem) => void
  onMerge: (item: CatalogItem) => void
  onDeactivate: (item: CatalogItem) => void
  onReactivate: (item: CatalogItem) => void
}): ColumnDef<CatalogItem, unknown>[] {
  const columns: ColumnDef<CatalogItem, unknown>[] = [
    {
      accessorKey: "label",
      header: "Etiqueta",
      enableSorting: true,
      cell: ({ row }) => <p className="font-medium text-zinc-900">{row.original.label}</p>,
    },
    {
      accessorKey: "code",
      header: "Código",
      cell: ({ row }) => (
        <CopyValue value={row.original.code} label="Código" className="text-[13px] text-zinc-500" />
      ),
    },
  ]

  if (hierarchical) {
    columns.push({
      id: "parent",
      header: "Padre",
      accessorFn: (item) => (item.parentCode ? parentLabel(item.parentCode) : ""),
      cell: ({ row }) => (
        <span className="text-zinc-700">{row.original.parentCode ? parentLabel(row.original.parentCode) : "Sin padre"}</span>
      ),
    })
  }

  columns.push(
    {
      accessorKey: "sortOrder",
      header: "Orden",
      enableSorting: true,
      meta: { align: "right" },
      cell: ({ row }) => <span className="tabular-nums">{row.original.sortOrder}</span>,
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => (
        <span className="inline-flex flex-wrap gap-1.5">
          {row.original.isActive ? <Chip tone="green">Activo</Chip> : <Chip tone="gray">Inactivo</Chip>}
          {row.original.isSystem && <Chip tone="gray">Sistema</Chip>}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex justify-end">
            <RowMenu
              label={`Acciones de ${item.label}`}
              items={[
                { label: "Editar", icon: Pencil, onSelect: () => onEdit(item) },
                ...(canMerge && item.isActive && !item.isSystem
                  ? [{ label: "Fusionar con otro", icon: GitMerge, onSelect: () => onMerge(item) }]
                  : []),
                ...(item.isSystem
                  ? []
                  : item.isActive
                    ? [{ label: "Desactivar", icon: Archive, destructive: true, onSelect: () => onDeactivate(item) }]
                    : [{ label: "Reactivar", icon: RotateCcw, onSelect: () => onReactivate(item) }]),
              ]}
            />
          </div>
        )
      },
    },
  )

  return columns
}
