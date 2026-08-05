import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Calendar,
  HeartPulse,
  Loader2,
  Phone,
  Pill,
  RefreshCw,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react"
import { patientsApi, type PatientDetailsResponse } from "@/api/patients"
import { cn } from "@/lib/utils"
import { cancerStageBadgeClass, cancerStageLabels, educationLabels, epsLabels, insuranceLabels } from "../_lib/clinical-labels"

const roleLabels: Record<PatientDetailsResponse["role"], string> = {
  UNKNOWN: "Sin definir",
  PATIENT: "Paciente",
  COMPANION: "Acompañante",
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
function Empty({ children }: { children: string }) {
  return <p className="text-muted-foreground py-2 text-sm">{children}</p>
}

export function OverviewSection({
  patient,
}: {
  patient: PatientDetailsResponse
}) {
  const details = patient.details
  return (
    <div className="space-y-4">
      <AiSummarySection patientId={patient.id} fallback={patient.summary} />
      <Section title="Información general">
        <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Field label="DNI" value={patient.dni} />
          <Field label="Fecha de nacimiento" value={date(patient.birthDate)} />
          <Field label="Email" value={patient.email} />
          <Field label="Género" value={patient.gender} />
          <Field label="Teléfono" value={patient.primaryPhone} icon={Phone} />
          <Field
            label="Teléfono secundario"
            value={patient.secondaryPhone}
            icon={Phone}
          />
          <Field label="WhatsApp" value={patient.hasWhatsapp ? "Sí" : "No"} />
          <Field label="Rol" value={roleLabels[patient.role]} />
          <Field
            label="Estado de enrolamiento"
            value={patient.status === "ENROLLED" ? "Enrolado" : "Sin enrolar"}
          />
          <Field
            label="Estado del paciente"
            value={patient.isActive ? "Activo" : "Inactivo"}
          />
          <Field
            label="Motivo de desactivación"
            value={patient.deactivationReason}
          />
          <Field label="Fallecimiento" value={date(patient.deceasedAt)} />
        </div>
      </Section>
      <Section title="Datos demográficos">
        {details ? (
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Dirección" value={details.currentAddress} />
            <Field label="Distrito" value={details.currentDistrict} />
            <Field label="Departamento" value={details.currentDepartment} />
            <Field
              label="Departamento de nacimiento"
              value={details.birthDepartment}
            />
            <Field label="Zona" value={details.zoneType} />
            <Field
              label="Contacto de emergencia"
              value={details.emergencyContactName}
            />
            <Field
              label="Teléfono de emergencia"
              value={details.emergencyContactPhone}
              icon={Phone}
            />
            <Field
              label="Género del contacto de emergencia"
              value={details.emergencyContactGender}
            />
            <Field
              label="Nivel educativo"
              value={details.educationLevel ? educationLabels[details.educationLevel] : null}
            />
            <Field label="Lengua nativa" value={details.nativeLanguage} />
            <Field
              label="Requiere traducción"
              value={details.requiresTranslation ? "Sí" : "No"}
            />
            <Field
              label="Derivado a trabajo social"
              value={bool(details.referredToSocialWorker)}
            />
            <Field
              label="Violencia doméstica"
              value={bool(details.evidenceOfDomesticViolence)}
            />
            <Field label="Cocina a leña" value={bool(details.usesWoodStove)} />
            <Field label="Situación laboral" value={bool(details.isWorking)} />
            <Field
              label="Apoyo económico"
              value={bool(details.receivesFinancialSupport)}
            />
            <Field
              label="Carnet CONADIS"
              value={bool(details.hasConadisCard)}
            />
            <Field
              label="Conoce FISSAL"
              value={bool(details.knowsAboutFissal)}
            />
            <Field
              label="Abandono del programa"
              value={date(details.programDropoutDate)}
            />
            <Field
              label="Motivo de abandono"
              value={details.programDropoutReason}
            />
          </div>
        ) : (
          <Empty>No hay datos demográficos registrados.</Empty>
        )}
      </Section>
      <Section title="Diagnósticos y tratamientos">
        <div className="space-y-5">
          <Records
            title="Diagnósticos"
            count={patient.diagnoses.length}
            icon={Stethoscope}
          >
            {patient.diagnoses.map((item) => (
              <div key={item.id} className="space-y-1.5 rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <b>{item.diagnosis}</b>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {item.isCurrent && (
                      <Badge variant="secondary" className="text-[10px]">
                        Vigente
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        "border text-[10px] font-medium",
                        item.cancerStage ? cancerStageBadgeClass[item.cancerStage] : cancerStageBadgeClass.UNKNOWN,
                      )}
                    >
                      {item.cancerStage ? cancerStageLabels[item.cancerStage] : "Etapa desconocida"}
                    </Badge>
                  </div>
                </div>
                <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
                  <Building2 className="size-3" />
                  {item.healthCenterName ?? "Centro no registrado"}
                  {item.diagnosisDate && <>· {date(item.diagnosisDate)}</>}
                </p>
              </div>
            ))}
          </Records>
          <Records
            title="Tratamientos"
            count={patient.treatments.length}
            icon={Pill}
          >
            {patient.treatments.map((item) => (
              <div key={item.id} className="space-y-1.5 rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <b>{item.treatmentType}</b>
                  {item.isCurrent && (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      Vigente
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {item.diagnosisSummary?.diagnosis ?? "Diagnóstico no registrado"}
                </p>
                <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
                  <Building2 className="size-3" />
                  {item.healthCenterName ?? "Centro no registrado"}
                  {item.startDate && <>· desde {date(item.startDate)}</>}
                </p>
              </div>
            ))}
          </Records>
        </div>
      </Section>
      <Section title="Datos complementarios">
        <div className="space-y-5">
          <Records
            title="Seguros"
            count={patient.insurance.length}
            icon={Shield}
          >
            {patient.insurance.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
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
function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | null
  icon?: typeof Phone
}) {
  return (
    <div>
      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <p className="mt-0.5 font-medium">{value ?? "-"}</p>
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

function AiSummarySection({
  patientId,
  fallback,
}: {
  patientId: string
  fallback: string | null
}) {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["patient-summary", patientId],
    queryFn: () => patientsApi.getSummary(patientId),
  })

  const status = data?.status
  const summary = data?.summary ?? fallback

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-sm">Resumen del caso (IA)</CardTitle>
        {status && status !== "PENDING" && status !== "PROCESSING" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={cn("size-3.5", isRefetching && "animate-spin")}
            />
            Actualizar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
        ) : status === "PENDING" || status === "PROCESSING" ? (
          <p className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
            <Loader2 className="size-3.5 animate-spin" />
            Generando resumen...
          </p>
        ) : status === "FAILED" ? (
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
