import { useState } from "react"
import { useQueries } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { surveysApi, type PendingSurvey, type SurveyType } from "@/api/surveys"
import { CopySurveyScript } from "@/components/copy-survey-script"
import { PatientHealthSubcategoryDot } from "@/components/patient-health-subcategory-badge"
import { RegisterSurveyDialog } from "@/components/register-survey-dialog"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Item } from "@/components/ds/card"
import { DateTile } from "@/components/ds/date-tile"
import { EmptyState } from "@/components/ds/empty-state"
import { InlineAlert } from "@/components/ds/inline-alert"
import { SlidingTabs } from "@/components/ds/sliding-tabs"
import { patientTabUrl } from "@/pages/pacientes/[id]/_lib/patient-tabs"
import {
  formatAgendaTime,
  isOverdue,
  isToday,
  toDateKey,
  type AgendaEvent,
} from "../_lib/agenda"

type FollowUpEvent = Extract<AgendaEvent, { kind: "follow-up" }>

type WorklistTab = "seguimientos" | SurveyTabId
type SurveyTabId = "enrolamiento" | "psicooncologia" | "programa" | "charlas"

const SURVEY_TABS: {
  id: SurveyTabId
  type: SurveyType
  label: string
  description: string
  emptyTitle: string
  emptyBody: string
}[] = [
  {
    id: "enrolamiento",
    type: "ENROLLMENT",
    label: "Encuesta a enrolados",
    description: "Pacientes que enrolaste y aún no tienen la encuesta de enrolamiento.",
    emptyTitle: "Todos tus enrolados tienen encuesta",
    emptyBody: "Cuando enroles a un paciente aparecerá aquí hasta que registres su encuesta.",
  },
  {
    id: "psicooncologia",
    type: "PSYCHOONCOLOGY",
    label: "Psicooncología",
    description: "Pacientes con 4 o más sesiones de psicooncología completadas, sin encuesta de satisfacción.",
    emptyTitle: "Sin encuestas de psicooncología pendientes",
    emptyBody: "Cuando un paciente complete su cuarta sesión aparecerá aquí.",
  },
  {
    id: "programa",
    type: "THREE_MONTHS",
    label: "Satisfacción del programa",
    description: "Pacientes activos con 3 meses o más en el programa, sin encuesta de satisfacción.",
    emptyTitle: "Sin encuestas del programa pendientes",
    emptyBody: "Cuando un paciente cumpla 3 meses desde su enrolamiento aparecerá aquí.",
  },
  {
    id: "charlas",
    type: "TALK",
    label: "Charlas",
    description: "Pacientes que asistieron a una charla de FPC, sin encuesta de satisfacción.",
    emptyTitle: "Sin encuestas de charlas pendientes",
    emptyBody: "Cuando se registre la asistencia de un paciente a una charla aparecerá aquí.",
  },
]

export function AgentWorklistPanel({
  followUpEvents,
  onSelectFollowUp,
}: {
  followUpEvents: FollowUpEvent[]
  onSelectFollowUp: (event: FollowUpEvent) => void
}) {
  const [tab, setTab] = useState<WorklistTab>("seguimientos")
  const pendingQueries = useQueries({
    queries: SURVEY_TABS.map((item) => ({
      queryKey: ["surveys", "pending", item.type],
      queryFn: () => surveysApi.pending(item.type),
      staleTime: 30_000,
    })),
  })

  const options: { id: WorklistTab; label: string; count: number | null }[] = [
    { id: "seguimientos", label: "Seguimientos pendientes", count: followUpEvents.length },
    ...SURVEY_TABS.map((item, index) => ({
      id: item.id,
      label: item.label,
      count: pendingQueries[index].data?.length ?? null,
    })),
  ]
  const surveyIndex = SURVEY_TABS.findIndex((item) => item.id === tab)

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
      <SlidingTabs label="Pendientes del agente" value={tab} onChange={setTab} options={options} />
      <div key={tab} className="mt-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
        {tab === "seguimientos" ? (
          <FollowUpList events={followUpEvents} onSelect={onSelectFollowUp} />
        ) : (
          <SurveyPendingList
            config={SURVEY_TABS[surveyIndex]}
            query={pendingQueries[surveyIndex]}
          />
        )}
      </div>
    </section>
  )
}

function FollowUpList({
  events,
  onSelect,
}: {
  events: FollowUpEvent[]
  onSelect: (event: FollowUpEvent) => void
}) {
  if (events.length === 0)
    return (
      <EmptyState
        title="Sin seguimientos pendientes"
        body="Los seguimientos programados o vencidos que tengas asignados aparecerán aquí."
      />
    )
  const sorted = events.slice().sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  return (
    <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
      {sorted.map((event) => {
        const overdue = isOverdue(event.startsAt)
        const today = isToday(event.startsAt)
        return (
          <Item
            key={event.id}
            highlight={overdue}
            leading={<DateTile date={toDateKey(event.startsAt)} urgent={today || overdue} />}
            title={
              <span className="inline-flex items-center gap-1.5">
                <PatientHealthSubcategoryDot subcategory={event.healthSubcategory} />
                {event.patientName}
              </span>
            }
            tags={overdue ? <Chip tone="red">Vencido</Chip> : today ? <Chip tone="red">Hoy</Chip> : undefined}
            meta={`${formatAgendaTime(event.startsAt)} · ${event.title} · ${event.detail}`}
            onOpen={() => onSelect(event)}
            openLabel={`Abrir seguimiento de ${event.patientName}`}
          />
        )
      })}
    </div>
  )
}

function SurveyPendingList({
  config,
  query,
}: {
  config: (typeof SURVEY_TABS)[number]
  query: { data?: PendingSurvey[]; isLoading: boolean; isError: boolean }
}) {
  const navigate = useNavigate()
  const [registering, setRegistering] = useState<string | null>(null)
  const pending = query.data ?? []

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-zinc-500">{config.description}</p>
        <CopySurveyScript type={config.type} allowTypeChange={false} />
      </div>
      {query.isLoading ? (
        <p className="py-4 text-[13px] text-zinc-500">Cargando encuestas pendientes…</p>
      ) : query.isError ? (
        <InlineAlert>No se pudieron cargar las encuestas pendientes. Recarga la página para intentar de nuevo.</InlineAlert>
      ) : pending.length === 0 ? (
        <EmptyState title={config.emptyTitle} body={config.emptyBody} />
      ) : (
        <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {pending.map((item) => (
            <Item
              key={item.patientId}
              title={item.fullName}
              meta={[
                item.documentNumber ?? "Sin documento",
                item.primaryPhone,
                item.detail,
              ]
                .filter(Boolean)
                .join(" · ")}
              onOpen={() => navigate(patientTabUrl(item.patientId, "resumen"))}
              openLabel={`Abrir ficha de ${item.fullName}`}
              actions={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <CopySurveyScript type={config.type} patientId={item.patientId} allowTypeChange={false} />
                  <Button onClick={() => setRegistering(item.patientId)}>Registrar</Button>
                </div>
              }
            />
          ))}
        </div>
      )}
      <RegisterSurveyDialog
        key={`${config.type}-${registering ?? "cerrado"}`}
        open={Boolean(registering)}
        onOpenChange={(open) => !open && setRegistering(null)}
        patientId={registering ?? undefined}
        defaultType={config.type}
        lockType
      />
    </div>
  )
}
