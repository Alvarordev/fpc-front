import { useState } from "react"
import { GraduationCap, Search } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { Input } from "@/components/ui/input"
import { CatalogSelect } from "@/components/catalog-select"
import { useTalkInterests } from "../_hooks/use-talk-interests"
import { useTalkInterestColumns } from "./talk-interests-columns"

export function TalkInterestsContent() {
  const [search, setSearch] = useState("")
  const [talk, setTalk] = useState<string | null>(null)
  const { data, isLoading } = useTalkInterests({
    search: search.trim() || undefined,
    talk: talk ?? undefined,
    limit: 100,
  })
  const columns = useTalkInterestColumns()
  const interests = data?.data ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-xl font-semibold tracking-tight">
            <GraduationCap className="text-primary size-5" />
            Charlas de prevención
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {data?.total ?? 0} acompañantes interesados en una charla
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Buscar acompañante o paciente..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="bg-background h-8 pl-8 text-sm"
          />
        </div>
        <div className="w-64">
          <CatalogSelect
            kind="educational_talk"
            value={talk}
            onValueChange={setTalk}
            placeholder="Todas las charlas"
            triggerClassName="h-8"
          />
        </div>
      </div>

      <DataTable
        data={interests}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Nadie registró interés en una charla con estos filtros."
      />
    </div>
  )
}
