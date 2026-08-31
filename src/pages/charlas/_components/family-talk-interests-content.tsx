import { useState } from "react"
import { GraduationCap, Search } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { Input } from "@/components/ui/input"
import { useFamilyTalkInterests } from "../_hooks/use-family-talk-interests"
import { useFamilyTalkInterestColumns } from "./family-talk-interests-columns"

export function FamilyTalkInterestsContent() {
  const [search, setSearch] = useState("")
  const { data, isLoading } = useFamilyTalkInterests({
    search: search.trim() || undefined,
    limit: 100,
  })
  const columns = useFamilyTalkInterestColumns()
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
            {data?.total ?? 0} familiares interesados registrados en
            enrolamiento
          </p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
        <Input
          placeholder="Buscar familiar o paciente..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="bg-background h-8 pl-8 text-sm"
        />
      </div>

      <DataTable
        data={interests}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No hay familiares interesados en charlas de prevención."
      />
    </div>
  )
}
