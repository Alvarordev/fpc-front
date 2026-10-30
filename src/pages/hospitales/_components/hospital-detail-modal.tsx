import { useState } from "react"
import { Building2 } from "lucide-react"
import { toast } from "sonner"
import type { HealthCenter } from "@/api/health-centers"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { FieldGrid } from "@/components/ds/data"
import { Modal } from "@/components/ds/modal"
import { careLevelLabel, institutionLabel } from "@/lib/health-center-labels"
import { DEPARTMENT_LABELS } from "../_utils/departments"
import { useDeleteHealthCenter, useReactivateHealthCenter } from "../_hooks/use-health-centers"

export function HospitalDetailModal({
  center,
  onClose,
  onEdit,
}: {
  center: HealthCenter | null
  onClose: () => void
  onEdit: (center: HealthCenter) => void
}) {
  const deactivate = useDeleteHealthCenter()
  const reactivate = useReactivateHealthCenter()
  const [confirmFor, setConfirmFor] = useState<string | null>(null)
  if (center && confirmFor && confirmFor !== center.id) setConfirmFor(null)
  if (!center) return null

  const confirming = confirmFor === center.id
  const pending = deactivate.isPending || reactivate.isPending

  async function runReactivate() {
    if (!center) return
    try {
      await reactivate.mutateAsync(center.id)
      toast.success("Hospital reactivado", { description: `${center.name} vuelve a aparecer al registrar pacientes.` })
    } catch (error) {
      toast.error("No se pudo reactivar el hospital", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      })
    }
  }

  async function runDeactivate() {
    if (!center) return
    try {
      await deactivate.mutateAsync(center.id)
      toast.success("Hospital desactivado", { description: center.name })
      setConfirmFor(null)
    } catch (error) {
      toast.error("No se pudo desactivar el hospital", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      })
    }
  }

  if (confirming) {
    return (
      <Modal
        open
        onClose={() => !pending && setConfirmFor(null)}
        icon={Building2}
        title="Desactivar hospital"
        description={center.name}
        footer={
          <>
            <Button onClick={() => setConfirmFor(null)} disabled={pending}>
              Volver
            </Button>
            <Button variant="dark" disabled={pending} onClick={() => void runDeactivate()}>
              {pending ? "Guardando…" : "Desactivar"}
            </Button>
          </>
        }
      >
        <p className="px-1 text-sm text-zinc-700">Deja de aparecer al registrar pacientes. Los pacientes ya asociados lo conservan.</p>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      icon={Building2}
      title={center.name}
      tags={center.isActive ? <Chip tone="green">Activo</Chip> : <Chip tone="gray">Inactivo</Chip>}
      footer={
        <>
          <Button onClick={() => onEdit(center)} disabled={pending}>
            Editar
          </Button>
          {center.isActive ? (
            <Button variant="dark" disabled={pending} onClick={() => setConfirmFor(center.id)}>
              Desactivar
            </Button>
          ) : (
            <Button variant="dark" disabled={pending} onClick={() => void runReactivate()}>
              {reactivate.isPending ? "Guardando…" : "Reactivar"}
            </Button>
          )}
        </>
      }
    >
      <Panel>
        <FieldGrid
          items={[
            ["Departamento", DEPARTMENT_LABELS[center.department] ?? "Sin registrar"],
            ["Nivel", careLevelLabel(center.careLevel) ?? "Sin registrar"],
            ["Categoría", center.careCategory ?? "Sin registrar"],
            ["Institución", institutionLabel(center.institution) ?? "Sin registrar"],
            ["RENIPRESS", center.renipressCode ?? "Sin registrar"],
            ["Ubigeo", center.ubigeoDistrictCode ?? "Sin registrar"],
            ["Pacientes atendidos", String(center.patientCount)],
          ]}
        />
      </Panel>
    </Modal>
  )
}
