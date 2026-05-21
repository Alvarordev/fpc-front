import { useNavigate, useParams, Link } from "react-router-dom";
import { Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { usePatient } from "../_hooks/use-patient";
import { OverviewSection } from "./overview-section";
import { SeguimientoTab } from "./seguimiento-tab";
import { PsicoTab } from "./psico-tab";
import type { PatientStatus } from "@/types";

const statusLabels: Record<PatientStatus, string> = {
  PROSPECT: "Prospecto",
  ENROLLED: "Enrolado",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

const statusStyles: Record<PatientStatus, string> = {
  PROSPECT: "bg-violet-50 text-violet-700 border-violet-200",
  ENROLLED: "bg-blue-50 text-blue-700 border-blue-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export function PatientDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading, isError } = usePatient(id!);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Cargando...</p>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="space-y-4">
        <Link
          to="/pacientes"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="size-3.5 rotate-180" />
          Volver a pacientes
        </Link>
        <p className="text-muted-foreground text-sm">
          Paciente no encontrado.
        </p>
      </div>
    );
  }

  const initials = patient.fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          to="/pacientes"
          className="hover:text-foreground transition-colors"
        >
          Pacientes
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium truncate max-w-[260px]">
          {patient.fullName}
        </span>
      </nav>

      <div className="flex items-start gap-4">
        <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-xl font-semibold tracking-tight">
              {patient.fullName}
            </h1>
            <Badge
              className={cn(
                "border text-xs font-medium",
                statusStyles[patient.status],
              )}
            >
              {statusLabels[patient.status]}
            </Badge>
          </div>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-4 text-sm">
            <span>{patient.dni ? `DNI ${patient.dni}` : "Sin DNI"}</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {new Date(patient.createdAt).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList className="mb-4">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="psicooncologia">Psicooncología</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <OverviewSection patient={patient} />
        </TabsContent>

        <TabsContent value="seguimiento">
          <SeguimientoTab pacienteId={patient.id} />
        </TabsContent>

        <TabsContent value="psicooncologia">
          <PsicoTab pacienteId={patient.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
