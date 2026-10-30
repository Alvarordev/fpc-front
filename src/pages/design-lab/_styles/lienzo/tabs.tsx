import { useState } from "react"
import {
  BellRing,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileImage,
  FileText,
  HeartHandshake,
  History,
  Home,
  Mail,
  MessageSquareText,
  Phone,
  Upload,
  UserPlus,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  attemptsLabel,
  capitalize,
  dateTone,
  deliveryStatus,
  followUpStatus,
  initials,
  longDate,
  pastFollowUps,
  psychoStatus,
  relativeDay,
  shortDate,
  upcomingFollowUps,
  weekday,
  type FollowUp,
  type MockPatient,
} from "../../_data/mock-patient"
import { Chip, Empty, GhostButton, IconTile, InsetRow, Panel, PrimaryButton, Segments } from "./ui"

function DateTile({ iso }: { iso: string }) {
  const tone = dateTone(iso)
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 flex-col items-center justify-center rounded-[12px] bg-white leading-none ring-1",
        tone === "red" ? "text-red-600 ring-red-200" : "text-zinc-800 ring-zinc-200",
      )}
    >
      <span className="text-[15px] font-semibold tabular-nums">{iso.slice(8).replace(/^0/, "")}</span>
      <span className="mt-0.5 text-[11px] text-zinc-500">{shortDate(iso).split(" ")[1]}</span>
    </span>
  )
}

export function LienzoSeguimiento({ patient }: { patient: MockPatient }) {
  const [view, setView] = useState("proximos")
  const upcoming = upcomingFollowUps(patient)
  const past = pastFollowUps(patient)
  const completed = patient.followUps.filter((f) => f.status === "DONE").length
  if (!patient.followUps.length) {
    return (
      <Panel>
        <Empty icon={CalendarPlus} title="Sin seguimientos" body="Agenda el primer seguimiento y elige su tipo: llamada, visita o mensaje." action="Agendar seguimiento" />
      </Panel>
    )
  }
  const list = view === "proximos" ? upcoming : past
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={CalendarClock} label="Pendientes" value={upcoming.length} hint={upcoming[0] ? `El próximo ${relativeDay(upcoming[0].date)}` : "Ninguno"} />
        <Stat icon={CheckCircle2} label="Completados" value={completed} hint={`De ${patient.followUps.length} registrados`} />
        <Stat icon={History} label="Último contacto" value={past[0] ? shortDate(past[0].date) : "Ninguno"} hint={past[0] ? relativeDay(past[0].date) : ""} />
      </div>
      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Segments
            value={view}
            onChange={setView}
            options={[
              { id: "proximos", label: `Próximos ${upcoming.length}`, icon: CalendarClock },
              { id: "historial", label: `Historial ${past.length}`, icon: History },
            ]}
          />
          <div className="ml-auto">
            <PrimaryButton icon={CalendarPlus}>Agendar seguimiento</PrimaryButton>
          </div>
        </div>
        <div key={view} className="space-y-2 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
          {list.length ? list.map((f) => <FollowUpRow key={f.id} item={f} />) : <p className="py-6 text-center text-sm text-zinc-500">Nada en esta lista.</p>}
        </div>
      </Panel>
    </div>
  )
}

