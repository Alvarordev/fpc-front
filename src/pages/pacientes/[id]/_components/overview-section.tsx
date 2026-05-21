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
  Calendar,
  GraduationCap,
  Languages,
  User,
  AlertTriangle,
  Clock,
  FileText,
  Building2,
  ArrowRight,
} from "lucide-react";
import type { Patient } from "@/types";

// ============================================================
// Labels & helpers
// ============================================================

const statusLabels: Record<string, string> = {
  PROSPECT: "Prospecto",
  ENROLLED: "Enrolado",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

const roleLabels: Record<string, string> = {
  PATIENT: "Paciente",
  COMPANION: "Acompañante",
  UNKNOWN: "Sin definir",
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

const educationLabels: Record<string, string> = {
  NONE: "Sin estudios",
  INITIAL: "Inicial",
  PRIMARY_INCOMPLETE: "Primaria incompleta",
  PRIMARY: "Primaria",
  SECONDARY_INCOMPLETE: "Secundaria incompleta",
  SECONDARY: "Secundaria",
  TECHNICAL_INCOMPLETE: "Técnica incompleta",
  TECHNICAL: "Técnica",
  HIGHER_INCOMPLETE: "Superior incompleta",
  HIGHER: "Superior",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + (iso.includes("T") ? "" : "T00:00:00")).toLocaleDateString(
    "es-PE",
    { day: "numeric", month: "short", year: "numeric" },
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
      <FileX className="size-4" />
      {message}
    </div>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <div className="font-medium text-sm mt-0.5">{value}</div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

interface OverviewSectionProps {
  patient: Patient;
}

export function OverviewSection({ patient }: OverviewSectionProps) {
  const d = patient.details;

  return (
    <div className="space-y-4">
      {/* ================================================ */}
      {/* AI Summary Placeholder                           */}
      {/* ================================================ */}
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

      {/* ================================================ */}
      {/* Información general                              */}
      {/* ================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="size-4" />
            Información general
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fila 1: datos básicos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field label="Nombre completo" value={patient.fullName} />
            <Field label="DNI" value={patient.dni ?? "—"} />
            <Field label="Fecha de nacimiento" value={fmtDate(patient.birthDate)} />
            <Field
              label="Estado"
              value={
                <Badge variant="secondary" className="text-xs">
                  {statusLabels[patient.status] ?? patient.status}
                </Badge>
              }
            />
            <Field label="Rol" value={roleLabels[patient.role] ?? patient.role} icon={User} />
            <Field label="Teléfono principal" value={patient.primaryPhone} icon={Phone} />
            <Field label="Teléfono secundario" value={patient.secondaryPhone ?? "—"} icon={Phone} />
            <Field
              label="WhatsApp"
              value={
                <Badge variant={patient.hasWhatsapp ? "default" : "outline"} className="text-xs">
                  {patient.hasWhatsapp ? "Sí" : "No"}
                </Badge>
              }
            />
          </div>

          {/* Datos demográficos (solo si hay details) */}
          {d && (
            <>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground">Datos demográficos</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <Field label="Dirección actual" value={d.currentAddress ?? "—"} icon={MapPin} />
                <Field label="Distrito" value={d.currentDistrict ?? "—"} />
                <Field label="Departamento" value={d.currentDepartment ?? "—"} />
                <Field label="Departamento de nacimiento" value={d.birthDepartment ?? "—"} />
                <Field
                  label="Coincide dirección DNI"
                  value={d.dniMatchesAddress === null ? "—" : d.dniMatchesAddress ? "Sí" : "No"}
                />
                <Field label="Tiempo al hospital" value={d.travelTimeToHospital ?? "—"} icon={Clock} />
                <Field
                  label="Nivel educativo"
                  value={d.educationLevel ? (educationLabels[d.educationLevel] ?? d.educationLevel) : "—"}
                  icon={GraduationCap}
                />
                <Field label="Lengua nativa" value={d.nativeLanguage ?? "—"} icon={Languages} />
                <Field
                  label="Requiere traducción"
                  value={d.requiresTranslation ? "Sí" : "No"}
                  icon={Languages}
                />
              </div>

              {/* Contacto de emergencia */}
              {(d.emergencyContactName || d.emergencyContactPhone) && (
                <>
                  <Separator />
                  <p className="text-xs font-medium text-muted-foreground">Contacto de emergencia</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <Field label="Nombre" value={d.emergencyContactName ?? "—"} />
                    <Field label="Teléfono" value={d.emergencyContactPhone ?? "—"} icon={Phone} />
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ================================================ */}
      {/* Evolución: Diagnósticos y Tratamientos           */}
      {/* ================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Stethoscope className="size-4" />
            Evolución: diagnósticos y tratamientos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Diagnoses */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1">
              <FileText className="size-3" />
              Diagnósticos ({patient.diagnoses.length})
            </p>
            {patient.diagnoses.length > 0 ? (
              <div className="space-y-3">
                {patient.diagnoses.map((dx) => (
                  <div
                    key={dx.id}
                    className="rounded-lg border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <div className="size-2.5 rounded-full bg-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{dx.diagnosis}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {dx.cancerStage && (
                              <Badge variant="outline" className="text-[10px]">
                                {cancerStageLabels[dx.cancerStage] ?? dx.cancerStage}
                              </Badge>
                            )}
                            <Badge
                              variant={dx.isCurrent ? "default" : "outline"}
                              className="text-[10px]"
                            >
                              {dx.isCurrent ? "Actual" : "Histórico"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <Field label="Fecha de diagnóstico" value={fmtDate(dx.diagnosisDate)} icon={Calendar} />
                      <Field label="Especialidad" value={dx.diagnosisSpecialty ?? "—"} />
                      <Field label="Centro de salud" value={dx.healthCenterName ?? "—"} icon={Building2} />
                      <Field label="Tiene informe médico" value={dx.hasMedicalReport ? "Sí" : "No"} />
                      {dx.symptomLeadingToCheckup && (
                        <Field label="Síntoma que llevó al chequeo" value={dx.symptomLeadingToCheckup} icon={AlertTriangle} />
                      )}
                      {dx.waitTimeForDiagnosis && (
                        <Field label="Tiempo de espera" value={dx.waitTimeForDiagnosis} icon={Clock} />
                      )}
                      {dx.changeReason && (
                        <Field label="Motivo de cambio" value={dx.changeReason} />
                      )}
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
            <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1">
              <Pill className="size-3" />
              Tratamientos ({patient.treatments.length})
            </p>
            {patient.treatments.length > 0 ? (
              <div className="space-y-3">
                {patient.treatments.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-lg border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <Pill className="size-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{tx.treatmentType}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge
                            variant={tx.isCurrent ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {tx.isCurrent ? "En curso" : "Finalizado"}
                          </Badge>
                          {tx.diagnosis?.diagnosis && (
                            <span className="text-xs text-muted-foreground">
                              ← {tx.diagnosis.diagnosis}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <Field label="Frecuencia" value={tx.treatmentFrequency ?? "—"} />
                      <Field
                        label="Período"
                        value={
                          tx.startDate
                            ? `Desde ${fmtDate(tx.startDate)}${tx.endDate ? ` hasta ${fmtDate(tx.endDate)}` : " (en curso)"}`
                            : "—"
                        }
                        icon={Calendar}
                      />
                      <Field label="Centro de salud" value={tx.healthCenterName ?? "—"} icon={Building2} />
                      {tx.notReceivingReason && (
                        <Field label="Motivo de no recibir" value={tx.notReceivingReason} icon={AlertTriangle} />
                      )}
                      {tx.changeReason && (
                        <Field label="Motivo de cambio" value={tx.changeReason} />
                      )}
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

      {/* ================================================ */}
      {/* Datos complementarios                            */}
      {/* ================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Datos complementarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Insurance */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Shield className="size-3" />
              Seguro
            </p>
            {patient.insurance.length > 0 ? (
              <div className="space-y-2">
                {patient.insurance.map((ins) => (
                  <div
                    key={ins.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm"
                  >
                    <Badge variant={ins.isCurrent ? "default" : "outline"} className="text-xs">
                      {insuranceLabels[ins.insuranceType] ?? ins.insuranceType}
                      {ins.epsProvider && ` — ${ins.epsProvider}`}
                    </Badge>
                    {ins.isCurrent && (
                      <Badge variant="secondary" className="text-[10px]">Actual</Badge>
                    )}
                    {ins.startDate && (
                      <span className="text-xs text-muted-foreground">
                        Desde {fmtDate(ins.startDate)}
                        {ins.endDate ? ` hasta ${fmtDate(ins.endDate)}` : ""}
                      </span>
                    )}
                    {ins.changeReason && (
                      <span className="text-xs text-muted-foreground">
                        · {ins.changeReason}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay información de seguro" />
            )}
          </div>

          <Separator />

          {/* SIS */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Afiliaciones SIS
            </p>
            {patient.sisAffiliations.length > 0 ? (
              <div className="space-y-2">
                {patient.sisAffiliations.map((sis) => (
                  <div key={sis.id} className="rounded-md border p-3 text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={sis.canAffiliate ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {sis.canAffiliate ? "Puede afiliarse" : "No puede afiliarse"}
                      </Badge>
                      {sis.affiliatedAt && (
                        <Badge variant="default" className="text-[10px] bg-emerald-500">
                          Afiliado
                        </Badge>
                      )}
                    </div>
                    {sis.canAffiliate && sis.expectedDate && (
                      <p className="text-xs text-muted-foreground">
                        Fecha prevista: {fmtDate(sis.expectedDate)}
                      </p>
                    )}
                    {!sis.canAffiliate && sis.cantAffiliateReason && (
                      <p className="text-xs text-muted-foreground">
                        Motivo: {sis.cantAffiliateReason}
                      </p>
                    )}
                    {sis.affiliatedAt && (
                      <p className="text-xs text-muted-foreground">
                        Afiliado el {fmtDate(sis.affiliatedAt.slice(0, 10))}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay afiliaciones SIS registradas" />
            )}
          </div>

          <Separator />

          {/* Medical Appointments */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <HeartPulse className="size-3" />
              Citas médicas ({patient.medicalAppointments.length})
            </p>
            {patient.medicalAppointments.length > 0 ? (
              <div className="space-y-2">
                {patient.medicalAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <Calendar className="size-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium">
                        {appt.specialty ?? "Cita médica"}
                        {appt.hasReferralSheet && (
                          <Badge variant="outline" className="text-[10px] ml-2">
                            Con referencia
                          </Badge>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground mt-1">
                        {appt.appointmentDate && <span>{fmtDate(appt.appointmentDate)}</span>}
                        {appt.nextAppointmentDate && (
                          <span className="flex items-center gap-0.5">
                            <ArrowRight className="size-3" />
                            Próxima: {fmtDate(appt.nextAppointmentDate)}
                          </span>
                        )}
                        {appt.healthCenterName && (
                          <span className="flex items-center gap-0.5">
                            <Building2 className="size-3" />
                            {appt.healthCenterName}
                          </span>
                        )}
                      </div>
                      {appt.referredTo && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Referido a: {appt.referredTo}
                        </p>
                      )}
                      {appt.difficulties && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Dificultades: {appt.difficulties}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay citas médicas registradas" />
            )}
          </div>

          <Separator />

          {/* Companions */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Users className="size-3" />
              Acompañantes ({patient.companions.length})
            </p>
            {patient.companions.length > 0 ? (
              <div className="space-y-2">
                {patient.companions.map((comp) => (
                  <div
                    key={comp.companionId}
                    className="flex items-center gap-3 rounded-md border p-3 text-sm"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                      {comp.companionFullName
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-medium">{comp.companionFullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {comp.isPrimaryInformant ? "Informante principal" : "Acompañante"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay acompañantes registrados" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
