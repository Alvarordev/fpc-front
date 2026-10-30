import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import type { HealthCenter } from "@/api/health-centers"
import { AddButton } from "@/components/ds/button"
import { DataTable } from "@/components/ds/data-table"
import { useHealthCenters } from "../_hooks/use-health-centers"
import { hasNarrowingFilters, matchesHospital, readHospitalFilters } from "../_lib/hospital-filters"
import { HospitalDetailModal } from "./hospital-detail-modal"
import { HospitalFormModal } from "./hospital-form-modal"
import { hospitalColumns } from "./hospitals-columns"
import { HospitalsFilters } from "./hospitals-filters"

export function HealthCentersContent() {
  const [params] = useSearchParams()
  const filters = readHospitalFilters(params)
  const { data: centers = [], isLoading } = useHealthCenters()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<HealthCenter | null>(null)
  const [creating, setCreating] = useState(false)

  const visible = useMemo(() => centers.filter((center) => matchesHospital(center, filters)), [centers, filters])
  const selected = centers.find((center) => center.id === selectedId) ?? null
  const narrowed = hasNarrowingFilters(filters)
  const columns = useMemo(() => hospitalColumns(), [])

  return (
    <div className="font-ds space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Hospitales</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            {narrowed ? `${visible.length} de ${centers.length}` : `${visible.length} hospitales`}
          </p>
        </div>
        <AddButton onClick={() => setCreating(true)}>Nuevo hospital</AddButton>
      </header>

      <HospitalsFilters centers={centers} />

      <DataTable
        data={visible}
        columns={columns}
        isLoading={isLoading}
        onRowClick={(center) => setSelectedId(center.id)}
        emptyTitle={narrowed ? "Ningún hospital coincide" : "Todavía no hay hospitales"}
        emptyBody={
          narrowed
            ? "Prueba con otro nombre o quita un filtro de arriba."
            : "Registra el primero para poder asociarlo a los pacientes."
        }
        emptyAction={narrowed ? undefined : "Nuevo hospital"}
        onEmptyAction={narrowed ? undefined : () => setCreating(true)}
      />

      <HospitalDetailModal
        center={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(center) => {
          setSelectedId(null)
          setEditing(center)
        }}
      />
      <HospitalFormModal open={creating} onClose={() => setCreating(false)} />
      <HospitalFormModal open={Boolean(editing)} center={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
