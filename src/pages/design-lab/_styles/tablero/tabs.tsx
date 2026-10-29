import { useState } from "react"
import { Download, Eye, FileImage, FileText, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  capitalize,
  deliveryStatus,
  followUpStatus,
  initials,
  pastFollowUps,
  psychoStatus,
  relativeDay,
  shortDate,
  upcomingFollowUps,
  type MockPatient,
} from "../../_data/mock-patient"
import { Card, Empty, Pill, Status, Table, Td } from "./ui"

const FILTERS = ["Todos", "Próximos", "Completados", "No contactados"] as const

export function TableroSeguimiento({ patient }: { patient: MockPatient }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todos")
  if (!patient.followUps.length) {
    return (
      <Card>
        <Empty title="Sin seguimientos" body="Agenda el primero y asígnale un tipo: llamada, visita domiciliaria o mensaje." action="Agendar seguimiento" />
      </Card>
    )
  }
  const rows = [...upcomingFollowUps(patient), ...pastFollowUps(patient)].filter((f) => {
    if (filter === "Próximos") return f.status === "PENDING" || f.status === "SCHEDULED"
    if (filter === "Completados") return f.status === "DONE"
    if (filter === "No contactados") return f.status === "NOT_REACHED"
    return true
  })
  return (
    <Card title="Seguimientos" action={<Pill dark>Agendar seguimiento</Pill>}>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Pill key={f} dark={filter === f} onClick={() => setFilter(f)}>
            {f}
          </Pill>
        ))}
      </div>
      <Table head={["Fecha", "Motivo", "Tipo", "Con quién", "Agente", "Intentos", "Estado"]}>
        {rows.map((f) => {
          const today = relativeDay(f.date) === "hoy"
          return (
            <tr key={f.id} className={cn("cursor-pointer", today && "bg-red-50/50")}>
              <Td className="whitespace-nowrap">
                <span className="block font-medium">{shortDate(f.date)}</span>
                <span className={cn("text-xs", today ? "font-medium text-red-600" : "text-zinc-500")}>{capitalize(relativeDay(f.date))}</span>
              </Td>
              <Td>
                <span className="block font-medium">{f.purpose}</span>
                {(f.result || f.note) && <span className="block max-w-[38ch] text-zinc-500">{[f.result, f.note].filter(Boolean).join(". ")}</span>}
              </Td>
              <Td>{f.modality}</Td>
              <Td>{f.interlocutor}</Td>
              <Td>{f.agent}</Td>
              <Td className="tabular-nums">{f.attempts}</Td>
              <Td><Status tone={followUpStatus[f.status].tone}>{followUpStatus[f.status].label}</Status></Td>
            </tr>
          )
        })}
      </Table>
      {rows.length === 0 && <p className="py-6 text-center text-[13px] text-zinc-500">No hay seguimientos con este filtro.</p>}
    </Card>
  )
}

