import { useState } from "react"
import { CalendarClock, CheckCircle2, Fingerprint, History, MapPin, Phone } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TABS,
  capitalize,
  initials,
  longDate,
  pastFollowUps,
  relativeDay,
  shortDate,
  tabCount,
  upcomingFollowUps,
  type LabState,
  type MockPatient,
  type TabId,
} from "../../_data/mock-patient"
import { Chip, MetaTag } from "@/components/ds/badge"
import { AddButton, Button } from "@/components/ds/button"
import { Card } from "@/components/ds/card"
import { CopyValue } from "@/components/ds/copy-value"
import { EmptyState } from "@/components/ds/empty-state"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { InlineAlert } from "@/components/ds/inline-alert"
import { SlidingTabs } from "@/components/ds/sliding-tabs"
import { StatTile } from "@/components/ds/stat-tile"
import { ActivityCard } from "./activity-card"
import { ComorbiditiesCard, DiagnosesCard, TreatmentsCard } from "./health"
import {
  CaseSummaryCard,
  ChangeLogCard,
  ComplementaryCard,
  ContactCard,
  JourneyCard,
  OriginCard,
  PersonalDataCard,
  ReferralsCard,
  SocioCard,
  SurveysCard,
} from "./summary"
import { AcompanantesTab, DocumentosTab, FollowUpItem, PsicoTab, RecordatoriosTab } from "./tabs"

// Síntesis: la cabecera y la tipografía de Tablero con las pestañas de gestión
// de Lienzo. Un solo fondo; las secciones se eligen con pestañas deslizantes.

export function SintesisStyle({ patient, state, initialTab = "resumen" }: { patient: MockPatient; state: LabState; initialTab?: TabId }) {
  const [tab, setTab] = useState<TabId>(initialTab)
  if (state === "loading") return <SintesisSkeleton />
  return (
    <div className="font-ds min-h-full bg-[#f6f6f6] text-zinc-900">
      <div className="mx-auto max-w-[1360px] space-y-4 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-zinc-500">Ficha del paciente</p>
            <h1 className="text-xl font-semibold tracking-tight">{TABS.find((t) => t.id === tab)!.label}</h1>
          </div>
          <SlidingTabs label="Secciones de la ficha" value={tab} onChange={setTab} options={TABS.map((t) => ({ id: t.id, label: t.label, count: tabCount(patient, t.id) }))} />
        </div>

        <Identity patient={patient} />

        <div key={tab} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
          {tab === "resumen" && <Resumen patient={patient} />}
          {tab === "seguimiento" && <Seguimiento patient={patient} />}
          {tab === "psicooncologia" && <PsicoTab patient={patient} />}
          {tab === "recordatorios" && <RecordatoriosTab patient={patient} />}
          {tab === "acompanantes" && <AcompanantesTab patient={patient} />}
          {tab === "documentos" && <DocumentosTab patient={patient} />}
        </div>
      </div>
    </div>
  )
}

function Identity({ patient }: { patient: MockPatient }) {
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-[20px] border border-zinc-200 bg-white p-4">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">{initials(patient.fullName)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{patient.fullName}</h2>
          <Chip tone={patient.status === "ENROLLED" ? "green" : "violet"}>{patient.status === "ENROLLED" ? "Enrolado" : "Prospecto"}</Chip>
          <Chip>{patient.activity === "ACTIVE" ? "Activo" : "Inactivo"}</Chip>
          {patient.health.subcategory && <Chip tone="blue">{patient.health.subcategory}</Chip>}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <MetaTag icon={Fingerprint}>{patient.document}</MetaTag>
          <MetaTag icon={Phone}>
            <CopyValue value={patient.phone} label="Celular" />
          </MetaTag>
          <MetaTag icon={MapPin}>{patient.addresses[0]?.district ?? "Sin dirección"}</MetaTag>
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">
          {patient.enrolledOn ? `En SEPA desde el ${longDate(patient.enrolledOn)}` : "Aún no se enrola"}, a cargo de {patient.agent}
        </p>
      </div>
      <div className="flex gap-2">
        <Button>Editar datos</Button>
        <AddButton>{patient.status === "ENROLLED" ? "Agendar seguimiento" : "Enrolar"}</AddButton>
      </div>
      {patient.alerts.map((a) => (
        <InlineAlert key={a.id} aside={`Abierta ${relativeDay(a.since)}`}>
          {a.title}
        </InlineAlert>
      ))}
    </section>
  )
}

