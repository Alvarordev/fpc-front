import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { usePatients } from "../_hooks/use-patients";
import { PatientsToolbar } from "./patients-toolbar";
import { PatientsTable } from "./patients-table";
import { patientColumns } from "./patients-columns";
import type { PatientStatus } from "@/types";

export function PatientsContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus | null>(null);
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);

  const { data: patients = [], isLoading } = usePatients({
    enabled: role !== "VOLUNTEER",
  });

  const filtered = patients.filter((p) => {
    const matchesSearch =
      !search ||
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (p.dni && p.dni.includes(search));

    const matchesStatus = !statusFilter || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => navigate("/enrolamiento")}
        >
          <UserPlus className="size-4" />
          Nuevo paciente
        </Button>
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
    </div>
  );
}
