import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search } from "lucide-react"
import { DataTable } from "@/components/ds/data-table"
import { TextInput } from "@/components/ds/form"
import { SearchSelect } from "@/components/ds/search-select"
import { useCatalog } from "@/hooks/use-catalog"
import { useTalkInterests } from "../_hooks/use-talk-interests"
import { readTalkFilters, talkFiltersNarrow, writeTalkFilters } from "../_lib/talk-filters"
import { talkInterestColumns } from "./talk-interests-columns"

export function TalkInterestsContent() {
  const [params, setParams] = useSearchParams()
  const filters = readTalkFilters(params)
  const [searchInput, setSearchInput] = useState(filters.search)
  const [syncedSearch, setSyncedSearch] = useState(filters.search)
  if (syncedSearch !== filters.search) {
    setSyncedSearch(filters.search)
    setSearchInput(filters.search)
  }

  useEffect(() => {
    if (searchInput === filters.search) return
    const timer = window.setTimeout(() => {
      setParams((current) => {
        const currentFilters = readTalkFilters(current)
        if (currentFilters.search === searchInput) return current
        return writeTalkFilters(current, { ...currentFilters, search: searchInput })
      }, { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput, filters.search, setParams])

  const { data: talks = [] } = useCatalog("educational_talk")
  const list = useTalkInterests({
    search: filters.search.trim() || undefined,
    talk: filters.talk ?? undefined,
    limit: 100,
  })
  const everyone = useTalkInterests({ limit: 1 })
  const rows = list.data?.data ?? []
  const total = everyone.data?.total ?? list.data?.total ?? 0
  const visible = list.data?.total ?? rows.length
  const narrowed = talkFiltersNarrow(filters)
  const columns = useMemo(() => talkInterestColumns(), [])

  return (
    <div className="font-ds space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Charlas de prevención</h1>
        <p className="mt-0.5 text-[13px] text-zinc-500">
          {narrowed ? `${visible} de ${total}` : `${visible} interesados`}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <TextInput
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre"
            aria-label="Buscar interesados"
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-72">
          <SearchSelect
                value={filters.talk ?? "all"}
                onChange={(value) =>
                  setParams(writeTalkFilters(params, { ...filters, talk: value === "all" ? null : value }), { replace: true })
                }
                options={[{ value: "all", label: "Todas las charlas" }, ...talks.map((item) => ({ value: item.code, label: item.label }))]}
                placeholder="Todas las charlas"
                searchPlaceholder="Buscar charla"
              />
        </div>
      </div>


      <DataTable
        data={rows}
        columns={columns}
        isLoading={list.isLoading}
        emptyTitle={narrowed ? "Nadie coincide" : "Nadie anotó interés en una charla"}
        emptyBody={
          narrowed
            ? "Prueba con otro nombre o quita el filtro de la charla."
            : "Estos registros salen del enrolamiento, cuando un acompañante elige una charla de prevención."
        }
      />
    </div>
  )
}
