import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { enrollmentsApi } from "@/api/enrollments"
import { patientsApi, type PatientDetailsResponse } from "@/api/patients"
import { CatalogValue } from "@/components/catalog-select"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Card, GroupLabel } from "@/components/ds/card"
import { CopyValue } from "@/components/ds/copy-value"
import { DataList } from "@/components/ds/data"
import { PatientHealthSubcategoryBadge } from "@/components/patient-health-subcategory-badge"
import { getAge } from "@/pages/enrolamiento/_utils/patient-age"
import { DEPARTMENT_LABELS } from "@/pages/hospitales/_utils/departments"
import { formatIdentityDocument } from "@/types/identity-document"
import { useAuthStore } from "@/store/auth-store"
import { diagnosticStatusLabels, genderLabels } from "../../_lib/clinical-labels"
import { formatDate, formatDuration, yesNo } from "../../_lib/ficha-format"
import { patientTabUrl } from "../../_lib/patient-tabs"
import { PatientProfileDialog } from "../patient-profile-dialog"
import { PatientRecordsSection } from "../patient-records-section"

// Tarjetas de consulta del Resumen: texto etiqueta/valor, sin íconos.

type Props = { patient: PatientDetailsResponse }

function gender(code: string | null | undefined) {
  return code ? (genderLabels[code] ?? code) : null
}

function phone(value: string | null | undefined, label: string) {
  return value ? <CopyValue value={value} label={label} /> : null
}

export function PersonalDataCard({ patient }: Props) {
  const user = useAuthStore((s) => s.user)
  const canEdit = user?.role === "ADMIN" || user?.role === "FOUNDATION" || user?.role === "AGENT"
  const [editing, setEditing] = useState(false)
  const age = getAge(patient.birthDate)
  const enrollment = useQuery({
    queryKey: ["patient-enrollments", patient.id],
    queryFn: () => enrollmentsApi.listByPatient(patient.id),
    staleTime: 30_000,
  }).data?.[0]
  return (
    <Card title="Datos del paciente" action={canEdit ? <Button onClick={() => setEditing(true)}>Editar</Button> : undefined}>
      <DataList
        items={[
          ["Documento", patient.dni ? formatIdentityDocument(patient.documentType, patient.dni) : null],
          ["Fecha de nacimiento", patient.birthDate ? `${formatDate(patient.birthDate)}${age === null ? "" : ` (${age} años)`}` : null],
          ["Sexo", gender(patient.gender)],
          ["Celular", phone(patient.primaryPhone, "Celular")],
          ["Celular auxiliar", phone(patient.secondaryPhone, "Celular auxiliar")],
          ["WhatsApp", yesNo(patient.hasWhatsapp)],
          ["Correo", patient.email ? <CopyValue value={patient.email} label="Correo" /> : null],
          [
            "Punto de ingreso",
            enrollment?.entrySource ? (
              <span>
                <CatalogValue kind="entry_source" code={enrollment.entrySource} />
                {enrollment.entrySubSource && (
                  <span className="text-zinc-500">
                    , <CatalogValue kind="entry_sub_source" code={enrollment.entrySubSource} />
                  </span>
                )}
              </span>
            ) : null,
          ],
          ["Cáncer infantil", age === null ? null : age < 18 ? "Sí" : "No"],
          ...(patient.deceasedAt ? ([["Fallecimiento", formatDate(patient.deceasedAt)]] as [string, React.ReactNode][]) : []),
        ]}
      />
      {canEdit && <PatientProfileDialog patient={patient} open={editing} onOpenChange={setEditing} />}
    </Card>
  )
}

export function ContactCard({ patient }: Props) {
  const primary = patient.companions.find((l) => l.contactRole === "PRIMARY" || l.isPrimaryContact)
  const caregiverLink = patient.companions.find((l) => l.isCaregiver)
  const legacy = patient.details?.emergencyContactName
  return (
    <Card
      title="Contacto para seguimiento"
      description={primary ? "Con quién se coordina cada seguimiento" : "Se habla directamente con el paciente"}
      action={
        patient.companions.length > 0 ? (
          <Link to={patientTabUrl(patient.id, "acompanantes")} className="text-[13px] font-medium text-zinc-700 hover:text-zinc-900">
            Ver acompañantes ({patient.companions.length})
          </Link>
        ) : undefined
      }
    >
      <DataList
        labelWidth={130}
        items={[
          ["Nombre", primary ? (primary.companion?.fullName ?? primary.companionDisplayName) : patient.fullName],
          ["Parentesco", primary ? (primary.relationship ? <CatalogValue kind="companion_relationship" code={primary.relationship} /> : null) : "Paciente"],
          ["Celular", phone(primary ? primary.companion?.primaryPhone : patient.primaryPhone, "Celular")],
          ["Celular auxiliar", phone(primary ? primary.companion?.secondaryPhone : patient.secondaryPhone, "Celular auxiliar")],
          ["Género", gender(primary ? primary.companion?.gender : patient.gender)],
        ]}
      />
      <GroupLabel>Cuidador</GroupLabel>
      {caregiverLink || legacy ? (
        <DataList
          labelWidth={130}
          items={[
            ["Nombre", caregiverLink ? (caregiverLink.companion?.fullName ?? caregiverLink.companionDisplayName) : legacy],
            ["Celular", phone(caregiverLink ? caregiverLink.companion?.primaryPhone : patient.details?.emergencyContactPhone, "Celular")],
            ["Género", gender(caregiverLink ? caregiverLink.companion?.gender : patient.details?.emergencyContactGender)],
          ]}
        />
      ) : (
        <p className="px-1 py-2 text-[13px] text-zinc-500">Sin cuidador registrado.</p>
      )}
    </Card>
  )
}

