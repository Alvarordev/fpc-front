import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatients } from "../_hooks/use-patients";
import { PatientsToolbar } from "./patients-toolbar";
import { PatientsTable } from "./patients-table";
import { patientColumns } from "./patients-columns";
import { useQueryClient } from "@tanstack/react-query";
import { patientsApi } from "@/api/patients";
import { toast } from "sonner";
import {
  AddProspectDialog,
  type AddProspectFormValues,
} from "./add-prospect-dialog";

export function AdminPatientsContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"UNENROLLED" | "ENROLLED" | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [prospectOpen, setProspectOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: patientPage, isLoading } = usePatients();
  const patients = patientPage?.data ?? [];

  const filtered = patients.filter((p) => {
    const matchesSearch =
      !search ||
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (p.dni && p.dni.includes(search));

    const matchesStatus = !statusFilter || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  async function handleProspectSubmit(values: AddProspectFormValues) {
    const shouldScheduleContact = Boolean(values.scheduledDate && values.scheduledTime);

    setIsCreating(true);
    try {
      // The Nest API creates patients as UNENROLLED until the enrollment phase.
      await patientsApi.create({
        fullName: values.fullName,
        dni: values.dni || undefined,
        primaryPhone: values.phone,
        email: values.email || undefined,
        hasWhatsapp: true,
      });

      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Prospecto creado correctamente");

      if (shouldScheduleContact) {
        toast.info("El agendamiento se habilitará al migrar seguimientos al nuevo backend");
      }
    } catch {
      toast.error("Error al crear el prospecto");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Pacientes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {patients.length} pacientes registrados
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setProspectOpen(true)}
          >
            <ClipboardPlus className="size-4" />
            Agregar prospecto
          </Button>
        </div>
      </div>

      <PatientsToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <PatientsTable
        data={filtered}
        columns={patientColumns}
        isLoading={isLoading}
        onRowClick={(p) => navigate(`/pacientes/${p.id}`)}
      />

      <AddProspectDialog
        open={prospectOpen}
        onOpenChange={setProspectOpen}
        onSubmit={handleProspectSubmit}
        isPending={isCreating}
      />
    </div>
  );
}
