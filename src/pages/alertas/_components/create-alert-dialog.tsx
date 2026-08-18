import { useState } from "react"
import { Plus, TriangleAlert, Loader2, Building2, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  SearchableSelect,
  type SearchableOption,
} from "@/components/ui/searchable-select"
import { useHealthCenters } from "@/pages/hospitales/_hooks/use-health-centers"
import { usePatients } from "@/pages/pacientes/_hooks/use-patients"
import { useCreateAlert } from "../_hooks/use-alerts"

interface CreateAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAlertDialog({
  open,
  onOpenChange,
}: CreateAlertDialogProps) {
  const [patientId, setPatientId] = useState("")
  const [healthCenterId, setHealthCenterId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const { data: healthCenters = [] } = useHealthCenters()
  const { data: patientPage } = usePatients({
    filters: { segment: "CARE" },
  })
  const patients = patientPage?.data ?? []
  const createAlert = useCreateAlert()

  const patientOptions: SearchableOption[] = patients.map((p) => ({
    value: p.id,
    label: p.fullName,
    sublabel: `${p.dni ? `DNI: ${p.dni}` : "Sin DNI"} | Tel: ${p.primaryPhone}`,
  }))

  const healthCenterOptions: SearchableOption[] = healthCenters.map((hc) => ({
    value: hc.id,
    label: hc.name,
    sublabel: hc.department,
  }))

  function resetForm() {
    setPatientId("")
    setTitle("")
    setDescription("")
    setHealthCenterId("")
    setErrorMsg("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!healthCenterId) {
      setErrorMsg("Selecciona un centro de salud.")
      return
    }
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Completa todos los campos obligatorios.")
      return
    }

    try {
      setErrorMsg("")
      await createAlert.mutateAsync({
        healthCenterId,
        subjectPatientId: patientId || undefined,
        title: title.trim(),
        description: description.trim(),
      })

      resetForm()
      onOpenChange(false)
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Error al crear la alerta.",
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-base font-semibold text-red-600">
            <TriangleAlert className="size-5" />
            <DialogTitle className="text-lg">
              Nueva Alerta de Incidente
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Registra un incidente o eventualidad en un hospital indicando el
            paciente afectado para su seguimiento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
              <User className="text-muted-foreground size-3.5" />
              Paciente Afectado / Reportante (Opcional)
            </label>
            <SearchableSelect
              options={patientOptions}
              value={patientId}
              onChange={setPatientId}
              placeholder="Buscar paciente por nombre o DNI..."
              searchPlaceholder="Escribe el nombre o DNI..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
              <Building2 className="text-muted-foreground size-3.5" />
              Establecimiento de Salud *
            </label>
            <SearchableSelect
              options={healthCenterOptions}
              value={healthCenterId}
              onChange={setHealthCenterId}
              placeholder="Buscar centro de salud u hospital..."
              searchPlaceholder="Escribe el hospital..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-foreground text-xs font-semibold">
              Título de la Alerta *
            </label>
            <input
              type="text"
              placeholder="Ej: Ecógrafo fuera de servicio / Falta de camas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background focus:ring-ring w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-foreground text-xs font-semibold">
              Descripción del Incidente *
            </label>
            <textarea
              rows={3}
              placeholder="Detalla los hechos, paciente afectado o impacto en la atención..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background focus:ring-ring w-full resize-none rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
              required
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={createAlert.isPending}
            >
              {createAlert.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 size-3.5" />
                  Registrar Alerta
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
