import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEnrollmentStore } from "@/pages/enrolamiento/_store/enrollment-store";
import { usePatient } from "../_hooks/use-patient";
import { usePatientAlerts } from "../_hooks/use-patient-alerts";
import { buildEnrollmentPrefill } from "../_utils/build-enrollment-prefill";
import { AlertBanner } from "./alert-banner";
import { OverviewSection } from "./overview-section";
import { EnrollmentRatingCard } from "./enrollment-rating-card";
import { SeguimientoTab } from "./seguimiento-tab";
import { PsicoTab } from "./psico-tab";
import { RecordatoriosTab } from "./recordatorios-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { roleLabels } from "../_lib/clinical-labels";
const statusLabels: Record<"UNENROLLED" | "ENROLLED", string> = {
  UNENROLLED: "Sin enrolar",
  ENROLLED: "Enrolado",
};

const statusStyles: Record<"UNENROLLED" | "ENROLLED", string> = {
  UNENROLLED: "bg-violet-50 text-violet-700 border-violet-200",
  ENROLLED: "bg-blue-50 text-blue-700 border-blue-200",
};

export function PatientDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading, isError } = usePatient(id!);
  const { alerts } = usePatientAlerts(patient);
  const { resetEnrollment, updateDraft } = useEnrollmentStore();

  function handleEnroll() {
    if (!patient) return;
    resetEnrollment();
    updateDraft(buildEnrollmentPrefill(patient));
    navigate("/enrolamiento");
  }

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
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => navigate("/pacientes")}
        >
          <ArrowLeft className="size-3.5" />
          Volver a pacientes
        </Button>
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
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => navigate("/pacientes")}
        >
          <ArrowLeft className="size-3.5" />
          Pacientes
        </Button>
      </div>

      <div className="flex items-start gap-4">
        <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-xl font-semibold tracking-tight">
              {patient.fullName}
            </h1>
            {patient.role === "COMPANION" ? (
              <Badge className="border bg-amber-50 text-amber-700 text-xs font-medium">
                {roleLabels[patient.role]}
              </Badge>
            ) : (
              <Badge
                className={cn(
                  "border text-xs font-medium",
                  statusStyles[patient.status],
                )}
              >
                {statusLabels[patient.status]}
              </Badge>
            )}
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

        {patient.status === "UNENROLLED" && (
          <Button size="sm" className="shrink-0 gap-1.5" onClick={handleEnroll}>
            <UserPlus className="size-4" />
            Enrolar
          </Button>
        )}
      </div>

      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      <Tabs defaultValue="resumen">
        <TabsList className="mb-4">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="psicooncologia">Psicooncología</TabsTrigger>
          <TabsTrigger value="recordatorios">Recordatorios</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen">
          <div className="space-y-4">
            <OverviewSection patient={patient} />
            <EnrollmentRatingCard
              patientId={patient.id}
              enabled={patient.role !== "COMPANION" && patient.status === "ENROLLED"}
            />
          </div>
        </TabsContent>
        <TabsContent value="seguimiento">
          <SeguimientoTab pacienteId={patient.id} />
        </TabsContent>
        <TabsContent value="psicooncologia">
          <PsicoTab pacienteId={patient.id} />
        </TabsContent>
        <TabsContent value="recordatorios">
          <RecordatoriosTab pacienteId={patient.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
