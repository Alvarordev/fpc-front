import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Header,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { EmptyState } from "./empty-state"

const PAGE_SIZE = 25

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  isLoading?: boolean
  onRowClick?: (row: TData) => void
  emptyTitle?: string
  emptyBody?: string
}

/**
 * Tabla del sistema de diseño. Paginación en el cliente (25 filas) y orden por
 * columna. La fila entera se abre con clic o con Enter y Espacio.
 */
export function DataTable<TData>({
  data,
  columns,
  isLoading,
  onRowClick,
  emptyTitle = "Sin resultados",
  emptyBody = "No hay registros con estos criterios.",
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    defaultColumn: { enableSorting: false },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  })

  const rows = table.getRowModel().rows
  const total = data.length
  const { pageIndex, pageSize } = table.getState().pagination
  const first = total === 0 ? 0 : pageIndex * pageSize + 1
  const last = Math.min((pageIndex + 1) * pageSize, total)

  return (
    <div className="overflow-hidden rounded-[20px] border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-zinc-200">
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={ariaSort(header.column.getIsSorted())}
                    className="px-4 py-3 text-left text-[13px] font-medium text-zinc-500"
                  >
                    {header.isPlaceholder ? null : <SortHeader header={header} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`sk-${index}`} className="border-b border-zinc-100 last:border-0">
                  {columns.map((_, cell) => (
                    <td key={`sk-${index}-${cell}`} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-36 rounded-md bg-zinc-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-4">
                  <EmptyState title={emptyTitle} body={emptyBody} />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(
                    "border-b border-zinc-100 transition-colors last:border-0 motion-reduce:transition-none",
                    onRowClick && "cursor-pointer hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900",
                  )}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={(event) => {
                    if (!onRowClick) return
                    if (event.key !== "Enter" && event.key !== " ") return
                    event.preventDefault()
                    onRowClick(row.original)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top text-sm text-zinc-900">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3">
          <p className="text-[13px] text-zinc-500 tabular-nums">
            {first}–{last} de {total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <Button variant="outline" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ariaSort(sorted: false | "asc" | "desc"): "ascending" | "descending" | "none" | undefined {
  if (sorted === "asc") return "ascending"
  if (sorted === "desc") return "descending"
  return "none"
}

function SortHeader<TData>({ header }: { header: Header<TData, unknown> }) {
  const label = flexRender(header.column.columnDef.header, header.getContext())
  if (!header.column.getCanSort()) return label

  const sorted = header.column.getIsSorted()
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown

  return (
    <button
      type="button"
      onClick={header.column.getToggleSortingHandler()}
      className="inline-flex items-center gap-1 rounded-md text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-800 motion-reduce:transition-none"
    >
      {label}
      <Icon className={cn("size-3.5", sorted ? "text-zinc-700" : "text-zinc-300")} />
    </button>
  )
}
