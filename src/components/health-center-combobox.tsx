import { useEffect, useId, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react"
import { healthCentersApi } from "@/api/health-centers"
import { DEPARTMENT_LABELS } from "@/pages/hospitales/_utils/departments"
import { careLevelLabel } from "@/lib/health-center-labels"
import { cn } from "@/lib/utils"

interface HealthCenterComboboxProps {
  value: string | null | undefined
  onValueChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function HealthCenterCombobox({
  value,
  onValueChange,
  placeholder = "Buscar establecimiento...",
  disabled = false,
  className,
  id,
}: HealthCenterComboboxProps) {
  const generatedId = useId()
  const listId = `${id ?? generatedId}-list`
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const selectedQuery = useQuery({
    queryKey: ["health-center", value],
    queryFn: () => healthCentersApi.getById(value!),
    enabled: Boolean(value),
    staleTime: 5 * 60 * 1000,
  })

  const canSearch = debouncedSearch.length >= 2
  const resultsQuery = useQuery({
    queryKey: ["health-centers", "search", debouncedSearch],
    queryFn: () =>
      healthCentersApi.list({ search: debouncedSearch, isActive: "true" }),
    enabled: open && canSearch,
    staleTime: 30 * 1000,
  })

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  const selected = selectedQuery.data
  const selectedText = selected
    ? formatResult(selected.name, selected.department, selected.careLevel)
    : value
      ? "Establecimiento seleccionado"
      : ""

  return (
    <div ref={containerRef} className={cn("relative min-w-0", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={listId}
        className="border-input bg-background flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cn("truncate", !selectedText && "text-muted-foreground")}>
          {selectedText || placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {value ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Quitar establecimiento"
              className="text-muted-foreground hover:text-foreground rounded-sm p-0.5"
              onClick={(event) => {
                event.stopPropagation()
                onValueChange(null)
                setSearch("")
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  event.stopPropagation()
                  onValueChange(null)
                }
              }}
            >
              <X className="size-3.5" />
            </span>
          ) : null}
          <ChevronDown className="text-muted-foreground size-4" />
        </span>
      </button>

      {open ? (
        <div className="bg-popover absolute z-50 mt-1 w-full min-w-64 rounded-md border shadow-md">
          <div className="flex items-center gap-2 border-b px-2">
            <Search className="text-muted-foreground size-3.5" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Escribe al menos 2 caracteres"
              className="h-9 w-full bg-transparent text-sm outline-none"
              aria-label="Buscar establecimiento"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1">
            {!canSearch ? (
              <li className="text-muted-foreground px-2 py-3 text-xs">
                Escribe al menos 2 caracteres para buscar entre los establecimientos.
              </li>
            ) : resultsQuery.isFetching ? (
              <li className="text-muted-foreground flex items-center gap-2 px-2 py-3 text-xs">
                <Loader2 className="size-3.5 animate-spin" />
                Buscando…
              </li>
            ) : resultsQuery.isError ? (
              <li className="text-destructive px-2 py-3 text-xs">
                No se pudo buscar. Inténtalo de nuevo.
              </li>
            ) : (resultsQuery.data ?? []).length === 0 ? (
              <li className="text-muted-foreground px-2 py-3 text-xs">
                No hay establecimientos con ese nombre.
              </li>
            ) : (
              resultsQuery.data?.map((center) => {
                const selectedItem = center.id === value
                return (
                  <li key={center.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedItem}
                      className="hover:bg-accent flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
                      onClick={() => {
                        onValueChange(center.id)
                        setOpen(false)
                        setSearch("")
                      }}
                    >
                      <Check
                        className={cn(
                          "mt-0.5 size-3.5 shrink-0",
                          selectedItem ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{center.name}</span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {formatResult(null, center.department, center.careLevel)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function formatResult(
  name: string | null,
  department: string,
  careLevel: string | null,
) {
  const parts = [
    name,
    DEPARTMENT_LABELS[department] ?? department,
    careLevelLabel(careLevel),
  ].filter(Boolean)
  return parts.join(" · ")
}