export function TableroPsico({ patient }: { patient: MockPatient }) {
  const { cycle, sessions } = patient.psycho
  if (!sessions.length) {
    return (
      <Card>
        <Empty title="Sin sesiones de psicooncología" body="Agenda una sesión con un voluntario para el paciente o un familiar." action="Agendar sesión" />
      </Card>
    )
  }
  return (
    <div className="space-y-4">
      {cycle && (
        <Card>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-[13px] text-zinc-500">Ciclo {cycle.number}, desde {shortDate(cycle.startedOn)}</p>
              <p className="text-[28px] font-semibold tabular-nums">{cycle.done} de {cycle.total} sesiones</p>
            </div>
            <div className="flex min-w-[200px] flex-1 gap-1.5">
              {Array.from({ length: cycle.total }, (_, i) => (
                <span key={i} className={cn("h-3 flex-1 rounded-md", i < cycle.done ? "bg-zinc-900" : "bg-zinc-100")} />
              ))}
            </div>
            <Pill>Cerrar ciclo</Pill>
          </div>
        </Card>
      )}
      <Card title="Sesiones" action={<Pill dark>Agendar sesión</Pill>}>
        <Table head={["Sesión", "Fecha", "Beneficiario", "Voluntario", "Nota", "Estado", ""]}>
          {sessions.map((s) => (
            <tr key={s.id}>
              <Td className="font-medium">Sesión {s.number}</Td>
              <Td className="whitespace-nowrap">{shortDate(s.date)}, {s.time}</Td>
              <Td>{s.beneficiary}</Td>
              <Td>{s.volunteer}</Td>
              <Td className="max-w-[30ch] text-zinc-500">{s.note ?? "Sin nota"}</Td>
              <Td><Status tone={psychoStatus[s.status].tone}>{psychoStatus[s.status].label}</Status></Td>
              <Td>
                {s.status === "SCHEDULED" && <Pill>Reprogramar</Pill>}
                {s.status === "NO_SHOW" && <Pill>Gestionar</Pill>}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}

export function TableroRecordatorios({ patient }: { patient: MockPatient }) {
  if (!patient.reminders.length) {
    return (
      <Card>
        <Empty title="Sin recordatorios" body="Registra una cita médica y elige cuándo y por dónde avisarle." action="Crear recordatorio" />
      </Card>
    )
  }
  return (
    <Card title="Recordatorios" action={<Pill dark>Crear recordatorio</Pill>}>
      <Table head={["Fecha", "Recordatorio", "Tipo", "Lugar", "Aviso", "Envío"]}>
        {patient.reminders.map((r) => (
          <tr key={r.id} className={cn(r.done && "text-zinc-500")}>
            <Td className="whitespace-nowrap">
              <span className="block font-medium">{shortDate(r.date)}, {r.time}</span>
              <span className="text-xs text-zinc-500">{capitalize(relativeDay(r.date))}</span>
            </Td>
            <Td className="font-medium">{r.title}</Td>
            <Td>{r.kind}</Td>
            <Td>{r.place}</Td>
            <Td>{r.channel}, {r.lead}</Td>
            <Td><Status tone={deliveryStatus[r.delivery].tone}>{deliveryStatus[r.delivery].label}</Status></Td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

export function TableroAcompanantes({ patient }: { patient: MockPatient }) {
  if (!patient.companions.length) {
    return (
      <Card>
        <Empty title="Sin acompañantes" body="Registra a la familia o personas cercanas que lo apoyan." action="Agregar acompañante" />
      </Card>
    )
  }
  return (
    <Card title="Acompañantes" action={<Pill dark>Agregar acompañante</Pill>}>
      <Table head={["Nombre", "Parentesco", "Contacto", "Documento", "Charlas de interés", ""]}>
        {patient.companions.map((c) => (
          <tr key={c.id}>
            <Td>
              <span className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold">{initials(c.name)}</span>
                <span>
                  <span className="block font-medium">{c.name}</span>
                  {c.isPrimary && <span className="text-xs text-sky-700">Contacto principal</span>}
                  {c.alsoAccompanies && <span className="block text-xs text-zinc-500">También acompaña a {c.alsoAccompanies}</span>}
                </span>
              </span>
            </Td>
            <Td>{c.relationship}</Td>
            <Td>
              <span className="block">{c.phone}</span>
              <span className="text-zinc-500">{c.email ?? "Sin correo"}</span>
            </Td>
            <Td>{c.document ?? "Sin registrar"}</Td>
            <Td>{c.talks.length ? c.talks.join(", ") : <span className="text-zinc-400">Ninguna</span>}</Td>
            <Td>
              <span className="flex gap-2">
                <Pill>Editar</Pill>
                <Pill>Enrolar</Pill>
              </span>
            </Td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

export function TableroDocumentos({ patient }: { patient: MockPatient }) {
  return (
    <Card title="Documentos clínicos" action={<Pill dark><Upload className="size-3.5" />Subir documento</Pill>}>
      {patient.documents.length ? (
        <Table head={["Documento", "Categoría", "Vinculado a", "Subido por", "Fecha", ""]}>
          {patient.documents.map((d) => (
            <tr key={d.id}>
              <Td>
                <span className="flex items-center gap-3">
                  {d.type === "pdf" ? <FileText className="size-4 text-red-600" /> : <FileImage className="size-4 text-sky-600" />}
                  <span>
                    <span className="block font-medium">{d.name}</span>
                    <span className="text-xs text-zinc-500">{d.size}</span>
                  </span>
                </span>
              </Td>
              <Td>{d.category}</Td>
              <Td>{d.linkedTo}</Td>
              <Td>{d.uploadedBy}</Td>
              <Td>{shortDate(d.date)}</Td>
              <Td>
                <span className="flex gap-1">
                  <button aria-label="Ver" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"><Eye className="size-4" /></button>
                  <button aria-label="Descargar" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"><Download className="size-4" /></button>
                </span>
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty title="Sin documentos" body="Sube informes, recetas o referencias. PDF o imagen de hasta 10 MB." />
      )}
    </Card>
  )
}
