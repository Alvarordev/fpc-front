import type { CatalogKind } from "@/api/catalogs"
import type { DashboardEpidemiology } from "@/api/dashboard"
import { PERU_DEPARTMENTS } from "@/lib/peru-departments"
import { useDashboardCatalogLabel } from "./dashboard-catalog"
import { EmptyState } from "@/components/ds/empty-state"
import { DashboardSection } from "./dashboard-shell"

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
    <DashboardSection title={title} hint={definition} scope="estado">
      {items.length === 0 ? (
        <EmptyState title={empty} body="Aparecerán cuando haya pacientes con ambos datos registrados." />
      ) : (
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-white">
              <tr>
                <th className="border-b border-zinc-100 p-2 font-medium" />
                {columns.map((column) => (
                  <th key={column} className="border-b border-zinc-100 p-2 font-medium">
                    {columnLabel(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row}>
                  <th className="border-b border-zinc-100 p-2 font-medium text-zinc-500">
                    {labelOf(rowKind, row)}
                  </th>
                  {columns.map((column) => {
                    const count = lookup.get(`${row}::${column}`) ?? 0
                    return (
                      <td
                        key={column}
                        className="border-b border-zinc-100 p-2 tabular-nums"
                        style={{
                          backgroundColor:
                            count === 0
                              ? undefined
                              : `color-mix(in srgb, #18181b ${Math.round((count / max) * 18)}%, transparent)`,
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
    </DashboardSection>
  )
}

function unique(values: string[]) {
  return [...new Set(values)]
}
