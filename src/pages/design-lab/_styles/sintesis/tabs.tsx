import { CheckCircle2, Clock, Download, Eye, FileImage, FileText, MessageSquareText, Pencil, Upload, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  attemptsLabel,
  capitalize,
  channelText,
  daysFromToday,
  deliveryStatus,
  followUpStatus,
  initials,
  longDate,
  psychoStatus,
  relativeDay,
  shortDate,
  weekday,
  type FollowUp,
  type MockPatient,
} from "../../_data/mock-patient"
import { Chip } from "@/components/ds/badge"
import { AddButton, Button, IconButton } from "@/components/ds/button"
import { Card, Item } from "@/components/ds/card"
import { CopyValue } from "@/components/ds/copy-value"
import { DateTile } from "@/components/ds/date-tile"
import { EmptyState } from "@/components/ds/empty-state"
import { SegmentedProgress } from "@/components/ds/progress"

// Pestañas de gestión, tomadas de Lienzo: cada registro es una tarjeta que se
// abre, con su estado y la acción que corresponde a la vista.

export function FollowUpItem({ item }: { item: FollowUp }) {
  const status = followUpStatus[item.status]
  const today = relativeDay(item.date) === "hoy"
  const who = item.interlocutor.toLowerCase() === "paciente" ? "el paciente" : item.interlocutor
  return (
    <Item
      highlight={today}
      leading={<DateTile date={item.date} urgent={daysFromToday(item.date) === 0} />}
      title={item.purpose}
      tags={
        <>
          <Chip tone={status.tone}>{status.label}</Chip>
          {today && <Chip tone="red">Hoy</Chip>}
        </>
      }
      meta={`${item.modality} con ${who}, ${item.agent}${item.attempts ? `, ${attemptsLabel(item.attempts)}` : ""}`}
      body={
        (item.note || item.result) && (
          <span className="flex gap-2">
            <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
            {[item.result, item.note].filter(Boolean).join(". ")}
          </span>
        )
      }
      footer={
        today ? (
          <>
            <Button variant="brand">Registrar resultado</Button>
            <Button>Reprogramar</Button>
          </>
        ) : undefined
      }
      onOpen={() => undefined}
    />
  )
}

