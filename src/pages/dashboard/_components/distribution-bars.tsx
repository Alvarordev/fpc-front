import { useState } from "react"
import type { CatalogKind } from "@/api/catalogs"
import { cn } from "@/lib/utils"
import { useDashboardCatalogLabel } from "./dashboard-catalog"
import { number } from "./dashboard-labels"

export type Distribution = {
  items: { label: string; count: number }[]
  known: number
  unknown: number
  coveragePct: number
}

export function isUnknownLabel(value: string) {
  return /sin informaci[oó]n/i.test(value) || value === "UNKNOWN"
}

export function DistributionBars({
  distribution,
  compact = false,
  maxItems,
  catalogKind,
  columns = "minmax(7rem,11rem) 1fr 5.5rem",
  shareOfTotal = false,
  foldAfter,
  foldLabel = "Otros",
}: {
  distribution: Distribution
  compact?: boolean
  maxItems?: number
  catalogKind?: CatalogKind
  columns?: string
  shareOfTotal?: boolean
  foldAfter?: number
  foldLabel?: string
}) {
  const labelOf = useDashboardCatalogLabel()
  const total = distribution.items.reduce((sum, item) => sum + item.count, 0)
  const labeled = distribution.items.map((item) => ({
    key: item.label,
    name: labelOf(catalogKind, item.label),
    count: item.count,
    unknown: isUnknownLabel(item.label),
  }))
  const visible = maxItems ? labeled.slice(0, maxItems) : labeled
  const hidden = labeled.length - visible.length
  const max = Math.max(1, ...visible.map((item) => item.count))

  if (distribution.items.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No hay datos para esta población.
      </p>
    )
  }

  if (
    foldAfter != null &&
    labeled.filter((item) => !item.unknown).length > foldAfter
  ) {
    return (
      <FoldedBars
        items={labeled}
        foldAfter={foldAfter}
        foldLabel={foldLabel}
        total={total}
        columns={columns}
      />
    )
  }

  return (
    <div className={cn(compact && "text-[13px]")}>
      {visible.map((item) => (
        <MetricBar
          key={item.key}
          label={item.name}
          count={item.count}
          max={shareOfTotal ? total : max}
          total={shareOfTotal ? total : undefined}
          unknown={item.unknown}
          columns={columns}
        />
      ))}
      {hidden > 0 && (
        <p className="text-muted-foreground pt-1 text-xs">
          +{hidden} categorías más
        </p>
      )}
    </div>
  )
}

export function MetricBar({
  label,
  count,
  max,
  total,
  unknown = false,
  columns,
}: {
  label: string
  count: number
  max: number
  total?: number
  unknown?: boolean
  columns: string
}) {
  const width = max > 0 ? (count / max) * 100 : 0
  const share =
    total && total > 0 ? ` · ${Math.round((count / total) * 100)}%` : ""
  return (
    <div
      className="grid items-center gap-3 py-1.5 text-[13px]"
      style={{ gridTemplateColumns: columns }}
    >
      <span
        className={cn("min-w-0 truncate", unknown && "text-muted-foreground")}
      >
        {label}
      </span>
      <div className="bg-muted h-2.5 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full",
            unknown
              ? "bg-[repeating-linear-gradient(45deg,var(--muted-foreground)_0_4px,transparent_4px_8px)] opacity-40"
              : "bg-foreground",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      <em className="text-muted-foreground text-right text-[13px] not-italic">
        <b className="text-foreground font-medium tabular-nums">
          {number.format(count)}
        </b>
        {share}
      </em>
    </div>
  )
}

function FoldedBars({
  items,
  foldAfter,
  foldLabel,
  total,
  columns,
}: {
  items: { key: string; name: string; count: number; unknown: boolean }[]
  foldAfter: number
  foldLabel: string
  total: number
  columns: string
}) {
  const [open, setOpen] = useState(false)
  const unknown = items.filter((item) => item.unknown)
  const known = items.filter((item) => !item.unknown)
  const head = known.slice(0, foldAfter)
  const rest = known.slice(foldAfter)
  const restCount = rest.reduce((sum, item) => sum + item.count, 0)

  return (
    <div>
      {head.map((item) => (
        <MetricBar
          key={item.key}
          label={item.name}
          count={item.count}
          max={total}
          total={total}
          columns={columns}
        />
      ))}
      {rest.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="hover:bg-muted/60 -mx-2 grid w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px]"
            style={{ gridTemplateColumns: columns }}
          >
            <span className="min-w-0 truncate">
              <span
                className={cn(
                  "text-muted-foreground mr-1.5 inline-block transition-transform",
                  open && "rotate-90",
                )}
              >
                ›
              </span>
              {foldLabel}
            </span>
            <div className="bg-muted h-2.5 overflow-hidden rounded-full">
              <div
                className="bg-foreground h-full rounded-full"
                style={{ width: `${total ? (restCount / total) * 100 : 0}%` }}
              />
            </div>
            <em className="text-muted-foreground text-right text-[13px] not-italic">
              <b className="text-foreground font-medium tabular-nums">
                {number.format(restCount)}
              </b>
              {total ? ` · ${Math.round((restCount / total) * 100)}%` : ""}
            </em>
          </button>
          {open && (
            <div className="border-border ml-1.5 border-l-2 py-1 pl-4">
              <div className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
                {rest.map((item) => (
                  <MetricBar
                    key={item.key}
                    label={item.name}
                    count={item.count}
                    max={Math.max(1, rest[0]?.count ?? 1)}
                    total={total}
                    columns="1fr 4.5rem 4.5rem"
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {unknown.map((item) => (
        <MetricBar
          key={item.key}
          label={item.name}
          count={item.count}
          max={total}
          total={total}
          unknown
          columns={columns}
        />
      ))}
    </div>
  )
}
