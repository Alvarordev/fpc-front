import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  FileText,
  FileX,
  Flame,
  GraduationCap,
  Heart,
  HeartPulse,
  IdCard,
  Info,
  Languages,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  Pill,
  Pencil,
  RefreshCw,
  Shield,
  Stethoscope,
  User,
  Users,
} from "lucide-react"
import { enrollmentsApi } from "@/api/enrollments"
import { patientsApi, type PatientDetailsResponse } from "@/api/patients"
import { cn } from "@/lib/utils"
import {
  cancerStageLabels,
  educationLabels,
  epsLabels,
  healthPhaseLabels,
  genderLabels,
  insuranceLabels,
  zoneTypeLabels,
  relationshipLabels,
  roleLabels,
} from "../_lib/clinical-labels"
import { usePatientAccompanies } from "../_hooks/use-patient-accompanies"
import { Link } from "react-router-dom"
import { DURATION_UNIT_LABELS } from "@/types/duration"
import { DEPARTMENT_LABELS } from "@/pages/hospitales/_utils/departments"
import { getAge } from "@/pages/enrolamiento/_utils/patient-age"
import { PatientRecordsSection } from "./patient-records-section"
import { TreatmentCard } from "./treatment-card"
import { PatientProfileDialog } from "./patient-profile-dialog"
import { useAuthStore } from "@/store/auth-store"
import { usePatientSocialNotes } from "../_hooks/use-patient-records"

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("La solicitud tardó demasiado")),
      ms,
    )
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function date(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-"
}

