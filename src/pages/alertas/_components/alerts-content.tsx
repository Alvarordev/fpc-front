import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AddButton } from "@/components/ds/button"
import { DataTable } from "@/components/ds/data-table"
import { useAlerts } from "../_hooks/use-alerts"
import { matchesAlert, readAlertFilters } from "../_lib/alert-filters"
import { AlertDetailModal } from "./alert-detail-modal"
import { alertColumns } from "./alerts-columns"
import { AlertsFilters } from "./alerts-filters"
import { ReportAlertModal } from "./report-alert-modal"

export function AlertsContent() {
  const [params] = useSearchParams()
  const filters = readAlertFilters(params)
  const { data: alerts = [], isLoading } = useAlerts("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const visible = useMemo(
    () =>
      alerts
        .filter((alert) => matchesAlert(alert, filters))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [alerts, filters],
  )
  const selected = alerts.find((alert) => alert.id === selectedId) ?? null
  const columns = useMemo(() => alertColumns(), [])
  const empty = alerts.length === 0

  return (
    <div className="font-ds space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Alertas</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            {visible.length === alerts.length ? `${visible.length} alertas` : `${visible.length} de ${alerts.length}`}
          </p>
        </div>
        <AddButton onClick={() => setCreating(true)}>Reportar incidencia</AddButton>
      </header>

      <AlertsFilters alerts={alerts} />

      <DataTable
        data={visible}
        columns={columns}
        isLoading={isLoading}
        onRowClick={(alert) => setSelectedId(alert.id)}
        emptyTitle={empty ? "Todavía no hay alertas" : "Ninguna alerta coincide"}
        emptyBody={
          empty
            ? "Reporta la primera cuando un hospital no entrega un tratamiento, una cita o un trámite."
            : "Prueba con otro estado, otra severidad o quita el establecimiento."
        }
        emptyAction={empty ? "Reportar incidencia" : undefined}
        onEmptyAction={empty ? () => setCreating(true) : undefined}
      />

      <AlertDetailModal alert={selected} onClose={() => setSelectedId(null)} />
      <ReportAlertModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
