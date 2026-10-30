import { PatientHealthSubcategoryBadge } from "@/components/patient-health-subcategory-badge"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Fingerprint, MapPin, Phone, UserPlus } from "lucide-react"
import { enrollmentsApi } from "@/api/enrollments"
import { CatalogValue } from "@/components/catalog-select"
import { Chip, MetaTag } from "@/components/ds/badge"
import { AddButton, Button } from "@/components/ds/button"
import { CopyValue } from "@/components/ds/copy-value"
import { InlineAlert } from "@/components/ds/inline-alert"
import { SlidingTabs } from "@/components/ds/sliding-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { formatIdentityDocument } from "@/types/identity-document"
import { useEnrollmentStore } from "@/pages/enrolamiento/_store/enrollment-store"
import { getAge } from "@/pages/enrolamiento/_utils/patient-age"
import { useAuthStore } from "@/store/auth-store"
import { usePatient } from "../_hooks/use-patient"
import { usePatientAlerts } from "../_hooks/use-patient-alerts"
import { formatDate, relativeDay } from "../_lib/ficha-format"
import { getPatientTab, isPatientTab, withPatientTab, type PatientTab } from "../_lib/patient-tabs"
import { buildEnrollmentPrefill } from "../_utils/build-enrollment-prefill"
import { AcompanantesTab } from "./acompanantes-tab"
import { ResumenTab } from "./ficha/resumen-tab"
import { PatientActivityActions } from "./patient-activity-actions"
import { PatientDocumentsTab } from "./patient-documents-tab"
import { PsicoTab } from "./psico-tab"
import { RecordatoriosTab } from "./recordatorios-tab"
import { SeguimientoTab } from "./seguimiento-tab"

// Ficha del paciente sobre el sistema de diseño (src/components/ds): cabecera
// con identidad y acciones, pestañas deslizantes y un solo fondo.

const TAB_LABELS: Record<PatientTab, string> = {
  resumen: "Resumen",
  seguimiento: "Seguimiento",
  psicooncologia: "Psicooncología",
  recordatorios: "Recordatorios",
  acompanantes: "Acompañantes",
  documentos: "Documentos",
}

