import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { isCareLevel } from "@/lib/health-center-labels";
import {
  useHealthCenters,
  useDeleteHealthCenter,
  useReactivateHealthCenter,
} from "../_hooks/use-health-centers";
import { healthCenterColumns } from "./health-centers-columns";
import { HealthCentersToolbar } from "./health-centers-toolbar";
import { CreateHealthCenterDialog } from "./create-health-center-dialog";
import { EditHealthCenterDialog } from "./edit-health-center-dialog";
import type { HealthCenter, HealthCenterListFilters } from "@/api/health-centers";

export function HealthCentersContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [careLevel, setCareLevel] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<HealthCenter | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filters = useMemo<HealthCenterListFilters>(() => {
    const query: HealthCenterListFilters = {};
    if (debouncedSearch.length >= 2) query.search = debouncedSearch;
    if (department !== "all") {
      query.department = department as HealthCenterListFilters["department"];
    }
    if (isCareLevel(careLevel)) query.careLevel = careLevel;
    return query;
  }, [debouncedSearch, department, careLevel]);

  const canQuery = Boolean(filters.search || filters.department || filters.careLevel);
  const { data: centers = [], isLoading, isFetching } = useHealthCenters(filters, {
    enabled: canQuery,
  });

  const deleteMutation = useDeleteHealthCenter();
  const reactivateMutation = useReactivateHealthCenter();

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
        onEdit: handleEdit,
        onToggleActive: handleToggleActive,
      }),
    [handleEdit, handleToggleActive],
  );

  const emptyMessage = canQuery
    ? "No hay establecimientos con esos filtros"
    : "Busca por nombre (mínimo 2 letras) o filtra por departamento o nivel";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Centros de salud
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {canQuery
              ? `${centers.length} establecimientos`
              : "Busca entre los establecimientos registrados"}
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
        careLevel={careLevel}
        onCareLevelChange={setCareLevel}
      />

      <DataTable
        data={canQuery ? centers : []}
        columns={columns}
        isLoading={canQuery && (isLoading || isFetching)}
        emptyMessage={emptyMessage}
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
