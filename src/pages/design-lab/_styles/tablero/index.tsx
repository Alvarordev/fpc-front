import { useState } from "react"
import { AlertTriangle, Fingerprint, MapPin, Phone } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  TABS,
  capitalize,
  daysInProgram,
  initials,
  longDate,
  relativeDay,
  upcomingFollowUps,
  type LabState,
  type MockPatient,
  type TabId,
} from "../../_data/mock-patient"
import { Kpi, Pill } from "./ui"
import { TableroResumen } from "./resumen"
import { TableroAcompanantes, TableroDocumentos, TableroPsico, TableroRecordatorios, TableroSeguimiento } from "./tabs"

// Tablero: la ficha como panel de cliente de un CRM. Identidad y cifras clave
// siempre visibles; las pestañas en píldoras y los registros en tablas.

const FONT = { fontFamily: '"Onest", ui-sans-serif, system-ui, sans-serif' }

export function TableroStyle({ patient, state, initialTab = "resumen" }: { patient: MockPatient; state: LabState; initialTab?: TabId }) {
  const [tab, setTab] = useState<TabId>(initialTab)
  if (state === "loading") return <TableroSkeleton />
  return (
    <div style={FONT} className="min-h-full bg-zinc-200/60 p-3 text-zinc-900 sm:p-6">
      <div className="mx-auto max-w-[1360px] space-y-4 rounded-[28px] bg-[#f6f6f6] p-4 ring-1 ring-zinc-200 sm:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-zinc-500">Ficha del paciente</p>
            <h1 className="text-xl font-semibold tracking-tight">Vista general</h1>
          </div>
          <nav className="flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Secciones de la ficha">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium transition-[background-color,color,transform] active:scale-[0.97]",
                  tab === t.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <Identity patient={patient} />
        <KpiRow patient={patient} onTab={setTab} />

        <div key={tab} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
          {tab === "resumen" && <TableroResumen patient={patient} onTab={setTab} />}
          {tab === "seguimiento" && <TableroSeguimiento patient={patient} />}
          {tab === "psicooncologia" && <TableroPsico patient={patient} />}
          {tab === "recordatorios" && <TableroRecordatorios patient={patient} />}
          {tab === "acompanantes" && <TableroAcompanantes patient={patient} />}
          {tab === "documentos" && <TableroDocumentos patient={patient} />}
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
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", patient.status === "ENROLLED" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700")}>
            {patient.status === "ENROLLED" ? "Enrolado" : "Prospecto"}
          </span>
          {patient.health.subcategory && <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">{patient.health.subcategory}</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-zinc-600">
          <Tag icon={Fingerprint}>{patient.document}</Tag>
          <Tag icon={Phone}>{patient.phone}</Tag>
          <Tag icon={MapPin}>{patient.addresses[0]?.district ?? "Sin dirección"}</Tag>
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">
          {patient.enrolledOn ? `En SEPA desde ${longDate(patient.enrolledOn)}` : "Aún no se enrola"}, a cargo de {patient.agent}
        </p>
      </div>
      <div className="flex gap-2">
        <Pill>Editar datos</Pill>
        <Pill dark>{patient.status === "ENROLLED" ? "Agendar seguimiento" : "Enrolar"}</Pill>
      </div>
      {patient.alerts.map((a) => (
        <div key={a.id} className="flex w-full items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-800">
          <AlertTriangle className="size-4 text-red-600" />
          <span className="flex-1">{a.title}</span>
          <span className="text-red-700/70">Abierta {relativeDay(a.since)}</span>
        </div>
      ))}
    </section>
  )
}

function Tag({ icon: Icon, children }: { icon: typeof Phone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-1.5 py-0.5">
      <Icon className="size-3 text-zinc-400" />
      {children}
    </span>
  )
}

function KpiRow({ patient, onTab }: { patient: MockPatient; onTab: (t: TabId) => void }) {
  const next = upcomingFollowUps(patient)[0]
  const treatment = patient.currentTreatments.find((t) => t.progress)
  const cycle = patient.psycho.cycle
  const pendingReminders = patient.reminders.filter((r) => !r.done)
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Próximo seguimiento"
        value={next ? capitalize(relativeDay(next.date)) : "Ninguno"}
        hint={next ? `${next.purpose}, ${next.modality.toLowerCase()}` : "Agenda el siguiente contacto"}
        hintTone={next && relativeDay(next.date) === "hoy" ? "red" : undefined}
        onOpen={() => onTab("seguimiento")}
      />
      <Kpi
        label="Tratamiento"
        value={treatment?.progress ? `${treatment.progress.done}/${treatment.progress.total}` : "Sin datos"}
        hint={treatment ? `Ciclos de ${treatment.name.toLowerCase()}` : "Sin tratamiento registrado"}
        onOpen={() => onTab("resumen")}
      />
      <Kpi
        label="Psicooncología"
        value={cycle ? `${cycle.done}/${cycle.total}` : "Sin ciclo"}
        hint={patient.psycho.sessions.some((s) => s.status === "NO_SHOW") ? "Faltó a una sesión" : "Sesiones del ciclo actual"}
        hintTone={patient.psycho.sessions.some((s) => s.status === "NO_SHOW") ? "red" : undefined}
        onOpen={() => onTab("psicooncologia")}
      />
      <Kpi
        label="Días en el programa"
        value={patient.enrolledOn ? daysInProgram(patient) : "0"}
        hint={pendingReminders.length ? `${pendingReminders.length} recordatorios por enviar` : "Sin recordatorios pendientes"}
        hintTone={pendingReminders.length ? undefined : "green"}
        onOpen={() => onTab("recordatorios")}
      />
    </div>
  )
}

function TableroSkeleton() {
  return (
    <div className="min-h-full bg-zinc-200/60 p-6">
      <div className="mx-auto max-w-[1360px] space-y-4 rounded-[28px] bg-[#f6f6f6] p-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48 bg-zinc-200" />
          <Skeleton className="h-9 w-[520px] max-w-[50%] rounded-full bg-zinc-200" />
        </div>
        <Skeleton className="h-24 rounded-[20px] bg-white" />
        <div className="grid gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-[20px] bg-white" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-[20px] bg-white" />
      </div>
    </div>
  )
}
