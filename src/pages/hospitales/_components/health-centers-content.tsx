import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useHealthCenters } from "../_hooks/use-health-centers";
import { healthCenterColumns } from "./health-centers-columns";
import { HealthCentersToolbar } from "./health-centers-toolbar";
import { CreateHealthCenterDialog } from "./create-health-center-dialog";
import { DEPARTMENTS } from "../_utils/departments";

export function HealthCentersContent() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: centers = [], isLoading } = useHealthCenters();

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
          onClick={() => setDialogOpen(true)}
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
        columns={healthCenterColumns}
        isLoading={isLoading}
        emptyMessage="No hay centros de salud registrados"
      />

      <CreateHealthCenterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
