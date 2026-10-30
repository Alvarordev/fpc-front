import { useState } from "react"
import { Link } from "react-router-dom"
import { TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import type { Alert } from "@/api/alerts"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { CopyValue } from "@/components/ds/copy-value"
import { FieldGrid } from "@/components/ds/data"
import { TextArea } from "@/components/ds/form"
import { Modal } from "@/components/ds/modal"
import { useAuthStore } from "@/store/auth-store"
import { alertSeverityChip, alertStatusChip, formatAlertDate } from "../_lib/alert-copy"
import { useResolveAlert, useReviewAlert } from "../_hooks/use-alerts"
import { AlertHistory } from "./alert-history"
import { AlertManagePanel } from "./alert-manage-panel"

export function AlertDetailModal({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  const canResolve = useAuthStore((state) => state.user?.role === "FOUNDATION")
  const review = useReviewAlert()
  const resolve = useResolveAlert()
  const [intent, setIntent] = useState<"review" | "resolve" | null>(null)
  const [notes, setNotes] = useState("")
  const [alertId, setAlertId] = useState<string | null>(null)
  if (alert && alert.id !== alertId) {
    setAlertId(alert.id)
    setIntent(null)
    setNotes("")
  }
  if (!alert) return null

  const pending = review.isPending || resolve.isPending
  const status = alertStatusChip[alert.status]
  const severity = alertSeverityChip[alert.severity]

  async function runReview() {
    if (!alert) return
    try {
      await review.mutateAsync(alert.id)
      toast.success("Alerta en revisión")
      setIntent(null)
    } catch (error) {
      toast.error("No se pudo pasar la alerta a revisión", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      })
    }
  }

  async function runResolve() {
    if (!alert) return
    const resolutionNotes = notes.trim()
    if (!resolutionNotes) return
    try {
      await resolve.mutateAsync({ id: alert.id, resolutionNotes })
      toast.success("Alerta resuelta")
      setIntent(null)
      setNotes("")
    } catch (error) {
      toast.error("No se pudo resolver la alerta", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      })
    }
  }

  if (intent === "review") {
    return (
      <Modal
        open
        onClose={() => !pending && setIntent(null)}
        icon={TriangleAlert}
        title="Pasar a revisión"
        description={alert.title}
        footer={
          <>
            <Button onClick={() => setIntent(null)} disabled={pending}>
              Volver
            </Button>
            <Button variant="dark" disabled={pending} onClick={() => void runReview()}>
              {pending ? "Guardando…" : "Pasar a revisión"}
            </Button>
          </>
        }
      >
        <p className="px-1 text-sm text-zinc-700">Pasa a revisión. Quien da seguimiento la ve en ese estado.</p>
      </Modal>
    )
  }

  if (intent === "resolve") {
    return (
      <Modal
        open
        onClose={() => !pending && setIntent(null)}
        icon={TriangleAlert}
        title="Marcar resuelta"
        description={alert.title}
        footer={
          <>
            <Button onClick={() => setIntent(null)} disabled={pending}>
              Volver
            </Button>
            <Button variant="dark" disabled={pending || !notes.trim()} onClick={() => void runResolve()}>
              {pending ? "Guardando…" : "Marcar resuelta"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-700">
            Queda resuelta. El historial guarda la nota y ya no se puede derivar ni vincular reportes.
          </p>
          <TextArea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Qué se hizo para resolverla"
          />
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      icon={TriangleAlert}
      title={alert.title}
      description={alert.healthCenterName}
      tags={
        <>
          <Chip tone={status.tone}>{status.label}</Chip>
          <Chip tone={severity.tone}>{severity.label}</Chip>
          {alert.categoryLabel && <Chip>{alert.categoryLabel}</Chip>}
        </>
      }
      footer={
        alert.status !== "RESOLVED" ? (
          <>
            {alert.status === "REPORTED" && (
              <Button onClick={() => setIntent("review")}>Pasar a revisión</Button>
            )}
            {canResolve && (
              <Button variant="dark" onClick={() => setIntent("resolve")}>
                Marcar resuelta
              </Button>
            )}
          </>
        ) : undefined
      }
    >
      <Panel>
        <FieldGrid
          items={[
            ["Establecimiento", alert.healthCenterName],
            ["Categoría", alert.categoryLabel ?? "Sin categoría"],
            [
              "Paciente",
              <Link
                key="patient"
                to={`/pacientes/${alert.patientId}`}
                className="underline decoration-zinc-300 underline-offset-2"
              >
                {alert.patientFullName}
              </Link>,
            ],
            ["Ticket", alert.ticketNumber ? <CopyValue value={alert.ticketNumber} label="Ticket" /> : "Sin ticket"],
            ["Reportada", `${formatAlertDate(alert.createdAt)}${alert.createdByName ? ` por ${alert.createdByName}` : ""}`],
            ...(alert.resolvedAt
              ? [["Resuelta", `${formatAlertDate(alert.resolvedAt)}${alert.resolvedByName ? ` por ${alert.resolvedByName}` : ""}`] as [string, string]]
              : []),
          ]}
        />
        <p className="mt-4 text-sm leading-relaxed text-zinc-700">{alert.description}</p>
        {alert.derivedToLabel && (
          <p className="mt-3 text-[13px] text-zinc-500">
            Derivada a {alert.derivedToLabel}
            {alert.derivationNotes ? `: ${alert.derivationNotes}` : ""}
          </p>
        )}
        {alert.resolutionNotes && <p className="mt-3 text-[13px] text-zinc-600">{alert.resolutionNotes}</p>}
      </Panel>
      <AlertHistory alertId={alert.id} />
      <AlertManagePanel key={alert.id} alert={alert} />
    </Modal>
  )
}
