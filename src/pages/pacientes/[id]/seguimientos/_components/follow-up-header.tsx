import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Fingerprint, History, Pencil, Phone, Sparkles } from "lucide-react"
import type { FollowUp } from "@/api/follow-ups"
import type { PatientTimelineEvent } from "@/api/patient-timeline"
import { patientsApi, type PatientDetailsResponse } from "@/api/patients"
import { CatalogValue } from "@/components/catalog-select"
import { Chip, MetaTag } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { CopyValue } from "@/components/ds/copy-value"
import { ExpandableLine } from "@/components/ds/expandable-line"
import { AiMark } from "@/components/ds/icon"
import { InlineAlert } from "@/components/ds/inline-alert"
import type { Tone } from "@/components/ds/tone"
import { followUpPurposeLabels, followUpStatusLabels, followUpTypeLabels } from "@/lib/follow-up-labels"
import { formatIdentityDocument } from "@/types/identity-document"
import { usePatientAlerts } from "../../_hooks/use-patient-alerts"
import { capitalize, formatDate, formatTime, relativeDay } from "../../_lib/ficha-format"

// Cabecera del seguimiento: a quién, para qué, cuándo y en qué estado, con el
// último contacto y el resumen del caso a mano.

const STATUS_TONES: Record<FollowUp["status"], Tone> = { SCHEDULED: "blue", OVERDUE: "red", COMPLETED: "green", NO_ANSWER: "amber", CANCELLED: "gray" }

type FollowUpEvent = Extract<PatientTimelineEvent, { kind: "FOLLOW_UP" }>

export function FollowUpHeader({
  followUp,
  patient,
  timeline,
  agentName,
  isOpen,
  readOnlyNote,
  onBack,
  onEdit,
}: {
  followUp: FollowUp
  patient: PatientDetailsResponse | undefined
  timeline: PatientTimelineEvent[] | undefined
  agentName: string | undefined
  isOpen: boolean
  /** El seguimiento es de otro agente: se consulta, no se modifica. */
  readOnlyNote: boolean
  onBack: () => void
  onEdit?: () => void
}) {
  const { alerts } = usePatientAlerts(patient)
  const summary = useQuery({ queryKey: ["patient-summary", followUp.subjectPatientId], queryFn: () => patientsApi.getSummary(followUp.subjectPatientId), staleTime: 5 * 60_000, refetchOnWindowFocus: false, retry: false }).data?.summary
  const previous = timeline
    ?.filter((e): e is FollowUpEvent => e.kind === "FOLLOW_UP" && e.followUpId !== followUp.id && e.status === "COMPLETED" && Boolean(e.notes))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0]
  const firstName = patient?.fullName.split(" ")[0]
  const diagnosis = patient?.diagnoses.find((d) => d.isCurrent)

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-900">
        <ArrowLeft className="size-3.5" />
        Volver a la ficha{firstName ? ` de ${firstName}` : ""}
      </button>
      <section className="space-y-4 rounded-[20px] border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-zinc-900 text-base font-semibold text-white">
            {(patient?.fullName ?? "?")
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-zinc-500">{isOpen ? "Registrar seguimiento" : "Detalle del seguimiento"}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold">
                {followUpPurposeLabels[followUp.purpose] ?? "Seguimiento"}
                {firstName ? ` con ${firstName}` : ""}
              </h1>
              <Chip tone={STATUS_TONES[followUp.status]}>{followUpStatusLabels[followUp.status]}</Chip>
              {patient?.details?.healthPhase && (
                <Chip tone="violet">
                  <CatalogValue kind="patient_health_phase" code={patient.details.healthPhase} />
                </Chip>
              )}
              {diagnosis && (
                <Chip tone="blue">
                  <CatalogValue kind="cancer_diagnosis" code={diagnosis.diagnosis} />
                </Chip>
              )}
            </div>
            {patient && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {patient.primaryPhone && (
                  <MetaTag icon={Phone}>
                    <CopyValue value={patient.primaryPhone} label="Celular" />
                  </MetaTag>
                )}
                <MetaTag>{patient.fullName}</MetaTag>
                {patient.dni && <MetaTag icon={Fingerprint}>{formatIdentityDocument(patient.documentType, patient.dni)}</MetaTag>}
              </div>
            )}
            <p className="mt-1.5 text-xs text-zinc-500">
              {followUpTypeLabels[followUp.type] ?? "Contacto"}
              {followUp.scheduledAt ? ` agendada para el ${formatDate(followUp.scheduledAt)} a las ${formatTime(followUp.scheduledAt)} (${relativeDay(followUp.scheduledAt)})` : " sin fecha agendada"}
              {agentName ? `, a cargo de ${agentName}` : ""}
            </p>
          </div>
          {onEdit && (
            <Button icon={Pencil} onClick={onEdit}>
              Editar seguimiento
            </Button>
          )}
        </div>
        {(previous || summary) && (
          <div className="grid gap-2 lg:grid-cols-2">
            {previous && <ExpandableLine icon={<History className="size-4 text-zinc-400" />} label={`Último contacto, ${relativeDay(previous.occurredAt)}`} text={previous.notes!} />}
            {summary && <ExpandableLine icon={<AiMark icon={Sparkles} className="[&_svg]:size-4" />} label="Resumen del caso" text={summary} />}
          </div>
        )}
        {readOnlyNote && <InlineAlert tone="warning">Este seguimiento es de otro agente. Puedes consultarlo, no modificarlo.</InlineAlert>}
        {alerts.map((a) => (
          <InlineAlert key={a.id} aside={a.createdAt ? capitalize(`abierta ${relativeDay(a.createdAt)}`) : a.healthCenterName}>
            {a.title}
          </InlineAlert>
        ))}
      </section>
    </div>
  )
}
