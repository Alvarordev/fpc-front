import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Volunteer } from "@/types"

interface VolunteersTableProps {
  data: Volunteer[]
  columns: ColumnDef<Volunteer>[]
  onVolunteerClick?: (volunteer: Volunteer) => void
}

export function VolunteersTable({
  data,
  columns,
  onVolunteerClick,
}: VolunteersTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="border-border/60 overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-border/60 hover:bg-transparent"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-muted-foreground bg-muted/30 text-xs font-medium tracking-wide uppercase first:pl-4 last:pr-4"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={`border-border/40 hover:bg-muted/30 ${
                  onVolunteerClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onVolunteerClick?.(row.original)}
                onKeyDown={(event) => {
                  if (
                    onVolunteerClick &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault()
                    onVolunteerClick(row.original)
                  }
                }}
                tabIndex={onVolunteerClick ? 0 : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="py-3 first:pl-4 last:pr-4"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center">
                <div className="flex flex-col items-center gap-1">
                  <p className="text-foreground text-sm font-medium">
                    Sin resultados
                  </p>
                  <p className="text-muted-foreground text-xs">
                    No se encontraron voluntarios con esos criterios.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
