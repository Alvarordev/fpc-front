import { useMemo } from "react"
import { BellRing, CheckCircle2, FileText, HeartHandshake, Phone, PhoneMissed, RefreshCw, Sparkles, Users } from "lucide-react"
import {
  longDate,
  referralStatus,
  shortDate,
  type MockPatient,
  type TabId,
  type Tone,
} from "../../_data/mock-patient"
import { Card, Empty, Pill, Status, Table, Td, ToneIcon } from "./ui"

type Activity = { id: string; date: string; text: string; icon: typeof Phone; tone: Tone }

function recentActivity(p: MockPatient): Activity[] {
  const items: Activity[] = [
    ...p.followUps
      .filter((f) => f.status === "DONE" || f.status === "NOT_REACHED")
      .map((f) => ({
        id: f.id,
        date: f.date,
        text: f.status === "DONE" ? `${f.purpose} completado. ${f.result ?? ""}` : `${f.purpose}: no se logró contactar`,
        icon: f.status === "DONE" ? CheckCircle2 : PhoneMissed,
        tone: (f.status === "DONE" ? "green" : "red") as Tone,
      })),
    ...p.psycho.sessions
      .filter((s) => s.status !== "SCHEDULED")
      .map((s) => ({
        id: s.id,
        date: s.date,
        text: s.status === "DONE" ? `Sesión ${s.number} de psicooncología con ${s.beneficiary}` : `Faltó a la sesión ${s.number} de psicooncología`,
        icon: HeartHandshake,
        tone: (s.status === "DONE" ? "violet" : "red") as Tone,
      })),
    ...p.reminders.filter((r) => r.done).map((r) => ({ id: r.id, date: r.date, text: `Recordatorio: ${r.title.toLowerCase()}`, icon: BellRing, tone: "amber" as Tone })),
    ...p.documents.map((d) => ({ id: d.id, date: d.date, text: `Se subió ${d.name.toLowerCase()}`, icon: FileText, tone: "blue" as Tone })),
    ...p.changeLog.map((c) => ({ id: c.id, date: c.date, text: `${c.who}: ${c.what.toLowerCase()}`, icon: Users, tone: "gray" as Tone })),
  ]
  return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
}