export function OriginCard({ patient }: Props) {
  const d = patient.details
  return (
    <Card title="Procedencia y residencia">
      {d ? (
        <DataList
          labelWidth={170}
          items={[
            [
              d.birthCountry ? "País de nacimiento" : "Departamento de nacimiento",
              d.birthCountry ? <CatalogValue kind="country" code={d.birthCountry} /> : d.birthDepartment ? (DEPARTMENT_LABELS[d.birthDepartment] ?? d.birthDepartment) : null,
            ],
            ["Hospital principal", d.primaryHealthCenterName ?? null],
            ["Zonificación", d.zoneType ? <CatalogValue kind="zone_type" code={d.zoneType} /> : null],
            ["Tiempo al hospital", formatDuration(d.travelTimeToHospital)],
            ["Requiere traducción", yesNo(d.requiresTranslation)],
          ]}
        />
      ) : (
        <p className="text-[13px] text-zinc-500">Sin datos de procedencia. Se registran en el enrolamiento o en un seguimiento.</p>
      )}
      <GroupLabel>Direcciones</GroupLabel>
      <div className="px-1 pt-1">
        <PatientRecordsSection patientId={patient.id} embedded />
      </div>
    </Card>
  )
}

export function SocioCard({ patient }: Props) {
  const d = patient.details
  return (
    <Card title="Perfil socioeconómico y familiar">
      {d ? (
        <DataList
          labelWidth={200}
          items={[
            ["Grado de instrucción", d.educationLevel ? <CatalogValue kind="education_level" code={d.educationLevel} /> : null],
            ["Lengua materna/originaria", d.nativeLanguage ? <CatalogValue kind="native_language" code={d.nativeLanguage} /> : null],
            ["Hijos", d.childrenCount === null ? null : d.childrenCount > 0 ? `Sí, ${d.childrenCount}` : "No"],
            ["Trabaja", yesNo(d.isWorking)],
            ["Recibe ayuda económica", yesNo(d.receivesFinancialSupport)],
            ["Usa cocina a leña", yesNo(d.usesWoodStove)],
            ["Violencia intrafamiliar", d.evidenceOfDomesticViolence === null ? null : d.evidenceOfDomesticViolence ? "Se evidencia" : "No se evidencia"],
            ["Derivado a trabajo social", yesNo(d.referredToSocialWorker)],
            ["Carnet CONADIS", yesNo(d.hasConadisCard)],
            ["Conoce FISSAL", yesNo(d.knowsAboutFissal)],
          ]}
        />
      ) : (
        <p className="text-[13px] text-zinc-500">Sin datos socioeconómicos registrados.</p>
      )}
    </Card>
  )
}

export function InsuranceCard({ patient }: Props) {
  const current = patient.insurance.find((i) => i.isCurrent) ?? patient.insurance[0]
  const sis = patient.sisAffiliations[0]
  const symptoms = patient.symptomReports.map((s) => s.signsAndSymptoms ?? s.discomfortDescription).filter(Boolean)
  const status = useQuery({
    queryKey: ["patient-diagnostic-status-current", patient.id],
    queryFn: () => patientsApi.getCurrentDiagnosticStatus(patient.id),
  }).data
  return (
    <Card title="Seguro y síntomas">
      <DataList
        labelWidth={150}
        items={[
          [
            "Seguro",
            current ? (
              <span className="flex flex-wrap items-center gap-2">
                <CatalogValue kind="insurance_type" code={current.insuranceType} />
                {current.epsProvider && (
                  <span className="text-zinc-500">
                    <CatalogValue kind="eps_provider" code={current.epsProvider} />
                  </span>
                )}
                {current.isCurrent && <Chip tone="green">Vigente</Chip>}
              </span>
            ) : null,
          ],
          ["Afiliación SIS", sis ? (sis.canAffiliate ? "Puede afiliarse" : (sis.cantAffiliateReason ?? "No puede afiliarse")) : null],
          ["Síntomas", symptoms.length ? symptoms.join(". ") : null],
          [
            "Estado diagnóstico",
            status ? (
              <span>
                {diagnosticStatusLabels[status.status]}
                {status.supportedBySepa !== null && <span className="text-zinc-500">, SEPA: {status.supportedBySepa ? "sí" : "no"}</span>}
              </span>
            ) : null,
          ],
        ]}
      />
    </Card>
  )
}

export function HealthPhaseLine({ patient }: Props) {
  const d = patient.details
  if (!d?.healthPhase) return <span>Sin clasificar</span>
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <CatalogValue kind="patient_health_phase" code={d.healthPhase} />
      {d.healthSubcategory && <PatientHealthSubcategoryBadge subcategory={d.healthSubcategory} />}
    </span>
  )
}
