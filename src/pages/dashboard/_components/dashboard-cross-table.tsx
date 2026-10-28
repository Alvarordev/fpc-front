import type { CatalogKind } from "@/api/catalogs"
import type { DashboardEpidemiology } from "@/api/dashboard"
import { PERU_DEPARTMENTS } from "@/lib/peru-departments"
import { useDashboardCatalogLabel } from "./dashboard-catalog"
import { IndicatorDefinition } from "./indicator-definition"

type CrossItem = DashboardEpidemiology["diagnosisByDepartment"][number]

export function DashboardCrossTable({
  title,
  definition,
  items,
  empty,
  rowKind,
  columnKind,
}: {
  title: string
  definition?: string
  items: CrossItem[]
  empty: string
  rowKind?: CatalogKind
  /** "department" usa los nombres de departamento; si no, el catálogo indicado. */
  columnKind?: CatalogKind | "department"
}) {
  const labelOf = useDashboardCatalogLabel()
  const columnLabel = (code: string) =>
    columnKind === "department"
      ? (PERU_DEPARTMENTS.find((item) => item.value === code)?.label ??
        labelOf(undefined, code))
      : labelOf(columnKind, code)
  const rows = unique(items.map((item) => item.row))
  const columns = unique(items.map((item) => item.column))
  const lookup = new Map(items.map((item) => [`${item.row}::${item.column}`, item.count]))
  const max = Math.max(1, ...items.map((item) => item.count))

  return (
    <div className="min-w-0">
      <p className="mb-2 text-[13px] font-semibold">
        <IndicatorDefinition definition={definition}>{title}</IndicatorDefinition>
      </p>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className="border-b p-2 font-medium" />
                {columns.map((column) => (
                  <th key={column} className="border-b p-2 font-medium">
                    {columnLabel(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row}>
                  <th className="border-b p-2 font-medium">
                    {labelOf(rowKind, row)}
                  </th>
                  {columns.map((column) => {
                    const count = lookup.get(`${row}::${column}`) ?? 0
                    return (
                      <td
                        key={column}
                        className="border-b p-2 tabular-nums"
                        style={{
                          backgroundColor:
                            count === 0
                              ? undefined
                              : `color-mix(in srgb, var(--foreground) ${Math.round((count / max) * 18)}%, transparent)`,
                        }}
                      >
                        {count || "—"}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function unique(values: string[]) {
  return [...new Set(values)]
}
