import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Archive, RotateCcw } from "lucide-react"
import type { CatalogItem } from "@/api/catalogs"
import { cn } from "@/lib/utils"

interface CatalogColumnsOptions {
  onEdit: (item: CatalogItem) => void
  onArchive: (item: CatalogItem) => void
  onReactivate: (item: CatalogItem) => void
}

export function catalogColumns({
  onEdit,
  onArchive,
  onReactivate,
}: CatalogColumnsOptions): ColumnDef<CatalogItem>[] {
  return [
    {
      accessorKey: "label",
      header: "Etiqueta",
      cell: ({ row }) => (
        <p className="max-w-[280px] truncate text-sm font-medium">
          {row.original.label}
        </p>
      ),
    },
    {
      accessorKey: "code",
      header: "Código",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: "Orden en listas",
      cell: ({ getValue }) => (
        <span className="tabular-nums text-sm">{getValue() as number}</span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            className={cn(
              "border font-medium",
              row.original.isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-zinc-100 text-zinc-600",
            )}
          >
            {row.original.isActive ? "Activo" : "Archivado"}
          </Badge>
          {row.original.isSystem && (
            <Badge variant="outline" className="text-[10px]">
              Sistema
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="size-8" />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                {item.isActive ? (
                  <DropdownMenuItem
                    disabled={item.isSystem}
                    onClick={() => onArchive(item)}
                  >
                    <Archive className="size-4" />
                    Archivar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onReactivate(item)}>
                    <RotateCcw className="size-4" />
                    Reactivar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
