import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { alertsApi, type Alert } from "@/api/alerts"
import { Button } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { Field, SelectField, TextArea, TextInput } from "@/components/ds/form"
import { AiMark } from "@/components/ds/icon"
import { useCatalog } from "@/hooks/use-catalog"

export function AlertManagePanel({ alert }: { alert: Alert }) {
  const queryClient = useQueryClient()
  const closed = alert.status === "RESOLVED"
  const [entityCode, setEntityCode] = useState(alert.derivedTo ?? "")
  const [notes, setNotes] = useState(alert.derivationNotes ?? "")
  const [followUpId, setFollowUpId] = useState("")
  const [confirmNotify, setConfirmNotify] = useState(false)
  const entities = useCatalog("alert_derivation_entity")
  const entityOptions = (entities.data ?? [])
    .filter((item) => item.isActive)
    .map((item) => ({ value: item.code, label: item.label }))

  const reportsQuery = useQuery({
    queryKey: ["alert-reports", alert.id],
    queryFn: () => alertsApi.listReports(alert.id),
  })
  const affectedQuery = useQuery({
    queryKey: ["alert-affected", alert.id],
    queryFn: () => alertsApi.affectedPatients(alert.id),
  })

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["alerts"] })
    await queryClient.invalidateQueries({ queryKey: ["alert-reports", alert.id] })
    await queryClient.invalidateQueries({ queryKey: ["alert-affected", alert.id] })
    await queryClient.invalidateQueries({ queryKey: ["alert-events", alert.id] })
  }

  const derive = useMutation({
    mutationFn: () => alertsApi.derive(alert.id, { entityCode, notes: notes.trim() }),
    onSuccess: async () => {
      await refresh()
      toast.success("Alerta derivada")
    },
    onError: (error: Error) => toast.error("No se pudo derivar la alerta", { description: error.message }),
  })
  const linkReport = useMutation({
    mutationFn: () => alertsApi.linkReport(alert.id, { followUpId: followUpId.trim() }),
    onSuccess: async () => {
      setFollowUpId("")
      await refresh()
      toast.success("Reporte vinculado")
    },
    onError: (error: Error) => toast.error("No se pudo vincular el reporte", { description: error.message }),
  })
  const notify = useMutation({
    mutationFn: () => alertsApi.notifyAffectedPatients(alert.id),
    onSuccess: async (result) => {
      setConfirmNotify(false)
      await refresh()
      toast.success(
        result.emailEnabled
          ? `Avisos enviados: ${result.sent} de ${result.withEmail}`
          : "El correo no está configurado. Copia el texto para avisar a mano.",
      )
    },
    onError: (error: Error) => toast.error("No se pudo avisar por correo", { description: error.message }),
  })
  const summary = useMutation({
    mutationFn: () => alertsApi.generateAISummary(alert.id),
    onSuccess: async () => {
      await refresh()
      toast.success("Resumen generado")
    },
    onError: (error: Error) => toast.error("No se pudo generar el resumen", { description: error.message }),
  })

  async function copyAffectedText() {
    const text = affectedQuery.data?.text
    if (!text) return
    await navigator.clipboard.writeText(text)
    toast.success("Texto de pacientes afectados copiado")
  }

  const reports = reportsQuery.data ?? []
  const patients = affectedQuery.data?.patients ?? []

  return (
    <Panel title="Gestionar">
      <div className="space-y-5">
        {alert.aiSummary && (
          <div className="flex gap-2">
            <AiMark icon={Sparkles} />
            <p className="text-[13px] leading-relaxed text-zinc-700">{alert.aiSummary}</p>
          </div>
        )}
        <Button disabled={summary.isPending} onClick={() => summary.mutate()}>
          {summary.isPending ? "Guardando…" : alert.aiSummary ? "Actualizar resumen" : "Generar resumen"}
        </Button>

        {!closed && (
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-zinc-700">Derivar</p>
            <Field label="Entidad">
              {(id) => (
                <SelectField
                  id={id}
                  value={entityCode || null}
                  onChange={setEntityCode}
                  options={entityOptions}
                  placeholder="Elegir entidad"
                />
              )}
            </Field>
            <Field label="Nota de la derivación">
              {(id) => (
                <TextArea
                  id={id}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="A quién se deriva y por qué"
                />
              )}
            </Field>
            <Button variant="dark" disabled={!entityCode || !notes.trim() || derive.isPending} onClick={() => derive.mutate()}>
              {derive.isPending ? "Guardando…" : "Derivar"}
            </Button>
            {alert.derivedToLabel && (
              <p className="text-[13px] text-zinc-500">
                Derivada a {alert.derivedToLabel}
                {alert.derivationNotes ? `: ${alert.derivationNotes}` : ""}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-[13px] font-medium text-zinc-700">Reportes vinculados ({reports.length})</p>
          {reportsQuery.isLoading ? (
            <p className="text-[13px] text-zinc-500">Cargando reportes…</p>
          ) : reportsQuery.isError ? (
            <p className="text-[13px] text-red-700">No se pudieron cargar los reportes.</p>
          ) : reports.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Todavía no hay reportes vinculados.</p>
          ) : (
            <ul className="space-y-1">
              {reports.map((report) => (
                <li key={report.id} className="text-[13px] text-zinc-800">
                  {report.patientFullName}
                  <span className="text-zinc-500">
                    {" "}
                    · {new Date(report.reportedAt).toLocaleDateString("es-PE")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!closed && (
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Seguimiento a vincular" className="min-w-56 flex-1" hint="Identificador del seguimiento de otro paciente.">
                {(id) => (
                  <TextInput
                    id={id}
                    value={followUpId}
                    onChange={(event) => setFollowUpId(event.target.value)}
                    placeholder="Pega el identificador"
                  />
                )}
              </Field>
              <Button disabled={!followUpId.trim() || linkReport.isPending} onClick={() => linkReport.mutate()}>
                {linkReport.isPending ? "Guardando…" : "Vincular reporte"}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[13px] font-medium text-zinc-700">Pacientes afectados ({patients.length})</p>
          {affectedQuery.isLoading ? (
            <p className="text-[13px] text-zinc-500">Cargando pacientes…</p>
          ) : affectedQuery.isError ? (
            <p className="text-[13px] text-red-700">No se pudieron cargar los pacientes afectados.</p>
          ) : patients.length === 0 ? (
            <p className="text-[13px] text-zinc-500">No hay pacientes con tratamiento en proceso en este hospital.</p>
          ) : (
            <ul className="space-y-1">
              {patients.map((patient) => (
                <li key={patient.patientId} className="text-[13px] text-zinc-800">
                  {patient.fullName}
                  {patient.phone ? ` · ${patient.phone}` : ""}
                  {patient.email ? ` · ${patient.email}` : ""}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button disabled={!affectedQuery.data?.text} onClick={() => void copyAffectedText()}>
              Copiar texto
            </Button>
            {confirmNotify ? (
              <div className="w-full space-y-2 rounded-[14px] bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
                <p className="text-[13px] text-zinc-700">
                  Envía un correo a los pacientes con tratamiento en este hospital que tienen correo. Quienes no tienen correo no reciben el aviso.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setConfirmNotify(false)} disabled={notify.isPending}>
                    Cancelar
                  </Button>
                  <Button variant="dark" disabled={notify.isPending} onClick={() => notify.mutate()}>
                    {notify.isPending ? "Guardando…" : "Enviar avisos"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button disabled={!patients.length} onClick={() => setConfirmNotify(true)}>
                Avisar por correo
              </Button>
            )}
          </div>
        </div>
      </div>
    </Panel>
  )
}
