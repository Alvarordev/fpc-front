import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Building2, Calendar } from "lucide-react"
import { healthCentersApi, type HealthCenter } from "@/api/health-centers"
import type {
  PatientDetailsResponse,
  PatientMedicalAppointment,
} from "@/api/patients"
import { careLevelLabel } from "@/lib/health-center-labels"
import { collectJourneyHealthCenterIds } from "../_lib/patient-care-journey"
import { CatalogValue } from "@/components/catalog-select"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ds/card"
import { Chip } from "@/components/ds/badge"
import { cn } from "@/lib/utils"
import { buildPatientCareJourney } from "../_lib/patient-care-journey"
import type { PatientCareJourneyEvent } from "../_lib/patient-care-journey"
import {
  PatientCareJourneyMap,
  PatientCareJourneyMapLegend,
} from "./patient-care-journey-map"

const KIND_LABELS: Record<PatientCareJourneyEvent["kind"], string> = {
  diagnosis: "Diagnóstico",
  treatment: "Tratamiento",
  appointment: "Cita",
}

const TREATMENT_ROLE_LABELS = {
  source: "Origen",
  receiving: "Destino",
} as const

const APPOINTMENT_STATUS_LABELS: Record<
  PatientMedicalAppointment["status"],
  string
> = {
  SCHEDULED: "Programada",
  COMPLETED: "Asistió",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No asistió",
}

export function PatientCareJourneyBoard({
  patient,
}: {
  patient: PatientDetailsResponse
}) {
  const healthCenterIds = useMemo(
    () => collectJourneyHealthCenterIds(patient),
    [patient],
  )
  const { data: healthCenters = [], isLoading } = useQuery({
    queryKey: ["health-centers", "journey", healthCenterIds],
    queryFn: async () => {
      const results = await Promise.all(
        healthCenterIds.map(async (id) => {
          try {
            return await healthCentersApi.getById(id)
          } catch {
            return null
          }
        }),
      )
      return results.filter((center): center is HealthCenter => center !== null)
    },
    enabled: healthCenterIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null)

  const journey = useMemo(
    () => buildPatientCareJourney(patient, healthCenters),
    [patient, healthCenters],
  )

  const hospitalLabel =
    journey.hospitalCount === 1
      ? "1 hospital"
      : `${journey.hospitalCount} hospitales`
  const regionLabel =
    journey.departmentCodes.length === 1
      ? "1 región"
      : `${journey.departmentCodes.length} regiones`

  return (
    <Card
      title="Recorrido de atención"
      description="Hospitales y departamentos donde se registró una cita, un diagnóstico o un tratamiento"
      action={journey.events.length > 0 ? <Chip>{hospitalLabel}, {regionLabel}</Chip> : undefined}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.7fr)]">
        <div className="flex min-h-[28rem] flex-col justify-between rounded-[14px] bg-zinc-50 p-4 ring-1 ring-zinc-200/60">
          <PatientCareJourneyMap
            departmentCodes={journey.departmentCodes}
            hops={journey.hops}
            stops={journey.stops}
            highlightedCode={highlightedCode}
            onHighlight={setHighlightedCode}
          />
          <PatientCareJourneyMapLegend className="mt-3" />
        </div>
        <div className="xl:max-h-[32rem] xl:overflow-y-auto">
          {isLoading ? (
            <p className="text-[13px] text-zinc-500">Cargando hospitales...</p>
          ) : journey.events.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Todavía no hay atenciones con hospital registrado.</p>
          ) : (
            <ol className="space-y-2" aria-label="Atenciones por hospital">
              {journey.events.map((event) => (
                <li key={event.id}>
                  <JourneyEventRow event={event} highlighted={highlightedCode === event.departmentCode} onHighlight={setHighlightedCode} />
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Card>
  )
}

function JourneyEventRow({
  event,
  highlighted,
  onHighlight,
}: {
  event: PatientCareJourneyEvent
  highlighted: boolean
  onHighlight: (code: string | null) => void
}) {
  const canHighlight = Boolean(event.departmentCode)

  return (
    <article
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-colors duration-150",
        highlighted && "border-foreground/25 bg-muted/50",
      )}
      onMouseEnter={() => canHighlight && onHighlight(event.departmentCode)}
      onMouseLeave={() => onHighlight(null)}
      onFocus={() => canHighlight && onHighlight(event.departmentCode)}
      onBlur={() => onHighlight(null)}
      tabIndex={canHighlight ? 0 : undefined}
      aria-label={eventAriaLabel(event)}
    >
      <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
        <Calendar className="size-3" />
        {formatJourneyDate(event.date, event.dateKind)}
      </div>
      <p className="mt-1 text-sm font-medium tracking-tight">
        {event.hospitalName}
      </p>
      <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
        <Building2 className="size-3" />
        <span>{event.departmentLabel ?? "Departamento no registrado"}</span>
        <span aria-hidden>·</span>
        <span className="text-foreground font-medium">
          {event.careLevel || event.careCategory ? (
            <>
              {careLevelLabel(event.careLevel) ?? "Nivel no registrado"}
              {event.careCategory ? ` · ${event.careCategory}` : ""}
            </>
          ) : (
            "Nivel no registrado"
          )}
        </span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px]">
          {KIND_LABELS[event.kind]}
          {event.treatmentRole
            ? ` · ${TREATMENT_ROLE_LABELS[event.treatmentRole]}`
            : null}
        </Badge>
        {event.kind === "appointment" && event.appointmentStatus ? (
          <Badge variant="outline" className="text-[10px]">
            {APPOINTMENT_STATUS_LABELS[event.appointmentStatus]}
          </Badge>
        ) : null}
        {event.specialty ? (
          <span className="text-muted-foreground text-xs">
            <CatalogValue kind="medical_specialty" code={event.specialty} />
          </span>
        ) : event.treatmentType ? (
          <span className="text-muted-foreground text-xs">
            <CatalogValue kind="treatment_type" code={event.treatmentType} />
          </span>
        ) : null}
      </div>
    </article>
  )
}

function formatJourneyDate(
  value: string,
  kind: PatientCareJourneyEvent["dateKind"],
) {
  const formatted = new Date(value).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  return kind === "registered" ? `Registrado el ${formatted}` : formatted
}

function eventAriaLabel(event: PatientCareJourneyEvent) {
  const parts = [
    KIND_LABELS[event.kind],
    event.hospitalName,
    event.departmentLabel,
    formatJourneyDate(event.date, event.dateKind),
  ]
  return parts.filter(Boolean).join(", ")
}