function FollowUpRow({ item }: { item: FollowUp }) {
  const status = followUpStatus[item.status]
  const isToday = relativeDay(item.date) === "hoy"
  return (
    <button className="group flex w-full items-start gap-3 rounded-[14px] bg-zinc-50 p-3 text-left ring-1 ring-zinc-200/60 transition-colors hover:bg-zinc-100">
      <DateTile iso={item.date} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{item.purpose}</span>
          <Chip tone={status.tone}>{status.label}</Chip>
          {isToday && <Chip tone="red">Hoy</Chip>}
        </span>
        <span className="mt-0.5 block text-[13px] text-zinc-500">
          {item.modality}, con {item.interlocutor.toLowerCase() === "paciente" ? "el paciente" : item.interlocutor}, {item.agent}
          {item.attempts > 0 && `, ${attemptsLabel(item.attempts)}`}
        </span>
        {(item.note || item.result) && (
          <span className="mt-2 flex gap-2 text-[13px] text-zinc-700">
            <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
            {[item.result, item.note].filter(Boolean).join(". ")}
          </span>
        )}
      </span>
      <ChevronRight className="mt-3 size-4 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

function Stat({ icon, label, value, hint }: { icon: typeof Clock; label: string; value: React.ReactNode; hint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-white p-4 ring-1 ring-zinc-200/70">
      <IconTile icon={icon} />
      <div>
        <p className="text-[13px] text-zinc-500">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        <p className="text-[13px] text-zinc-500">{hint}</p>
      </div>
    </div>
  )
}

export function LienzoPsico({ patient }: { patient: MockPatient }) {
  const { cycle, sessions } = patient.psycho
  if (!sessions.length) {
    return (
      <Panel>
        <Empty icon={HeartHandshake} title="Sin sesiones de psicooncología" body="Agenda una sesión con un voluntario para el paciente o un familiar." action="Agendar sesión" />
      </Panel>
    )
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      {cycle && (
        <Panel title={`Ciclo ${cycle.number}`} description={`Iniciado el ${longDate(cycle.startedOn)}`} className="lg:self-start">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-semibold tabular-nums">{cycle.done}</span>
            <span className="pb-1 text-sm text-zinc-500">de {cycle.total} sesiones realizadas</span>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-1">
            {Array.from({ length: cycle.total }, (_, i) => (
              <span key={i} className={cn("h-2 rounded-full", i < cycle.done ? "bg-zinc-900" : "bg-zinc-200")} />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <InsetRow icon={Users} title="Mariela Quispe" subtitle="Voluntaria a cargo" />
          </div>
          <div className="mt-4 flex gap-2">
            <GhostButton>Cerrar ciclo</GhostButton>
          </div>
        </Panel>
      )}
      <Panel title="Sesiones" action={<PrimaryButton icon={CalendarPlus}>Agendar sesión</PrimaryButton>}>
        <div className="space-y-2">
          {sessions.map((s) => {
            const st = psychoStatus[s.status]
            return (
              <div key={s.id} className="flex items-start gap-3 rounded-[14px] bg-zinc-50 p-3 ring-1 ring-zinc-200/60">
                <DateTile iso={s.date} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">Sesión {s.number}</span>
                    <Chip tone={st.tone}>{st.label}</Chip>
                  </div>
                  <p className="text-[13px] text-zinc-500">
                    {capitalize(weekday(s.date))} a las {s.time}, {s.beneficiary}, con {s.volunteer}
                  </p>
                  {s.note && <p className="mt-1.5 text-[13px] text-zinc-700">{s.note}</p>}
                </div>
                {s.status === "SCHEDULED" && <GhostButton icon={Clock}>Reprogramar</GhostButton>}
                {s.status === "NO_SHOW" && <GhostButton icon={CheckCircle2}>Marcar gestionada</GhostButton>}
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

export function LienzoRecordatorios({ patient }: { patient: MockPatient }) {
  const upcoming = patient.reminders.filter((r) => !r.done)
  const done = patient.reminders.filter((r) => r.done)
  if (!patient.reminders.length) {
    return (
      <Panel>
        <Empty icon={BellRing} title="Sin recordatorios" body="Registra una cita médica y elige cuándo y cómo avisarle." action="Crear recordatorio" />
      </Panel>
    )
  }
  return (
    <div className="space-y-4">
      <Panel title="Próximos" description="Se envían automáticamente según la anticipación elegida" action={<PrimaryButton icon={BellRing}>Crear recordatorio</PrimaryButton>}>
        <div className="grid gap-2 lg:grid-cols-2">
          {upcoming.map((r) => (
            <div key={r.id} className="rounded-[14px] bg-zinc-50 p-3 ring-1 ring-zinc-200/60">
              <div className="flex items-start gap-3">
                <DateTile iso={r.date} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-[13px] text-zinc-500">
                    {capitalize(relativeDay(r.date))} a las {r.time}, {r.place}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200/70 pt-3 text-[13px] text-zinc-600">
                <Chip>{r.kind}</Chip>
                <span>
                  Aviso por {r.channel.toLowerCase()}, {r.lead}
                </span>
                <span className="ml-auto">
                  <Chip tone={deliveryStatus[r.delivery].tone}>{deliveryStatus[r.delivery].label}</Chip>
                </span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Anteriores">
        <div className="space-y-2">
          {done.map((r) => (
            <InsetRow
              key={r.id}
              icon={BellRing}
              title={r.title}
              subtitle={`${longDate(r.date)}, por ${r.channel.toLowerCase()}`}
              trailing={<Chip tone={deliveryStatus[r.delivery].tone}>{deliveryStatus[r.delivery].label}</Chip>}
            />
          ))}
        </div>
      </Panel>
    </div>
  )
}

export function LienzoAcompanantes({ patient }: { patient: MockPatient }) {
  if (!patient.companions.length) {
    return (
      <Panel>
        <Empty icon={Users} title="Sin acompañantes" body="Registra a la familia o personas cercanas que lo apoyan." action="Agregar acompañante" />
      </Panel>
    )
  }
  return (
    <Panel title="Acompañantes" description="Personas que apoyan al paciente" action={<PrimaryButton icon={UserPlus}>Agregar acompañante</PrimaryButton>}>
      <div className="grid gap-3 lg:grid-cols-2">
        {patient.companions.map((c) => (
          <div key={c.id} className="rounded-[16px] bg-zinc-50 p-4 ring-1 ring-zinc-200/60">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-white text-sm font-semibold ring-1 ring-zinc-200">{initials(c.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="text-[13px] text-zinc-500">{c.relationship}</p>
              </div>
              {c.isPrimary && <Chip tone="blue">Contacto principal</Chip>}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <InsetRow icon={Phone} title={c.phone} subtitle="Celular" />
              <InsetRow icon={Mail} title={c.email ?? "Sin correo"} subtitle={c.document ?? "Sin documento"} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500">
              {c.talks.length ? (
                <>
                  Charlas de interés: {c.talks.map((t) => <Chip key={t} tone="violet">{t}</Chip>)}
                </>
              ) : (
                "Sin interés en charlas registrado"
              )}
            </div>
            {c.alsoAccompanies && <p className="mt-2 text-[13px] text-zinc-500">También acompaña a {c.alsoAccompanies}.</p>}
            <div className="mt-3 flex gap-2">
              <GhostButton icon={Home}>Editar datos</GhostButton>
              <GhostButton icon={UserPlus}>Enrolar como paciente</GhostButton>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function LienzoDocumentos({ patient }: { patient: MockPatient }) {
  return (
    <Panel title="Documentos clínicos" description="Informes, recetas y referencias del paciente">
      <button className="flex w-full flex-col items-center rounded-[16px] border border-dashed border-zinc-300 bg-zinc-50/60 px-6 py-6 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-50">
        <IconTile icon={Upload} />
        <span className="mt-2 text-sm font-medium">Arrastra un archivo o haz clic para subirlo</span>
        <span className="text-[13px] text-zinc-500">PDF o imagen, máximo 10 MB</span>
      </button>
      {patient.documents.length ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {patient.documents.map((d) => (
            <div key={d.id} className="group flex items-center gap-3 rounded-[14px] bg-zinc-50 p-3 ring-1 ring-zinc-200/60">
              <IconTile icon={d.type === "pdf" ? FileText : FileImage} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="truncate text-[13px] text-zinc-500">
                  {d.category}, {d.linkedTo}, {d.size}
                </p>
                <p className="text-[12px] text-zinc-400">
                  {d.uploadedBy}, {shortDate(d.date)}
                </p>
              </div>
              <div className="flex gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                <IconButton icon={Eye} label="Ver" />
                <IconButton icon={Download} label="Descargar" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-zinc-500">Todavía no hay documentos.</p>
      )}
    </Panel>
  )
}

function IconButton({ icon: Icon, label }: { icon: typeof Eye; label: string }) {
  return (
    <button aria-label={label} title={label} className="flex size-8 items-center justify-center rounded-[9px] text-zinc-600 transition-colors hover:bg-white hover:ring-1 hover:ring-zinc-200">
      <Icon className="size-4" />
    </button>
  )
}
