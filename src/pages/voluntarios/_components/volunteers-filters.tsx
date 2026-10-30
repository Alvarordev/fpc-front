import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search } from "lucide-react"
import type { Volunteer } from "@/api/volunteers"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { TextInput } from "@/components/ds/form"
import { matchesVolunteer, readVolunteerFilters, writeVolunteerFilters, type VolunteerStatus } from "../_lib/volunteer-filters"

export function VolunteersFilters({ volunteers }: { volunteers: Volunteer[] }) {
  const [params, setParams] = useSearchParams()
  const filters = readVolunteerFilters(params)
  const [searchInput, setSearchInput] = useState(filters.search)
  const [syncedSearch, setSyncedSearch] = useState(filters.search)
  if (syncedSearch !== filters.search) {
    setSyncedSearch(filters.search)
    setSearchInput(filters.search)
  }

  useEffect(() => {
    if (searchInput === filters.search) return
    const timer = window.setTimeout(() => {
      setParams((current) => writeVolunteerFilters(current, { ...readVolunteerFilters(current), search: searchInput }), { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput, filters.search, setParams])

  const visible = volunteers.filter((volunteer) => matchesVolunteer(volunteer, { ...filters, status: "all" }))
  const counts = {
    active: visible.filter((volunteer) => volunteer.isActive).length,
    inactive: visible.filter((volunteer) => !volunteer.isActive).length,
    all: visible.length,
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <TextInput
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nombre o especialidad"
          aria-label="Buscar voluntarios"
          className="pl-9"
        />
      </div>
      <FilterToggles
        value={filters.status}
        onChange={(status) =>
          setParams(writeVolunteerFilters(params, { ...filters, status }), { replace: true })
        }
        options={[
          { id: "active" as VolunteerStatus, label: "Activos", count: counts.active },
          { id: "inactive", label: "Inactivos", count: counts.inactive },
          { id: "all", label: "Todos", count: counts.all },
        ]}
      />
    </div>
  )
}