export function PsicoTab({ patient }: { patient: MockPatient }) {
  const { cycle, sessions } = patient.psycho
  if (!sessions.length) {
    return (
      <Card>
        <EmptyState title="Sin sesiones de psicooncología" body="Agenda una sesión con un voluntario para el paciente o un familiar." action="Agendar sesión" />
      </Card>
    )
  }
  const noShow = sessions.find((s) => s.status === "NO_SHOW")
  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      {cycle && (
        <Card title={`Ciclo ${cycle.number}`} description={`Iniciado el ${longDate(cycle.startedOn)}`} className="lg:self-start">
          <p className="flex items-baseline gap-2">
            <span className="text-[28px] leading-none font-semibold tabular-nums">{cycle.done}</span>
            <span className="text-[13px] text-zinc-500">de {cycle.total} sesiones realizadas</span>
          </p>
          <div className="mt-3">
            <SegmentedProgress done={cycle.done} total={cycle.total} />
          </div>
          <div className="mt-5 border-t border-zinc-100 pt-4">
            <p className="text-[13px] text-zinc-500">Voluntaria a cargo</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold">{initials(sessions[0].volunteer)}</span>
              <span>
                <span className="block text-sm font-medium">{sessions[0].volunteer}</span>
                <span className="block text-[13px] text-zinc-500">Psicooncología</span>
              </span>
            </div>
          </div>
          <div className="mt-5">
            <Button>Cerrar ciclo</Button>
          </div>
        </Card>
      )}
      <Card
        title="Sesiones"
        description={noShow ? `Faltó a la sesión ${noShow.number}: gestiona la inasistencia antes de seguir` : undefined}
        action={<AddButton>Agendar sesión</AddButton>}
      >
        <div className="space-y-2">
          {sessions.map((s) => {
            const st = psychoStatus[s.status]
            return (
              <Item
                key={s.id}
                leading={<DateTile date={s.date} urgent={daysFromToday(s.date) === 0} />}
                title={`Sesión ${s.number}`}
                tags={<Chip tone={st.tone}>{st.label}</Chip>}
                meta={`${capitalize(weekday(s.date))} a las ${s.time}, ${s.beneficiary}`}
                body={s.note}
                actions={
                  s.status === "SCHEDULED" ? (
                    <Button icon={Clock}>Reprogramar</Button>
                  ) : s.status === "NO_SHOW" ? (
                    <Button icon={CheckCircle2}>Marcar gestionada</Button>
                  ) : undefined
                }
                onOpen={() => undefined}
              />
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export function RecordatoriosTab({ patient }: { patient: MockPatient }) {
  const upcoming = patient.reminders.filter((r) => !r.done)
  const done = patient.reminders.filter((r) => r.done)
  if (!patient.reminders.length) {
    return (
      <Card>
        <EmptyState title="Sin recordatorios" body="Registra una cita médica y elige cuándo y por dónde avisarle." action="Crear recordatorio" />
      </Card>
    )
  }
  return (
    <div className="space-y-4">
      <Card title="Próximos" description="Se envían solos según la anticipación elegida" action={<AddButton>Crear recordatorio</AddButton>}>
        {upcoming.length ? (
          <div className="grid gap-2 lg:grid-cols-2">
            {upcoming.map((r) => (
              <div key={r.id} className="rounded-[14px] bg-zinc-50 p-3 ring-1 ring-zinc-200/60">
                <div className="flex items-start gap-3">
                  <DateTile date={r.date} urgent={daysFromToday(r.date) === 0} />
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
                    Aviso por {channelText(r.channel)}, {r.lead}
                  </span>
                  <span className="ml-auto">
                    <Chip tone={deliveryStatus[r.delivery].tone}>{deliveryStatus[r.delivery].label}</Chip>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-zinc-500">No hay recordatorios por enviar.</p>
        )}
      </Card>
      <Card title="Anteriores">
        <div className="space-y-2">
          {done.map((r) => (
            <Item
              key={r.id}
              leading={<DateTile date={r.date} urgent={daysFromToday(r.date) === 0} />}
              title={r.title}
              tags={<Chip tone={deliveryStatus[r.delivery].tone}>{deliveryStatus[r.delivery].label}</Chip>}
              meta={`${r.kind}, ${r.place}, por ${channelText(r.channel)}`}
              actions={r.delivery === "FAILED" ? <Button>Reenviar</Button> : undefined}
              onOpen={() => undefined}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

export function AcompanantesTab({ patient }: { patient: MockPatient }) {
  if (!patient.companions.length) {
    return (
      <Card>
        <EmptyState title="Sin acompañantes" body="Registra a la familia o personas cercanas que lo apoyan. Si ya acompaña a otro paciente, búscalo por documento." action="Agregar acompañante" />
      </Card>
    )
  }
  return (
    <Card title="Acompañantes" description="Familia y personas que apoyan al paciente" action={<AddButton>Agregar acompañante</AddButton>}>
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
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
              <div>
                <dt className="text-zinc-500">Celular</dt>
                <dd className="font-medium">
                  <CopyValue value={c.phone} label="Celular" />
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Documento</dt>
                <dd className="font-medium">{c.document ?? "Sin registrar"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-zinc-500">Correo</dt>
                <dd className="font-medium">{c.email ? <CopyValue value={c.email} label="Correo" /> : "Sin registrar"}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500">
              {c.talks.length ? (
                <>
                  Charlas de interés:
                  {c.talks.map((t) => (
                    <Chip key={t} tone="violet">
                      {t}
                    </Chip>
                  ))}
                </>
              ) : (
                "Sin interés en charlas registrado"
              )}
            </div>
            {c.alsoAccompanies && <p className="mt-2 text-[13px] text-zinc-500">También acompaña a {c.alsoAccompanies}.</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button icon={Pencil}>Editar datos</Button>
              <Button>Registrar charla</Button>
              <Button icon={UserPlus}>Enrolar como paciente</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function DocumentosTab({ patient }: { patient: MockPatient }) {
  return (
    <Card title="Documentos clínicos" description="Informes, recetas y referencias del paciente">
      <button className="flex w-full flex-col items-center rounded-[16px] border border-dashed border-zinc-300 bg-zinc-50/60 px-6 py-6 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-50">
        <Upload className="size-5 text-zinc-500" />
        <span className="mt-2 text-sm font-medium">Arrastra un archivo o haz clic para subirlo</span>
        <span className="text-[13px] text-zinc-500">PDF o imagen, máximo 10 MB</span>
      </button>
      {patient.documents.length ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {patient.documents.map((d) => (
            <Item
              key={d.id}
              leading={
                <span className={cn("flex size-11 items-center justify-center rounded-[12px] ring-1", d.type === "pdf" ? "bg-red-50 text-red-600 ring-red-100" : "bg-sky-50 text-sky-600 ring-sky-100")}>
                  {d.type === "pdf" ? <FileText className="size-5" /> : <FileImage className="size-5" />}
                </span>
              }
              title={d.name}
              tags={<Chip>{d.category}</Chip>}
              meta={`${d.linkedTo}, ${d.size}`}
              body={<span className="text-zinc-500">{d.uploadedBy}, {shortDate(d.date)}</span>}
              actions={
                <>
                  <IconButton icon={Eye} label="Previsualizar" />
                  <IconButton icon={Download} label="Descargar" />
                </>
              }
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-center text-[13px] text-zinc-500">Todavía no hay documentos.</p>
      )}
    </Card>
  )
}