export function TableroResumen({ patient, onTab }: { patient: MockPatient; onTab: (t: TabId) => void }) {
  const activity = useMemo(() => recentActivity(patient), [patient])
  const h = patient.health
  const personal: [string, string][] = [
    ["Fecha de nacimiento", `${longDate(patient.birthDate)} (${patient.age} años)`],
    ["Sexo", patient.gender],
    ["Correo", patient.email ?? "Sin registrar"],
    ["Celular auxiliar", patient.secondaryPhone ?? "Sin registrar"],
    ["Lengua materna", patient.language],
    ["Grado de instrucción", patient.education],
    ["Hijos", String(patient.children)],
    ["Punto de ingreso", patient.entryPoint],
  ]

  return (
    <div className="space-y-4">
      <Card title="Resumen del caso" action={<Pill><RefreshCw className="size-3.5" />Actualizar</Pill>}>
        {patient.caseSummary ? (
          <p className="flex max-w-[80ch] gap-3 text-sm leading-relaxed text-zinc-700">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-zinc-400" />
            {patient.caseSummary}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Se genera cuando haya al menos un seguimiento registrado.</p>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card title="Actividad reciente" action={<Pill onClick={() => onTab("seguimiento")}>Ver todo</Pill>}>
          {activity.length ? (
            <ol className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <ToneIcon icon={a.icon} tone={a.tone} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug font-medium">{a.text}</p>
                    <p className="text-xs text-zinc-500">{longDate(a.date)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <Empty title="Sin actividad" body="Aquí verás seguimientos, sesiones, recordatorios y cambios en orden." />
          )}
        </Card>

        <Card title="Datos del paciente" action={<Pill>Editar</Pill>}>
          <dl className="divide-y divide-zinc-100">
            {personal.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[150px_minmax(0,1fr)] gap-3 py-2 text-[13px]">
                <dt className="text-zinc-500">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card title="Salud y tratamiento">
        {h.diagnosis ? (
          <Table head={["Diagnóstico", "Etapa", "Fecha", "Centro", "Especialidad", "Evolución"]}>
            <tr>
              <Td className="font-medium">{h.diagnosis}</Td>
              <Td>{h.stage}</Td>
              <Td>{shortDate(h.diagnosisDate!)}</Td>
              <Td>{h.center}</Td>
              <Td>{h.specialty}</Td>
              <Td><Status tone="green">{h.evolution}</Status></Td>
            </tr>
          </Table>
        ) : (
          <Empty title="Sin diagnóstico" body={`Está en ${h.phase.toLowerCase()}. Síntoma: ${h.firstSymptom?.toLowerCase()}.`} action="Registrar diagnóstico" />
        )}
        {patient.currentTreatments.length > 0 && (
          <div className="mt-5">
            <Table head={["Tratamiento", "Detalle", "Frecuencia", "Centro", "Desde", "Avance"]}>
              {[...patient.currentTreatments, ...patient.pastTreatments].map((t) => (
                <tr key={t.id}>
                  <Td className="font-medium">{t.name}</Td>
                  <Td>{t.detail}</Td>
                  <Td>{t.frequency ?? "Única vez"}</Td>
                  <Td>{t.center}</Td>
                  <Td>{shortDate(t.since)}</Td>
                  <Td>
                    {t.progress ? (
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-16 rounded-full bg-zinc-100">
                          <span className="block h-full rounded-full bg-zinc-900" style={{ width: `${(t.progress.done / t.progress.total) * 100}%` }} />
                        </span>
                        <span className="tabular-nums">{t.progress.done}/{t.progress.total}</span>
                      </span>
                    ) : t.until ? (
                      <Status tone="gray">Terminado</Status>
                    ) : (
                      <Status tone="blue">En curso</Status>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </Card>

      <section className="grid gap-px overflow-hidden rounded-[20px] border border-zinc-200 bg-zinc-200 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Fase de salud" value={h.phase} hint={h.subcategory ?? "Sin subcategoría"} />
        <Metric label="Seguro" value={patient.insurance[0]?.name ?? "Sin seguro"} hint={patient.insurance[0]?.detail ?? "Registra su afiliación"} />
        <Metric label="Comorbilidades" value={patient.comorbidities.length ? patient.comorbidities.join(", ") : "Ninguna"} hint={`Síntomas: ${patient.symptoms.join(", ").toLowerCase() || "ninguno"}`} />
        <Metric label="Situación social" value={patient.social[2].value} hint={`Ayuda económica: ${patient.social[0].value.toLowerCase()}`} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Derivaciones" action={<Pill>Nueva derivación</Pill>}>
          {patient.referrals.length ? (
            <Table head={["Origen", "Destino", "Especialidad", "Fecha", "Estado"]}>
              {patient.referrals.map((r) => (
                <tr key={r.id}>
                  <Td>{r.from}</Td>
                  <Td className="font-medium">{r.to}</Td>
                  <Td>{r.specialty}</Td>
                  <Td>{shortDate(r.date)}</Td>
                  <Td><Status tone={referralStatus[r.status].tone}>{referralStatus[r.status].label}</Status></Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty title="Sin derivaciones" body="Registra las hojas de referencia entre centros de salud." />
          )}
        </Card>
        <Card title="Recorrido de atención">
          {patient.journey.length ? (
            <ul className="space-y-3">
              {patient.journey.map((j) => (
                <li key={j.center} className="grid grid-cols-[minmax(0,1fr)_120px_40px] items-center gap-3 text-[13px]">
                  <span className="truncate font-medium">{j.center}</span>
                  <span className="h-2 rounded-full bg-zinc-100">
                    <span className="block h-full rounded-full bg-red-600" style={{ width: `${(j.visits / patient.journey[0].visits) * 100}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{j.visits}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Sin atenciones" body="Se arma con las citas y derivaciones registradas." />
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Direcciones">
          {patient.addresses.length ? (
            <ul className="space-y-3 text-[13px]">
              {patient.addresses.map((a) => (
                <li key={a.id}>
                  <p className="font-medium">{a.line}</p>
                  <p className="text-zinc-500">{a.district}, {a.kind.toLowerCase()}{a.primary ? ", principal" : ""}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-zinc-500">Sin direcciones registradas.</p>
          )}
        </Card>
        <Card title="Encuestas">
          {patient.surveys.length ? (
            <ul className="space-y-3 text-[13px]">
              {patient.surveys.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block font-medium">{s.name}</span>
                    <span className="text-zinc-500">{s.score ? `Puntaje ${s.score}` : `Desde ${shortDate(s.due)}`}</span>
                  </span>
                  <Status tone={s.status === "DONE" ? "green" : "amber"}>{s.status === "DONE" ? "Respondida" : "Pendiente"}</Status>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-zinc-500">Sin encuestas todavía.</p>
          )}
        </Card>
        <Card title="Historial de cambios">
          {patient.changeLog.length ? (
            <ul className="space-y-3 text-[13px]">
              {patient.changeLog.map((c) => (
                <li key={c.id}>
                  <p className="font-medium">{c.what}</p>
                  <p className="text-zinc-500">{c.who}, {shortDate(c.date)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-zinc-500">Sin cambios registrados.</p>
          )}
        </Card>
      </div>
    </div>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white p-5">
      <p className="text-[13px] text-zinc-500">{label}</p>
      <p className="mt-1 text-lg leading-snug font-semibold">{value}</p>
      <p className="mt-1 text-[13px] text-zinc-500">{hint}</p>
    </div>
  )
}
