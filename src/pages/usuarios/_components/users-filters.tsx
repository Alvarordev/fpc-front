import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search } from "lucide-react"
import type { User } from "@/api/users"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { SelectField, TextInput } from "@/components/ds/form"
import { userRoleLabels } from "@/lib/user-questions"
import {
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
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1 sm:max-w-xs">
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
      <div className="w-44 sm:ml-auto">
        <SelectField
          value={filters.status}
          onChange={(status: UserStatusFilter) => commit({ status })}
          options={[
            { value: "active", label: `Activos (${statusCounts.active})` },
            { value: "inactive", label: `Inactivos (${statusCounts.inactive})` },
            { value: "all", label: `Todos los estados (${statusCounts.all})` },
          ]}
        />
      </div>
    </div>
  )
}
