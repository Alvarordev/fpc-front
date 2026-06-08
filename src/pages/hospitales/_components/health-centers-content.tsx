import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import {
  useHealthCenters,
  useDeleteHealthCenter,
  useReactivateHealthCenter,
} from "../_hooks/use-health-centers";
import { usePatientCountByHealthCenter } from "../_hooks/use-patient-count-by-health-center";
import { healthCenterColumns } from "./health-centers-columns";
import { HealthCentersToolbar } from "./health-centers-toolbar";
import { CreateHealthCenterDialog } from "./create-health-center-dialog";
import { EditHealthCenterDialog } from "./edit-health-center-dialog";
import { DEPARTMENTS } from "../_utils/departments";
import type { HealthCenter } from "@/types";

export function HealthCentersContent() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Edit dialog state
  const [editingCenter, setEditingCenter] = useState<HealthCenter | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: centers = [], isLoading } = useHealthCenters();
  const { data: patientCounts = new Map() } = usePatientCountByHealthCenter();

  const deleteMutation = useDeleteHealthCenter();
  const reactivateMutation = useReactivateHealthCenter();

  const filtered = useMemo(() => {
    let result = centers;

    if (department !== "all") {
      const depValue = DEPARTMENTS.find((d) => d.label === department)?.value;
      if (depValue) {
        result = result.filter((c) => c.department === depValue);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }

    return result;
  }, [centers, search, department]);

  const handleEdit = useCallback((center: HealthCenter) => {
    setEditingCenter(center);
    setEditDialogOpen(true);
  }, []);

  const handleToggleActive = useCallback(
    async (center: HealthCenter) => {
      try {
        if (center.isActive) {
          await deleteMutation.mutateAsync(center.id);
          toast.success(`"${center.name}" desactivado`);
        } else {
          await reactivateMutation.mutateAsync(center.id);
          toast.success(`"${center.name}" reactivado`);
        }
      } catch (err) {
        toast.error(
          center.isActive ? "Error al desactivar" : "Error al reactivar",
          {
            description:
              err instanceof Error ? err.message : "Error inesperado",
          },
        );
      }
    },
    [deleteMutation, reactivateMutation],
  );

  const columns = useMemo(
    () =>
      healthCenterColumns({
        patientCounts,
        onEdit: handleEdit,
        onToggleActive: handleToggleActive,
      }),
    [patientCounts, handleEdit, handleToggleActive],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Centros de salud
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {centers.length} establecimientos registrados
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="size-4" />
          Nuevo centro
        </Button>
      </div>

      <HealthCentersToolbar
        search={search}
        onSearchChange={setSearch}
        department={department}
        onDepartmentChange={setDepartment}
      />

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No hay centros de salud registrados"
      />

      <CreateHealthCenterDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditHealthCenterDialog
        center={editingCenter}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}
