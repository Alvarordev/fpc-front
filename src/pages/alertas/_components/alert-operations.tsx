import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  alertsApi,
  type Alert,
} from "@/api/alerts"
import { catalogsApi } from "@/api/catalogs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AlertOperations({ alert }: { alert: Alert }) {
  const [open, setOpen] = useState(false)
  if (alert.status === "RESOLVED" && !open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 text-xs"
        onClick={(event) => {
          event.stopPropagation()
          setOpen(true)
        }}
      >
        Reportes y afectados
      </Button>
    )
  }
  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 text-xs"
        onClick={(event) => {
          event.stopPropagation()
          setOpen(true)
        }}
      >
        Derivar, reportes y afectados
      </Button>
    )
  }
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <AlertOperationsBody alert={alert} onClose={() => setOpen(false)} />
    </div>
  )
}

function AlertOperationsBody({
  alert,
  onClose,
}: {
  alert: Alert
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [entityCode, setEntityCode] = useState(alert.derivedTo ?? "")
  const [notes, setNotes] = useState(alert.derivationNotes ?? "")
  const [followUpId, setFollowUpId] = useState("")
  const closed = alert.status === "RESOLVED"

  const entitiesQuery = useQuery({
    queryKey: ["catalogs", "alert_derivation_entity"],
    queryFn: () => catalogsApi.list({ kind: "alert_derivation_entity" }),
    staleTime: 60_000,
  })
  const reportsQuery = useQuery({
    queryKey: ["alert-reports", alert.id],
    queryFn: () => alertsApi.listReports(alert.id),
  })
  const affectedQuery = useQuery({
    queryKey: ["alert-affected", alert.id],
    queryFn: () => alertsApi.affectedPatients(alert.id),
  })

  const entityItems = (entitiesQuery.data ?? [])
    .filter((item) => item.isActive)
    .map((item) => ({ value: item.code, label: item.label }))

  async function refreshAlert() {
    await queryClient.invalidateQueries({ queryKey: ["alerts"] })
    await queryClient.invalidateQueries({ queryKey: ["alert-reports", alert.id] })
    await queryClient.invalidateQueries({ queryKey: ["alert-affected", alert.id] })
    await queryClient.invalidateQueries({ queryKey: ["alert-events", alert.id] })
  }

  const derive = useMutation({
    mutationFn: () =>
      alertsApi.derive(alert.id, { entityCode, notes: notes.trim() }),
    onSuccess: async () => {
      await refreshAlert()
      toast.success("Alerta derivada")
    },
    onError: (error: Error) =>
      toast.error("No se pudo derivar la alerta", { description: error.message }),
  })

  const linkReport = useMutation({
    mutationFn: () => alertsApi.linkReport(alert.id, { followUpId: followUpId.trim() }),
    onSuccess: async () => {
      setFollowUpId("")
      await refreshAlert()
      toast.success("Reporte vinculado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo vincular el reporte", { description: error.message }),
  })

  const notify = useMutation({
    mutationFn: () => alertsApi.notifyAffectedPatients(alert.id),
    onSuccess: async (result) => {
      await refreshAlert()
      toast.success(
        result.emailEnabled
          ? `Avisos enviados: ${result.sent} de ${result.withEmail}`
          : "El correo no está configurado. Copia el texto para avisar a mano.",
      )
    },
    onError: (error: Error) =>
      toast.error("No se pudo avisar por correo", { description: error.message }),
  })

  const summary = useMutation({
    mutationFn: () => alertsApi.generateAISummary(alert.id),
    onSuccess: async () => {
      await refreshAlert()
      toast.success("Resumen generado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo generar el resumen", { description: error.message }),
  })

  async function copyAffectedText() {
    const text = affectedQuery.data?.text
    if (!text) return
    await navigator.clipboard.writeText(text)
    toast.success("Texto de pacientes afectados copiado")
  }

  return (
    <div className="bg-muted/30 mt-3 space-y-4 rounded-lg border p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">Gestión de la alerta</p>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px]" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      {alert.aiSummary && (
        <p className="bg-background rounded-md border p-2 leading-relaxed">{alert.aiSummary}</p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        disabled={summary.isPending}
        onClick={() => summary.mutate()}
      >
        {alert.aiSummary ? "Actualizar resumen" : "Generar resumen"}
      </Button>

      {!closed && (
        <div className="space-y-2">
          <p className="font-medium">Derivar</p>
          <Select
            items={entityItems}
            value={entityCode}
            onValueChange={(value) => setEntityCode(value ?? "")}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Entidad de derivación" />
            </SelectTrigger>
            <SelectContent>
              {entityItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Nota de la derivación"
            className="min-h-16 bg-background text-xs"
          />
          <Button
            type="button"
            size="sm"
            className="h-7 text-xs"
            disabled={!entityCode || !notes.trim() || derive.isPending}
            onClick={() => derive.mutate()}
          >
            Derivar
          </Button>
          {alert.derivedToLabel && (
            <p className="text-muted-foreground">
              Derivada a {alert.derivedToLabel}
              {alert.derivationNotes ? `: ${alert.derivationNotes}` : ""}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <p className="font-medium">
          Reportes vinculados ({reportsQuery.data?.length ?? alert.reportsCount})
        </p>
        {reportsQuery.isLoading ? (
          <p className="text-muted-foreground">Cargando reportes...</p>
        ) : reportsQuery.isError ? (
          <p className="text-destructive">No se pudieron cargar los reportes.</p>
        ) : (reportsQuery.data ?? []).length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay reportes vinculados.</p>
        ) : (
          <ul className="space-y-1">
            {(reportsQuery.data ?? []).map((report) => (
              <li key={report.id} className="bg-background rounded-md border px-2 py-1.5">
                {report.patientFullName}
                <span className="text-muted-foreground">
                  {" "}
                  · {new Date(report.reportedAt).toLocaleDateString("es-PE")}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!closed && (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={followUpId}
              onChange={(event) => setFollowUpId(event.target.value)}
              placeholder="Id del seguimiento de otro paciente"
              className="h-8 max-w-sm bg-background text-xs"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={!followUpId.trim() || linkReport.isPending}
              onClick={() => linkReport.mutate()}
            >
              Vincular reporte
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="font-medium">
          Pacientes afectados ({affectedQuery.data?.patients.length ?? "…"})
        </p>
        {affectedQuery.isLoading ? (
          <p className="text-muted-foreground">Cargando pacientes...</p>
        ) : affectedQuery.isError ? (
          <p className="text-destructive">No se pudieron cargar los pacientes afectados.</p>
        ) : (affectedQuery.data?.patients.length ?? 0) === 0 ? (
          <p className="text-muted-foreground">
            No hay pacientes con tratamiento en proceso en este hospital.
          </p>
        ) : (
          <ul className="space-y-1">
            {affectedQuery.data?.patients.map((patient) => (
              <li key={patient.patientId}>
                {patient.fullName}
                {patient.phone ? ` · ${patient.phone}` : ""}
                {patient.email ? ` · ${patient.email}` : ""}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={!affectedQuery.data?.text}
            onClick={() => void copyAffectedText()}
          >
            Copiar texto
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={notify.isPending || !affectedQuery.data?.patients.length}
            onClick={() => notify.mutate()}
          >
            Avisar por correo
          </Button>
        </div>
      </div>
    </div>
  )
}