function Resumen({ patient }: { patient: MockPatient }) {
  return (
    <div className="space-y-4">
      <CaseSummaryCard patient={patient} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <ActivityCard patient={patient} />
        <PersonalDataCard patient={patient} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <DiagnosesCard patient={patient} />
        <TreatmentsCard patient={patient} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ComorbiditiesCard patient={patient} />
        <ContactCard patient={patient} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <OriginCard patient={patient} />
        <SocioCard patient={patient} />
        <ComplementaryCard patient={patient} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <ReferralsCard patient={patient} />
        <JourneyCard patient={patient} />
        <SurveysCard patient={patient} />
      </div>
      <ChangeLogCard patient={patient} />
    </div>
  )
}

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "proximos", label: "Próximos" },
  { id: "completados", label: "Completados" },
  { id: "no-contactados", label: "No contactados" },
] as const

type Filter = (typeof FILTERS)[number]["id"]

function Seguimiento({ patient }: { patient: MockPatient }) {
  const [filter, setFilter] = useState<Filter>("todos")
  const upcoming = upcomingFollowUps(patient)
  const past = pastFollowUps(patient)
  if (!patient.followUps.length) {
    return (
      <Card>
        <EmptyState title="Sin seguimientos" body="Agenda el primero y asígnale un tipo: llamada, visita domiciliaria o mensaje." action="Agendar seguimiento" />
      </Card>
    )
  }
  // Orden cronológico único, de la fecha más lejana a la más antigua: el de hoy
  // queda en su lugar y se distingue por el resaltado, no por la posición.
  const all = [...patient.followUps].sort((a, b) => b.date.localeCompare(a.date))
  const matches = (id: Filter) =>
    all.filter((f) => {
      if (id === "proximos") return f.status === "PENDING" || f.status === "SCHEDULED"
      if (id === "completados") return f.status === "DONE"
      if (id === "no-contactados") return f.status === "NOT_REACHED"
      return true
    })
  const list = matches(filter)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile icon={CalendarClock} label="Pendientes" value={upcoming.length} hint={upcoming[0] ? `El próximo ${relativeDay(upcoming[0].date)}` : "Ninguno"} />
        <StatTile icon={CheckCircle2} label="Completados" value={patient.followUps.filter((f) => f.status === "DONE").length} hint={`De ${patient.followUps.length} registrados`} />
        <StatTile icon={History} label="Último contacto" value={past[0] ? shortDate(past[0].date) : "Ninguno"} hint={past[0] ? capitalize(relativeDay(past[0].date)) : ""} />
      </div>
      <Card title="Seguimientos" action={<AddButton>Agendar seguimiento</AddButton>}>
        <div className="mb-4">
          <FilterToggles value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ id: f.id, label: f.label, count: matches(f.id).length }))} />
        </div>
        <div key={filter} className="space-y-2 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
          {list.length ? list.map((f) => <FollowUpItem key={f.id} item={f} />) : <p className="py-6 text-center text-[13px] text-zinc-500">No hay seguimientos con este filtro.</p>}
        </div>
      </Card>
    </div>
  )
}

function SintesisSkeleton() {
  return (
    <div className="min-h-full bg-[#f6f6f6]">
      <div className="mx-auto max-w-[1360px] space-y-4 px-6 py-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48 bg-zinc-200" />
          <Skeleton className="h-10 w-[640px] max-w-[50%] rounded-[14px] bg-zinc-200" />
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
