import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BrainCircuit,
  Phone,
  MapPin,
  Shield,
  HeartPulse,
  Pill,
  Stethoscope,
  Users,
  FileX,
} from "lucide-react";
import type { Patient } from "@/types";

interface OverviewSectionProps {
  patient: Patient;
}

const statusLabels: Record<string, string> = {
  PROSPECT: "Prospecto",
  ENROLLED: "Enrolado",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

const cancerStageLabels: Record<string, string> = {
  STAGE_1: "Etapa 1",
  STAGE_2: "Etapa 2",
  STAGE_3: "Etapa 3",
  STAGE_4: "Etapa 4",
  UNKNOWN: "Desconocida",
};

const insuranceLabels: Record<string, string> = {
  SIS: "SIS",
  ESSALUD: "EsSalud",
  EPS: "EPS",
  FUERZAS_ARMADAS: "Fuerzas Armadas",
  SALUDPOL: "SaludPol",
  NONE: "Ninguno",
};

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
      <FileX className="size-4" />
      {message}
    </div>
  );
}

export function OverviewSection({ patient }: OverviewSectionProps) {
  return (
    <div className="space-y-4">
      {/* AI Summary Placeholder */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BrainCircuit className="size-4 text-primary" />
            Resumen del caso (IA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El resumen generado por inteligencia artificial aparecerá aquí una
            vez que el sistema procese la información completa del paciente.
          </p>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Información general</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Nombre completo</p>
              <p className="font-medium">{patient.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">DNI</p>
              <p className="font-medium">{patient.dni ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Fecha de nacimiento
              </p>
              <p className="font-medium">{patient.birthDate ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <Badge variant="secondary" className="capitalize">
                {statusLabels[patient.status] ?? patient.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="size-3" />
                Teléfono principal
              </p>
              <p className="font-medium">{patient.primaryPhone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Teléfono secundario
              </p>
              <p className="font-medium">{patient.secondaryPhone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">WhatsApp</p>
              <Badge
                variant={patient.hasWhatsapp ? "default" : "outline"}
                className="text-xs"
              >
                {patient.hasWhatsapp ? "Sí" : "No"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rol</p>
              <p className="font-medium capitalize">
                {patient.role.toLowerCase()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnoses & Treatments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Stethoscope className="size-4" />
            Diagnósticos y tratamientos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diagnoses */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Diagnósticos
            </p>
            {patient.diagnoses.length > 0 ? (
              <div className="space-y-2">
                {patient.diagnoses.map((dx) => (
                  <div
                    key={dx.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <div className="mt-0.5">
                      <div className="size-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{dx.diagnosis}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {dx.cancerStage && (
                          <Badge variant="outline" className="text-[10px]">
                            {cancerStageLabels[dx.cancerStage] ??
                              dx.cancerStage}
                          </Badge>
                        )}
                        {dx.diagnosisDate && <span>{dx.diagnosisDate}</span>}
                        {dx.healthCenterName && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="size-3" />
                            {dx.healthCenterName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay diagnósticos registrados" />
            )}
          </div>

          <Separator />

          {/* Treatments */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Tratamientos
            </p>
            {patient.treatments.length > 0 ? (
              <div className="space-y-2">
                {patient.treatments.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <Pill className="size-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {tx.treatmentType}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {tx.treatmentFrequency && (
                          <span>{tx.treatmentFrequency}</span>
                        )}
                        {tx.startDate && (
                          <span>
                            Desde {tx.startDate}
                            {tx.endDate ? ` hasta ${tx.endDate}` : ""}
                          </span>
                        )}
                        <Badge
                          variant={tx.isCurrent ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {tx.isCurrent ? "Actual" : "Finalizado"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay tratamientos registrados" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Datos adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Insurance */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Shield className="size-3" />
              Seguro
            </p>
            {patient.insurance.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.insurance.map((ins) => (
                  <Badge
                    key={ins.id}
                    variant={ins.isCurrent ? "default" : "outline"}
                    className="text-xs"
                  >
                    {insuranceLabels[ins.insuranceType] ?? ins.insuranceType}
                    {ins.epsProvider && ` — ${ins.epsProvider}`}
                  </Badge>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay información de seguro" />
            )}
          </div>

          <Separator />

          {/* SIS Affiliations */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Afiliaciones SIS
            </p>
            {patient.sisAffiliations.length > 0 ? (
              <div className="space-y-1">
                {patient.sisAffiliations.map((sis) => (
                  <p key={sis.id} className="text-sm">
                    {sis.canAffiliate
                      ? `Afiliación prevista: ${sis.expectedDate ?? "Pendiente"}`
                      : `No puede afiliarse: ${sis.cantAffiliateReason ?? "Sin motivo"}`}
                  </p>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay afiliaciones SIS registradas" />
            )}
          </div>

          <Separator />

          {/* Companions */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Users className="size-3" />
              Acompañantes
            </p>
            {patient.companions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.companions.map((comp) => (
                  <Badge
                    key={comp.companionId}
                    variant="outline"
                    className="text-xs"
                  >
                    {comp.companionFullName}
                    {comp.isPrimaryInformant && " (Informante principal)"}
                  </Badge>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay acompañantes registrados" />
            )}
          </div>

          <Separator />

          {/* Medical Appointments */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <HeartPulse className="size-3" />
              Citas médicas
            </p>
            {patient.medicalAppointments.length > 0 ? (
              <div className="space-y-1">
                {patient.medicalAppointments.map((appt) => (
                  <p key={appt.id} className="text-sm">
                    {appt.specialty ?? "Cita médica"}
                    {appt.appointmentDate && ` — ${appt.appointmentDate}`}
                    {appt.healthCenterName &&
                      ` @ ${appt.healthCenterName}`}
                  </p>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay citas médicas registradas" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
