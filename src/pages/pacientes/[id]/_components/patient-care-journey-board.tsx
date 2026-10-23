import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Building2, Calendar } from "lucide-react"
import { healthCentersApi } from "@/api/health-centers"
import type {
  PatientDetailsResponse,
  PatientMedicalAppointment,
} from "@/api/patients"
import { CatalogValue } from "@/components/catalog-select"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  const { data: healthCenters = [], isLoading } = useQuery({
    queryKey: ["healthCenters"],
    queryFn: () => healthCentersApi.list(),
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
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b pb-5">
        <div className="min-w-0">
          <CardTitle>Recorrido de atención</CardTitle>
          <p className="text-muted-foreground mt-0.5 text-[12.5px] leading-relaxed">
            Hospitales y departamentos donde se registró cita, diagnóstico o
            tratamiento.
          </p>
        </div>
        {journey.events.length > 0 ? (
          <CardAction className="static justify-self-end">
            <Badge variant="outline">
              {hospitalLabel} · {regionLabel}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="grid p-0 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.7fr)]">
        <div className="bg-muted/20 flex min-h-[32rem] flex-col justify-between p-4 sm:p-6">
          <PatientCareJourneyMap
            departmentCodes={journey.departmentCodes}
            hops={journey.hops}
            stops={journey.stops}
            highlightedCode={highlightedCode}
            onHighlight={setHighlightedCode}
          />
          <PatientCareJourneyMapLegend className="mt-3" />
        </div>

        <div className="border-t p-4 sm:p-6 xl:max-h-[38rem] xl:overflow-y-auto xl:border-t-0 xl:border-l">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">
              Cargando hospitales…
            </p>
          ) : journey.events.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Todavía no hay atenciones con hospital registrado.
            </p>
          ) : (
            <ol className="space-y-2" aria-label="Atenciones por hospital">
              {journey.events.map((event) => (
                <li key={event.id}>
                  <JourneyEventRow
                    event={event}
                    highlighted={highlightedCode === event.departmentCode}
                    onHighlight={setHighlightedCode}
                  />
                </li>
              ))}
            </ol>
          )}
        </div>
      </CardContent>
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
          {event.category ? (
            <>
              Nivel{" "}
              <CatalogValue
                kind="health_center_category"
                code={event.category}
              />
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
