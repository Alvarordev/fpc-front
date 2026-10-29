import { useState } from "react"
import {
  AlertTriangle,
  BellRing,
  CalendarPlus,
  FolderOpen,
  HeartHandshake,
  LayoutGrid,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  TABS,
  capitalize,
  initials,
  relativeDay,
  tabCount,
  upcomingFollowUps,
  type LabState,
  type MockPatient,
  type TabId,
} from "../../_data/mock-patient"
import { Chip } from "./ui"
import { LienzoResumen } from "./resumen"
import { LienzoAcompanantes, LienzoDocumentos, LienzoPsico, LienzoRecordatorios, LienzoSeguimiento } from "./tabs"

// Lienzo: una consola tranquila. La ficha tiene su propio índice lateral, como
// una sección de configuración, y cada pestaña vive en paneles con filas internas.

const ICONS: Record<TabId, LucideIcon> = {
  resumen: LayoutGrid,
  seguimiento: ListChecks,
  psicooncologia: HeartHandshake,
  recordatorios: BellRing,
  acompanantes: Users,
  documentos: FolderOpen,
}

const DESCRIPTIONS: Record<TabId, string> = {
  resumen: "Quién es, su salud y su recorrido en el programa",
  seguimiento: "Contactos agendados y registrados con el paciente",
  psicooncologia: "Ciclos y sesiones de apoyo emocional",
  recordatorios: "Avisos de citas y tratamientos",
  acompanantes: "Familia y personas que lo apoyan",
  documentos: "Archivos clínicos del paciente",
}

export function LienzoStyle({ patient, state, initialTab = "resumen" }: { patient: MockPatient; state: LabState; initialTab?: TabId }) {
  const [tab, setTab] = useState<TabId>(initialTab)
  if (state === "loading") return <LienzoSkeleton />
  return (
    <div style={{ fontFamily: "var(--font-geist-sans)" }} className="min-h-full bg-zinc-100 p-3 text-zinc-900 sm:p-5">
      <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[264px_minmax(0,1fr)]">
        <Sidebar patient={patient} tab={tab} onTab={setTab} />
        <main className="min-w-0 space-y-4">
          <header className="flex flex-wrap items-end gap-3 px-1 pt-1">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-semibold tracking-tight">{TABS.find((t) => t.id === tab)!.label}</h2>
              <p className="text-sm text-zinc-500">{DESCRIPTIONS[tab]}</p>
            </div>
          </header>
          {patient.alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-[16px] bg-red-50 px-4 py-3 text-sm text-red-900 ring-1 ring-red-200/70">
              <AlertTriangle className="size-4 shrink-0 text-red-600" />
              <span className="flex-1">{a.title}</span>
              <span className="text-[13px] text-red-700/80">Abierta {relativeDay(a.since)}</span>
            </div>
          ))}
          <div key={tab} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
            {tab === "resumen" && <LienzoResumen patient={patient} />}
            {tab === "seguimiento" && <LienzoSeguimiento patient={patient} />}
            {tab === "psicooncologia" && <LienzoPsico patient={patient} />}
            {tab === "recordatorios" && <LienzoRecordatorios patient={patient} />}
            {tab === "acompanantes" && <LienzoAcompanantes patient={patient} />}
            {tab === "documentos" && <LienzoDocumentos patient={patient} />}
          </div>
        </main>
      </div>
    </div>
  )
}

function Sidebar({ patient, tab, onTab }: { patient: MockPatient; tab: TabId; onTab: (t: TabId) => void }) {
  const next = upcomingFollowUps(patient)[0]
  return (
    <aside className="flex flex-col gap-4 rounded-[24px] bg-zinc-50 p-3 ring-1 ring-zinc-200/70 lg:sticky lg:top-[calc(var(--lab-bar)+20px)] lg:self-start">
      <div className="rounded-[18px] bg-white p-4 ring-1 ring-zinc-200/70">
        <div className="flex items-start justify-between">
          <span className="flex size-12 items-center justify-center rounded-[14px] bg-zinc-900 text-base font-semibold text-white">{initials(patient.fullName)}</span>
          <div className="flex gap-1">
            <SmallIcon icon={Pencil} label="Editar datos" />
            <SmallIcon icon={MoreHorizontal} label="Más acciones" />
          </div>
        </div>
        <h1 className="mt-3 text-[17px] leading-snug font-semibold">{patient.fullName}</h1>
        <p className="text-[13px] text-zinc-500">
          {patient.document}, {patient.age} años
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip tone={patient.status === "ENROLLED" ? "green" : "violet"}>{patient.status === "ENROLLED" ? "Enrolado" : "Prospecto"}</Chip>
          <Chip tone="gray">{patient.activity === "ACTIVE" ? "Activo" : "Inactivo"}</Chip>
          {patient.health.subcategory && <Chip tone="blue">{patient.health.subcategory}</Chip>}
        </div>
      </div>

      <nav aria-label="Secciones de la ficha">
        <p className="px-3 pb-1.5 text-[13px] font-medium text-zinc-500">Ficha</p>
        <ul className="space-y-0.5">
          {TABS.map((t) => {
            const Icon = ICONS[t.id]
            const count = tabCount(patient, t.id)
            const active = tab === t.id
            return (
              <li key={t.id}>
                <button
                  onClick={() => onTab(t.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-sm transition-[background-color,color]",
                    active ? "bg-zinc-200/70 font-medium text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={1.75} />
                  <span className="flex-1 text-left">{t.label}</span>
                  {count !== null && count > 0 && <span className="text-xs text-zinc-500 tabular-nums">{count}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-3">
        <p className="text-[13px] font-medium text-zinc-500">Agente a cargo</p>
        <p className="mt-0.5 text-sm">{patient.agent}</p>
      </div>

      <div className="rounded-[18px] bg-white p-4 ring-1 ring-zinc-200/70">
        {next ? (
          <>
            <p className="text-[13px] text-zinc-500">Próximo seguimiento</p>
            <p className="mt-0.5 text-sm font-semibold">{next.purpose}</p>
            <p className={cn("text-[13px]", relativeDay(next.date) === "hoy" ? "font-medium text-red-600" : "text-zinc-500")}>
              {capitalize(relativeDay(next.date))}, {next.modality.toLowerCase()}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold">Sin seguimientos agendados</p>
            <p className="text-[13px] text-zinc-500">{patient.status === "ENROLLED" ? "Agenda el siguiente contacto." : "Enrólalo para empezar."}</p>
          </>
        )}
        <button className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-red-700 text-sm font-medium text-white transition-[background-color,transform] hover:bg-red-800 active:scale-[0.98]">
          <CalendarPlus className="size-4" />
          {patient.status === "ENROLLED" ? "Agendar seguimiento" : "Enrolar"}
        </button>
      </div>
    </aside>
  )
}

function SmallIcon({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button aria-label={label} title={label} className="flex size-8 items-center justify-center rounded-[9px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
      <Icon className="size-4" />
    </button>
  )
}

function LienzoSkeleton() {
  return (
    <div className="min-h-full bg-zinc-100 p-5">
      <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[264px_minmax(0,1fr)]">
        <div className="space-y-3 rounded-[24px] bg-zinc-50 p-3 ring-1 ring-zinc-200/70">
          <Skeleton className="h-36 rounded-[18px] bg-white" />
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 rounded-[12px] bg-zinc-200/60" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-72 bg-zinc-200/70" />
          <Skeleton className="h-28 rounded-[20px] bg-white" />
          <div className="grid gap-4 xl:grid-cols-2">
            <Skeleton className="h-56 rounded-[20px] bg-white" />
            <Skeleton className="h-56 rounded-[20px] bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
