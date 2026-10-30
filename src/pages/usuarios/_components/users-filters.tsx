import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, X } from "lucide-react"
import type { User } from "@/api/users"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { TextInput } from "@/components/ds/form"
import { userRoleLabels } from "@/lib/user-questions"
import {
  DEFAULT_USER_FILTERS,
  countByRole,
  countByStatus,
  readUserFilters,
  writeUserFilters,
  type UserFilters,
  type UserRoleFilter,
  type UserStatusFilter,
} from "../_lib/user-filters"

export function UsersFilters({ users, names }: { users: User[]; names: Record<string, string> }) {
  const [params, setParams] = useSearchParams()
  const filters = readUserFilters(params)
  const [searchInput, setSearchInput] = useState(filters.search)
  const [syncedSearch, setSyncedSearch] = useState(filters.search)
  if (syncedSearch !== filters.search) {
    setSyncedSearch(filters.search)
    setSearchInput(filters.search)
  }

  useEffect(() => {
    if (searchInput === filters.search) return
    const timer = window.setTimeout(() => {
      setParams((current) => writeUserFilters(current, { ...readUserFilters(current), search: searchInput }), { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput, filters.search, setParams])

  function commit(partial: Partial<UserFilters>) {
    setParams(writeUserFilters(params, { ...readUserFilters(params), ...partial }), { replace: true })
  }

  const roleCounts = useMemo(() => countByRole(users, filters, names), [users, filters, names])
  const statusCounts = useMemo(() => countByStatus(users, filters, names), [users, filters, names])
  const chips = filterChips(filters)

  return (
    <div className="space-y-3">
      <div className="relative min-w-56 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <TextInput
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nombre o correo"
          aria-label="Buscar usuarios"
          className="pl-9"
        />
      </div>
      <FilterToggles
        value={filters.role}
        onChange={(role) => commit({ role })}
        options={[
          { id: "all" as UserRoleFilter, label: "Todos", count: roleCounts.all },
          { id: "AGENT", label: userRoleLabels.AGENT, count: roleCounts.AGENT },
          { id: "VOLUNTEER", label: userRoleLabels.VOLUNTEER, count: roleCounts.VOLUNTEER },
          { id: "FOUNDATION", label: userRoleLabels.FOUNDATION, count: roleCounts.FOUNDATION },
          { id: "ADMIN", label: userRoleLabels.ADMIN, count: roleCounts.ADMIN },
        ]}
      />
      <FilterToggles
        value={filters.status}
        onChange={(status) => commit({ status })}
        options={[
          { id: "active" as UserStatusFilter, label: "Activos", count: statusCounts.active },
          { id: "inactive", label: "Inactivos", count: statusCounts.inactive },
          { id: "all", label: "Todos", count: statusCounts.all },
        ]}
      />
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() =>
                commit({
                  [chip.id]: chip.id === "search" ? "" : chip.id === "status" ? "active" : "all",
                })
              }
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200"
            >
              {chip.text}
              <X className="size-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSearchInput("")
              setParams(writeUserFilters(params, DEFAULT_USER_FILTERS), { replace: true })
            }}
            className="text-[13px] text-zinc-600 underline decoration-zinc-300 underline-offset-2"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}

function filterChips(filters: UserFilters) {
  const chips: { id: keyof UserFilters; text: string }[] = []
  if (filters.search.trim()) chips.push({ id: "search", text: `“${filters.search.trim()}”` })
  if (filters.role !== "all") chips.push({ id: "role", text: userRoleLabels[filters.role] })
  if (filters.status === "inactive") chips.push({ id: "status", text: "Inactivos" })
  if (filters.status === "all") chips.push({ id: "status", text: "Todos los estados" })
  return chips
}
