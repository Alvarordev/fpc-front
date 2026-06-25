import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, ClipboardPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatients } from "../_hooks/use-patients";
import { PatientsToolbar } from "./patients-toolbar";
import { PatientsTable } from "./patients-table";
import { patientColumns } from "./patients-columns";
import type { PatientStatus } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { patientsApi, contactsApi, agentsApi } from "@/lib/api";
import { toast } from "sonner";
import {
  AddProspectDialog,
  type AddProspectFormValues,
} from "./add-prospect-dialog";

export function AdminPatientsContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [prospectOpen, setProspectOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: patients = [], isLoading } = usePatients();

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list(),
    staleTime: 60 * 1000,
  });

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
    let agentId: string | undefined;

    if (shouldScheduleContact) {
      if (user?.role === "AGENT") {
        const agent = agents.find((a) => a.userId === user.id);
        agentId = agent?.id;
      } else if (user?.role === "ADMIN") {
        agentId = agents[0]?.id;
      }

      if (!agentId) {
        toast.error("No se encontró un agente asociado para agendar el contacto");
        return;
      }
    }

    setIsCreating(true);
    try {
      // 1. Create patient (status defaults to PROSPECT)
      const patient = await patientsApi.create({
        fullName: values.fullName,
        dni: values.dni || undefined,
        primaryPhone: values.phone,
        hasWhatsapp: true,
      });

      if (shouldScheduleContact) {
        // 2. Build contact notes with prospect metadata
        const canal =
          values.entryChannel === "Otro"
            ? values.customEntryChannel || "Otro"
            : values.entryChannel || undefined;

        const notesParts: string[] = [];
        if (values.email)
          notesParts.push(`Correo: ${values.email}`);
        if (values.diagnosisNote)
          notesParts.push(`Diagnóstico / Nota: ${values.diagnosisNote}`);
        if (canal)
          notesParts.push(`Canal de ingreso: ${canal}`);
        notesParts.push(
          `Paciente oncológico: ${values.isOncological ? "Sí" : "No"}`,
        );
        if (values.additionalNotes)
          notesParts.push(`Notas adicionales: ${values.additionalNotes}`);

        const contactNotes =
          notesParts.length > 0 ? notesParts.join("\n") : undefined;

        // 3. Create scheduled contact only when date and time were provided.
        await contactsApi.create({
          patientId: patient.id,
          agentId: agentId!,
          type: "CALL",
          status: "SCHEDULED",
          purpose: "FIRST_CONTACT",
          scheduledAt: `${values.scheduledDate}T${values.scheduledTime}:00`,
          notes: contactNotes || undefined,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success(
        shouldScheduleContact
          ? "Prospecto creado y contacto agendado correctamente"
          : "Prospecto creado correctamente",
      );
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
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/enrolamiento")}
          >
            <UserPlus className="size-4" />
            Nuevo paciente
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
