import { useState } from "react";
import { Plus, TriangleAlert, Loader2, Building2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { useHealthCenters } from "@/pages/hospitales/_hooks/use-health-centers";
import { usePatients } from "@/pages/pacientes/_hooks/use-patients";
import { useCreateAlert } from "../_hooks/use-alerts";

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAlertDialog({ open, onOpenChange }: CreateAlertDialogProps) {
  const [patientId, setPatientId] = useState("");
  const [healthCenterId, setHealthCenterId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: healthCenters = [] } = useHealthCenters();
  const { data: patientPage } = usePatients();
  const patients = patientPage?.data ?? [];
  const createAlert = useCreateAlert();

  const patientOptions: SearchableOption[] = patients.map((p) => ({
    value: p.id,
    label: p.fullName,
    sublabel: `${p.dni ? `DNI: ${p.dni}` : "Sin DNI"} | Tel: ${p.primaryPhone}`,
  }));

  const healthCenterOptions: SearchableOption[] = healthCenters.map((hc) => ({
    value: hc.id,
    label: hc.name,
    sublabel: hc.department,
  }));

  function resetForm() {
    setPatientId("");
    setTitle("");
    setDescription("");
    setHealthCenterId("");
    setErrorMsg("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!healthCenterId) {
      setErrorMsg("Selecciona un centro de salud.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Completa todos los campos obligatorios.");
      return;
    }

    try {
      setErrorMsg("");
      await createAlert.mutateAsync({
        healthCenterId,
        subjectPatientId: patientId || undefined,
        title: title.trim(),
        description: description.trim(),
      });

      resetForm();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al crear la alerta.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 font-semibold text-base">
            <TriangleAlert className="size-5" />
            <DialogTitle className="text-lg">Nueva Alerta de Incidente</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Registra un incidente o eventualidad en un hospital indicando el paciente afectado para su seguimiento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-2.5 text-xs rounded-md bg-red-50 text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <User className="size-3.5 text-muted-foreground" />
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
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Building2 className="size-3.5 text-muted-foreground" />
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
            <label className="text-xs font-semibold text-foreground">
              Título de la Alerta *
            </label>
            <input
              type="text"
              placeholder="Ej: Ecógrafo fuera de servicio / Falta de camas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Descripción del Incidente *
            </label>
            <textarea
              rows={3}
              placeholder="Detalla los hechos, paciente afectado o impacto en la atención..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={createAlert.isPending}
            >
              {createAlert.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="size-3.5 mr-1.5" />
                  Registrar Alerta
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