export function PatientDetailContent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: patient, isLoading, isError } = usePatient(id!)
  const { alerts } = usePatientAlerts(patient)
  const user = useAuthStore((state) => state.user)
  const { resetEnrollment, updateDraft, setCategoria } = useEnrollmentStore()
  const enrolledOn = useQuery({
    queryKey: ["patient-enrollments", id],
    queryFn: () => enrollmentsApi.listByPatient(id!),
    enabled: Boolean(patient),
    staleTime: 30_000,
  }).data?.[0]?.enrolledOn

  if (isLoading) return <FichaSkeleton />
  if (isError || !patient) {
    return (
      <div className="font-ds space-y-4">
        <Button icon={ArrowLeft} onClick={() => navigate("/pacientes")}>
          Volver a pacientes
        </Button>
        <p className="text-sm text-zinc-500">No encontramos a este paciente. Puede que el enlace esté incompleto.</p>
      </div>
    )
  }

  const canViewDocuments = user?.role === "ADMIN" || user?.role === "FOUNDATION" || user?.role === "AGENT"
  const tabs = (Object.keys(TAB_LABELS) as PatientTab[]).filter((t) => t !== "documentos" || canViewDocuments)
  const requested = getPatientTab(searchParams.get("tab"))
  const tab = tabs.includes(requested) ? requested : "resumen"
  const age = getAge(patient.birthDate)
  const district = patient.details?.primaryHealthCenterName

  function setTab(next: PatientTab) {
    if (isPatientTab(next)) setSearchParams(withPatientTab(searchParams, next))
  }

  function enroll() {
    resetEnrollment()
    updateDraft(buildEnrollmentPrefill(patient!))
    const phase = patient!.details?.healthPhase
    setCategoria(phase === "CANCER_DIAGNOSIS" || phase === "SIGNS_AND_SYMPTOMS" ? phase : null)
    navigate("/enrolamiento")
  }

  return (
    <div className="font-ds text-zinc-900">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <button onClick={() => navigate("/pacientes")} className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-900">
              <ArrowLeft className="size-3.5" />
              Pacientes
            </button>
            <h1 className="text-xl font-semibold tracking-tight">{TAB_LABELS[tab]}</h1>
          </div>
          <SlidingTabs label="Secciones de la ficha" value={tab} onChange={setTab} options={tabs.map((t) => ({ id: t, label: TAB_LABELS[t], count: t === "acompanantes" ? patient.companions.length : null }))} />
        </div>

        <section className="flex flex-wrap items-center gap-4 rounded-[20px] border border-zinc-200 bg-white p-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
            {patient.fullName
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{patient.fullName}</h2>
              {patient.status !== "ENROLLED" && <Chip tone="violet">Prospecto</Chip>}
              <Chip tone={patient.activityStatus === "INACTIVE" ? "gray" : patient.activityStatus === "REACTIVE" ? "amber" : "blue"}>
                {patient.activityStatus === "ACTIVE" ? "Activo" : patient.activityStatus === "REACTIVE" ? "Reenrolado" : "Inactivo"}
              </Chip>
              {patient.details?.healthPhase && (
                <Chip tone="gray">
                  <CatalogValue kind="patient_health_phase" code={patient.details.healthPhase} />
                </Chip>
              )}
              {patient.details?.healthSubcategory && <PatientHealthSubcategoryBadge subcategory={patient.details.healthSubcategory} />}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {patient.dni && <MetaTag icon={Fingerprint}>{formatIdentityDocument(patient.documentType, patient.dni)}</MetaTag>}
              {patient.primaryPhone && (
                <MetaTag icon={Phone}>
                  <CopyValue value={patient.primaryPhone} label="Celular" />
                </MetaTag>
              )}
              {district && <MetaTag icon={MapPin}>{district}</MetaTag>}
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              {[age !== null && `${age} años`, enrolledOn ? `en SEPA desde el ${formatDate(enrolledOn)}` : `registrado el ${formatDate(patient.createdAt)}`].filter(Boolean).join(", ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PatientActivityActions patient={patient} />
            {patient.status === "UNENROLLED" ? (
              <Button variant="dark" icon={UserPlus} onClick={enroll}>
                Enrolar
              </Button>
            ) : (
              <AddButton onClick={() => setSearchParams(withPatientTab(new URLSearchParams({ agendar: "1" }), "seguimiento"))}>Agendar seguimiento</AddButton>
            )}
          </div>
          {alerts.map((a) => (
            <InlineAlert key={a.id} aside={a.healthCenterName}>
              {a.title}
            </InlineAlert>
          ))}
          {patient.activityStatus === "INACTIVE" && (
            <InlineAlert tone="warning" aside={patient.deactivatedAt ? `Desde ${relativeDay(patient.deactivatedAt)}` : undefined}>
              Paciente inactivo. Para que vuelva al programa, usa Reenrolar: se crea un seguimiento para registrar el motivo y sus datos.
            </InlineAlert>
          )}
        </section>

        <div key={tab} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
          {tab === "resumen" && <ResumenTab patient={patient} />}
          {tab === "seguimiento" && <SeguimientoTab pacienteId={patient.id} />}
          {tab === "psicooncologia" && <PsicoTab pacienteId={patient.id} patientName={patient.fullName} />}
          {tab === "recordatorios" && <RecordatoriosTab pacienteId={patient.id} />}
          {tab === "acompanantes" && <AcompanantesTab patientId={patient.id} birthDate={patient.birthDate} />}
          {tab === "documentos" && <PatientDocumentsTab patientId={patient.id} diagnoses={patient.diagnoses} treatments={patient.treatments} />}
        </div>
      </div>
    </div>
  )
}

function FichaSkeleton() {
  return (
    <div className="font-ds">
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48 bg-zinc-200" />
          <Skeleton className="h-10 w-[560px] max-w-[50%] rounded-[14px] bg-zinc-200" />
        </div>
        <Skeleton className="h-24 rounded-[20px] bg-white" />
        <Skeleton className="h-28 rounded-[20px] bg-white" />
        <div className="grid gap-4 xl:grid-cols-[7fr_5fr]">
          <Skeleton className="h-96 rounded-[20px] bg-white" />
          <Skeleton className="h-96 rounded-[20px] bg-white" />
        </div>
      </div>
    </div>
  )
}