function durationLabel(
  value:
    | {
        valueMin: number
        valueMax: number | null
        unit: keyof typeof DURATION_UNIT_LABELS
        label: string | null
      }
    | null
    | undefined,
) {
  if (!value) return null
  if (value.label) return value.label
  const range =
    value.valueMax !== null && value.valueMax !== value.valueMin
      ? `${value.valueMin} a ${value.valueMax}`
      : String(value.valueMin)
  return `${range} ${DURATION_UNIT_LABELS[value.unit].toLowerCase()}`
}
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ContactInformationSection({
  patient,
}: {
  patient: PatientDetailsResponse
}) {
  const primaryCompanion = patient.companions.find(
    (link) => link.isPrimaryContact,
  )
  const primaryContact = primaryCompanion?.companion ?? patient
  const caregiverLink = patient.companions.find((link) => link.isCaregiver)
  const legacyCaregiver = patient.details?.emergencyContactName
    ? {
        name: patient.details.emergencyContactName,
        phone: patient.details.emergencyContactPhone,
        gender: patient.details.emergencyContactGender,
      }
    : null
  const caregiver = caregiverLink?.companion
    ? {
        name: caregiverLink.companion.fullName,
        phone: caregiverLink.companion.primaryPhone,
        gender: caregiverLink.companion.gender,
      }
    : legacyCaregiver

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Phone className="size-4" />
          Información de contacto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
            Contacto para seguimiento
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
            <Field label="Nombre" value={primaryContact.fullName} icon={User} />
            <Field
              label="Parentesco"
              value={
                primaryCompanion
                  ? primaryCompanion.relationship
                    ? (relationshipLabels[primaryCompanion.relationship] ??
                      primaryCompanion.relationship)
                    : null
                  : "Paciente"
              }
            />
            <Field
              label="Celular principal"
              value={primaryContact.primaryPhone}
              icon={Phone}
            />
            <Field
              label="Celular auxiliar"
              value={primaryContact.secondaryPhone}
              icon={Phone}
            />
            <Field
              label="Género"
              value={
                primaryContact.gender
                  ? (genderLabels[primaryContact.gender] ??
                    primaryContact.gender)
                  : null
              }
              icon={User}
            />
          </div>
        </div>
        <Separator />
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
            Cuidador
          </p>
          {caregiver ? (
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
              <Field label="Nombre" value={caregiver.name} icon={User} />
              <Field label="Celular" value={caregiver.phone} icon={Phone} />
              <Field
                label="Género"
                value={
                  caregiver.gender
                    ? (genderLabels[caregiver.gender] ?? caregiver.gender)
                    : null
                }
                icon={User}
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No hay un cuidador registrado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
function Empty({ children }: { children: string }) {
  return <p className="text-muted-foreground py-2 text-sm">{children}</p>
}
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-3 text-sm">
      <FileX className="size-4" />
      {message}
    </div>
  )
}

export function OverviewSection({
  patient,
}: {
  patient: PatientDetailsResponse
}) {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const canEditProfile =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"
  const details = patient.details
  const { data: accompanies } = usePatientAccompanies(
    patient.id,
    patient.role === "COMPANION",
  )
  const currentTreatments = patient.treatments.filter((item) => item.isCurrent)
  const historicalTreatments = patient.treatments.filter(
    (item) => !item.isCurrent,
  )
  const { data: socialNotes = [] } = usePatientSocialNotes(
    patient.id,
    patient.role !== "COMPANION",
  )
  const enrollmentQuery = useQuery({
    queryKey: ["patient-enrollments", patient.id],
    queryFn: () => enrollmentsApi.listByPatient(patient.id),
    enabled: patient.role !== "COMPANION",
    staleTime: 30_000,
  })
  const enrollment = enrollmentQuery.data?.[0]
  const age = getAge(patient.birthDate)
  return (
    <div className="space-y-4">
      {patient.role === "COMPANION" && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-800">
              <Users className="size-4" />
              Pacientes que acompaña
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accompanies?.length ? (
              <div className="space-y-2">
                {accompanies.map((item) => (
                  <Link
                    key={item.patientId}
                    to={`/pacientes/${item.patientId}`}
                    className="bg-card hover:bg-muted/50 block rounded-md border p-3 text-sm"
                  >
                    {item.patient?.fullName ?? "Paciente"}{" "}
                    {item.relationship && (
                      <span className="text-muted-foreground">
                        (
                        {relationshipLabels[item.relationship] ??
                          item.relationship}
                        )
                      </span>
                    )}{" "}
                    {item.isPrimaryInformant && (
                      <Badge className="ml-2">Informante principal</Badge>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <Empty>No acompaña a ningún paciente.</Empty>
            )}
          </CardContent>
        </Card>
      )}
      <AiSummarySection patientId={patient.id} fallback={patient.summary} />
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="size-4" />
              Información general
            </CardTitle>
            {canEditProfile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setProfileDialogOpen(true)}
              >
                <Pencil className="size-3" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <Field label="Nombre completo" value={patient.fullName} />
            <Field label="DNI" value={patient.dni} />
            <Field
              label="Fecha de nacimiento"
              value={date(patient.birthDate)}
            />
            {patient.role !== "COMPANION" ? (
              <Field
                label="Estado de enrolamiento"
                value={
                  <Badge variant="secondary" className="text-xs">
                    {patient.status === "ENROLLED" ? "Enrolado" : "Prospecto"}
                  </Badge>
                }
              />
            ) : (
              <Field label="Rol" value={roleLabels[patient.role]} icon={User} />
            )}
            <Field
              label="Estado del paciente"
              value={
                <Badge variant="secondary" className="text-xs">
                  {patient.activityStatus === "ACTIVE"
                    ? "Activo"
                    : patient.activityStatus === "INACTIVE"
                      ? "Inactivo"
                      : "Reactivo"}
                </Badge>
              }
            />
            {patient.role !== "COMPANION" && (
              <>
                <Field
                  label="Fase de salud"
                  value={
                    details?.healthPhase
                      ? healthPhaseLabels[details.healthPhase]
                      : "Sin clasificar"
                  }
                />
                <Field
                  label="Punto de ingreso"
                  value={enrollment?.entrySource}
                />
              </>
            )}
            <Field label="Edad" value={age === null ? null : `${age} años`} />
            <Field
              label="Sexo"
              value={
                patient.gender
                  ? (genderLabels[patient.gender] ?? patient.gender)
                  : null
              }
              icon={User}
            />
            {patient.role !== "COMPANION" && (
              <Field
                label="Cáncer infantil"
                value={age === null ? null : age < 18 ? "Sí" : "No"}
              />
            )}
            <Field
              label="WhatsApp"
              value={
                <Badge
                  variant={patient.hasWhatsapp ? "default" : "outline"}
                  className="text-xs"
                >
                  {patient.hasWhatsapp ? "Sí" : "No"}
                </Badge>
              }
            />
            <Field label="Email" value={patient.email} />
            {patient.deactivationReason && (
              <Field
                label="Motivo de desactivación"
                value={patient.deactivationReason}
              />
            )}
            {patient.deceasedAt && (
              <Field label="Fallecimiento" value={date(patient.deceasedAt)} />
            )}
          </div>

          {details && (
            <>
              <Separator />
              <p className="text-muted-foreground text-xs font-medium">
                Datos de procedencia y residencia
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <Field
                  label="Departamento de nacimiento"
                  value={
                    details.birthDepartment
                      ? (DEPARTMENT_LABELS[details.birthDepartment] ??
                        details.birthDepartment)
                      : null
                  }
                />
                <Field
                  label="Hospital principal"
                  value={details.primaryHealthCenterName}
                  icon={Building2}
                />
                <Field
                  label="Zonificación de residencia"
                  value={
                    details.zoneType
                      ? (zoneTypeLabels[details.zoneType.toUpperCase()] ??
                        details.zoneType)
                      : null
                  }
                  icon={MapPin}
                />
                <Field
                  label="Tiempo al hospital"
                  value={durationLabel(details.travelTimeToHospital)}
                  icon={Clock}
                />
                <Field
                  label="Nivel educativo"
                  value={
                    details.educationLevel
                      ? educationLabels[details.educationLevel]
                      : null
                  }
                  icon={GraduationCap}
                />
                <Field
                  label="Lengua nativa"
                  value={details.nativeLanguage}
                  icon={Languages}
                />
                <Field
                  label="Requiere traducción"
                  value={details.requiresTranslation ? "Sí" : "No"}
                  icon={Languages}
                />
              </div>

              {details.healthPhaseHistory?.length > 0 && (
                <>
                  <Separator />
                  <p className="text-muted-foreground text-xs font-medium">
                    Historial de fase de salud
                  </p>
                  <div className="space-y-2">
                    {details.healthPhaseHistory.map((item) => (
                      <div
                        key={item.id}
                        className="bg-muted/20 flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
                      >
                        <span>{healthPhaseLabels[item.healthPhase]}</span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(item.changedAt).toLocaleDateString(
                            "es-PE",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <Separator />
              <p className="text-muted-foreground text-xs font-medium">
                Datos de seguimiento social
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <Field
                  label="Violencia doméstica"
                  value={bool(details.evidenceOfDomesticViolence)}
                  icon={AlertTriangle}
                />
                <Field
                  label="Usa cocina a leña"
                  value={bool(details.usesWoodStove)}
                  icon={Flame}
                />
                <Field
                  label="Trabaja actualmente"
                  value={bool(details.isWorking)}
                  icon={Briefcase}
                />
                <Field
                  label="Recibe apoyo económico"
                  value={bool(details.receivesFinancialSupport)}
                  icon={Heart}
                />
                <Field
                  label="Derivado a trabajo social"
                  value={bool(details.referredToSocialWorker)}
                  icon={ArrowRight}
                />
                <Field
                  label="Tiene carnet CONADIS"
                  value={bool(details.hasConadisCard)}
                  icon={IdCard}
                />
                <Field
                  label="Conoce FISSAL"
                  value={bool(details.knowsAboutFissal)}
                  icon={Info}
                />
                {socialNotes.length > 0 && (
                  <div className="bg-muted/20 col-span-full rounded-lg border p-3 md:col-span-2">
                    <p className="text-sm font-medium">
                      Últimas notas sociales
                    </p>
                    <div className="mt-2 space-y-2">
                      {socialNotes.slice(0, 3).map((note) => (
                        <div
                          key={note.id}
                          className="bg-card rounded-md border p-2 text-xs"
                        >
                          <p className="text-muted-foreground mb-1">
                            {note.type === "SOCIAL_WORKER"
                              ? "Trabajo social"
                              : note.type}{" "}
                            · {date(note.createdAt)}
                          </p>
                          <p>{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {details.programDropoutDate && (
                  <Field
                    label="Fecha de abandono"
                    value={date(details.programDropoutDate)}
                    icon={Calendar}
                  />
                )}
                {details.programDropoutReason && (
                  <Field
                    label="Motivo de abandono"
                    value={details.programDropoutReason}
                    icon={LogOut}
                  />
                )}
              </div>
            </>
          )}
          {patient.role !== "COMPANION" && (
            <PatientRecordsSection patientId={patient.id} />
          )}
        </CardContent>
      </Card>
      {patient.role !== "COMPANION" && (
        <ContactInformationSection patient={patient} />
      )}
      {canEditProfile && (
        <PatientProfileDialog
          patient={patient}
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      )}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Stethoscope className="size-4" />
            Evolución: diagnósticos y tratamientos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-muted-foreground mb-3 flex items-center gap-1 text-xs font-medium">
              <FileText className="size-3" />
              Diagnósticos ({patient.diagnoses.length})
            </p>
            {patient.diagnoses.length > 0 ? (
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                {patient.diagnoses.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card max-w-[380px] min-w-[320px] flex-shrink-0 space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-primary mt-1.5 size-2.5 shrink-0 rounded-full" />
                      <div>
                        <p className="text-sm font-semibold">
                          {item.diagnosis}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {item.cancerStage && (
                            <Badge variant="outline" className="text-[10px]">
                              {cancerStageLabels[item.cancerStage]}
                            </Badge>
                          )}
                          <Badge
                            variant={item.isCurrent ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {item.isCurrent ? "Actual" : "Histórico"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <Field
                        label="Fecha de diagnóstico"
                        value={date(item.diagnosisDate)}
                        icon={Calendar}
                      />
                      <Field
                        label="Especialidad"
                        value={item.diagnosisSpecialty}
                      />
                      <Field
                        label="Centro de salud"
                        value={item.healthCenterName ?? null}
                        icon={Building2}
                      />
                      <Field
                        label="Tiene informe médico"
                        value={item.hasMedicalReport ? "Sí" : "No"}
                      />
                      {item.symptomLeadingToCheckup && (
                        <Field
                          label="Síntoma que llevó al chequeo"
                          value={item.symptomLeadingToCheckup}
                          icon={AlertTriangle}
                        />
                      )}
                      {item.waitTimeForDiagnosis && (
                        <Field
                          label="Tiempo de espera"
                          value={durationLabel(item.waitTimeForDiagnosis)}
                          icon={Clock}
                        />
                      )}
                      {item.changeReason && (
                        <Field
                          label="Motivo de cambio"
                          value={item.changeReason}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay diagnósticos registrados." />
            )}
          </div>

          <Separator />

          <div>
            <p className="text-muted-foreground mb-3 flex items-center gap-1 text-xs font-medium">
              <Pill className="size-3" />
              Tratamientos ({patient.treatments.length})
            </p>
            {patient.treatments.length === 0 ? (
              <EmptyState message="No hay tratamientos registrados." />
            ) : (
              <div className="space-y-5">
                <TreatmentGroup
                  title="Tratamientos actuales"
                  treatments={currentTreatments}
                  patientId={patient.id}
                  allowMedicationManagement={patient.role !== "COMPANION"}
                  emptyMessage="No hay tratamientos actuales."
                />
                {historicalTreatments.length > 0 && (
                  <>
                    <Separator />
                    <TreatmentGroup
                      title="Historial de tratamientos"
                      treatments={historicalTreatments}
                      patientId={patient.id}
                      allowMedicationManagement={patient.role !== "COMPANION"}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Section title="Datos complementarios">
        <div className="space-y-5">
          <Records
            title="Seguros"
            count={patient.insurance.length}
            icon={Shield}
          >
            {patient.insurance.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <span>
                  <b>{insuranceLabels[item.insuranceType]}</b>
                  {item.epsProvider && (
                    <span className="text-muted-foreground ml-2">
                      {epsLabels[item.epsProvider]}
                    </span>
                  )}
                </span>
                {item.isCurrent && (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    Vigente
                  </Badge>
                )}
              </div>
            ))}
          </Records>
          <Records
            title="Afiliaciones SIS"
            count={patient.sisAffiliations.length}
          >
            {patient.sisAffiliations.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                {item.canAffiliate
                  ? "Puede afiliarse"
                  : (item.cantAffiliateReason ?? "No puede afiliarse")}
              </div>
            ))}
          </Records>
          <Records
            title="Citas médicas"
            count={patient.medicalAppointments.length}
            icon={Calendar}
          >
            {patient.medicalAppointments.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <b>{item.specialty}</b>
                <p className="text-muted-foreground mt-1">
                  {date(item.appointmentDate)} ·{" "}
                  {item.healthCenterName ?? "Centro no registrado"}
                </p>
              </div>
            ))}
          </Records>
          <Records
            title="Síntomas"
            count={patient.symptomReports.length}
            icon={HeartPulse}
          >
            {patient.symptomReports.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                {item.signsAndSymptoms ??
                  item.discomfortDescription ??
                  "Sin descripción"}
              </div>
            ))}
          </Records>
          <Records
            title="Acompañantes"
            count={patient.companions.length}
            icon={Users}
          >
            {patient.companions.map((item) => (
              <div
                key={item.companionId}
                className="rounded-md border p-3 text-sm"
              >
                {item.companion?.fullName ?? "Acompañante"}{" "}
                {item.relationship && (
                  <span className="text-muted-foreground">
                    (
                    {relationshipLabels[item.relationship] ?? item.relationship}
                    )
                  </span>
                )}{" "}
                {item.isPrimaryInformant && (
                  <Badge className="ml-2">Informante principal</Badge>
                )}
              </div>
            ))}
          </Records>
        </div>
      </Section>
    </div>
  )
}

function TreatmentGroup({
  title,
  treatments,
  patientId,
  allowMedicationManagement,
  emptyMessage = "No hay registros.",
}: {
  title: string
  treatments: PatientDetailsResponse["treatments"]
  patientId: string
  allowMedicationManagement: boolean
  emptyMessage?: string
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <span className="text-muted-foreground text-xs">
          {treatments.length}
        </span>
      </div>
      {treatments.length ? (
        <div className="space-y-3">
          {treatments.map((treatment) => (
            <TreatmentCard
              key={treatment.id}
              patientId={patientId}
              treatment={treatment}
              allowMedicationManagement={allowMedicationManagement}
            />
          ))}
        </div>
      ) : (
        <EmptyState message={emptyMessage} />
      )}
    </section>
  )
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  icon?: typeof Phone
}) {
  return (
    <div>
      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <div className="mt-0.5 font-medium">{value ?? "-"}</div>
    </div>
  )
}
function Records({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
  icon?: typeof Phone
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        {title} ({count})
      </p>
      {count ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <Empty>No hay registros.</Empty>
      )}
    </div>
  )
}
function bool(value: boolean | null) {
  return value === null ? "-" : value ? "Sí" : "No"
}

const summaryStatusLabels: Record<
  "PENDING" | "PROCESSING" | "READY" | "FAILED",
  string
> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  READY: "Listo",
  FAILED: "Error",
}

function AiSummarySection({
  patientId,
  fallback,
}: {
  patientId: string
  fallback: string | null
}) {
  const queryClient = useQueryClient()
  const queryKey = ["patient-summary", patientId]
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    // On-demand generation can take a while (or queue behind the shared
    // rate limit) — give up on the UI side after 10s so the user gets a
    // retry button instead of an indefinite spinner. The backend call keeps
    // running either way; a later visit/retry will pick up its result.
    queryFn: () => withTimeout(patientsApi.getSummary(patientId), 10_000),
    // The backend now serves a READY summary from cache and only calls the
    // AI provider when there isn't one yet — safe to keep this around and
    // avoid refetching just from remounts/focus.
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const refreshMutation = useMutation({
    mutationFn: () => patientsApi.refreshSummary(patientId),
    onSuccess: (result) => queryClient.setQueryData(queryKey, result),
  })

  const status = data?.status
  const summary = data?.summary ?? fallback
  const isBusy = isLoading || refreshMutation.isPending

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Stethoscope className="text-primary size-4" />
            Resumen del caso (IA)
          </CardTitle>
          <div className="flex items-center gap-2">
            {status && (
              <Badge
                variant={status === "READY" ? "secondary" : "outline"}
                className="text-[10px]"
              >
                {isBusy ? "Actualizando" : summaryStatusLabels[status]}
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => refreshMutation.mutate()}
              disabled={isBusy}
              aria-label="Refrescar resumen del caso"
              title="Refrescar resumen"
            >
              <RefreshCw
                className={cn(
                  "size-3.5",
                  refreshMutation.isPending && "animate-spin",
                )}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isBusy ? (
          <p className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
            <Loader2 className="size-3.5 animate-spin" />
            Generando resumen...
          </p>
        ) : isError ? (
          <div className="space-y-2">
            <Empty>No se pudo generar el resumen.</Empty>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : status === "PENDING" ||
          status === "PROCESSING" ||
          status === "FAILED" ? (
          <div className="space-y-2">
            <Empty>No se pudo generar el resumen.</Empty>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : summary ? (
          <p className="text-sm leading-6">{summary}</p>
        ) : (
          <Empty>No hay resumen disponible.</Empty>
        )}
      </CardContent>
    </Card>
  )
}
