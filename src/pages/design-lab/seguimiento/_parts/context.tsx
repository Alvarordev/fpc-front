import { Chip } from "@/components/ds/badge"
import { Card, GroupLabel } from "@/components/ds/card"
import { DataList } from "@/components/ds/data"
import { capitalize, shortDate, upcomingFollowUps, weekday, type MockPatient } from "../../_data/mock-patient"
import type { MockFollowUp } from "../_data/mock-follow-up"

// Lectura del seguimiento cerrado: qué se registró y la situación del paciente.

export function ClinicalGlanceCard({ patient }: { patient: MockPatient }) {
  const chemo = patient.currentTreatments.find((t) => t.progress)
  const next = [
    ...patient.psycho.sessions.filter((s) => s.status === "SCHEDULED").map((s) => ({ id: s.id, date: s.date, text: `Sesión ${s.number} de psicooncología` })),
    ...patient.reminders.filter((r) => !r.done).map((r) => ({ id: r.id, date: r.date, text: r.title })),
    ...upcomingFollowUps(patient).slice(1).map((f) => ({ id: f.id, date: f.date, text: f.purpose })),
  ].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <Card title="De un vistazo">
      <DataList
        labelWidth={110}
        items={[
          ["Diagnóstico", patient.health.diagnosis ? `${patient.health.diagnosis}, ${patient.health.stage}` : "Sin diagnóstico"],
          ["Tratamiento", chemo?.progress ? `${chemo.name}, ciclo ${chemo.progress.done} de ${chemo.progress.total}` : "Sin tratamiento"],
          ["Síntomas", patient.symptoms.join(", ") || "Ninguno"],
          ["Seguro", patient.insurance[0]?.name ?? "Sin seguro"],
        ]}
      />
      <GroupLabel>Lo que viene</GroupLabel>
      {next.length ? (
        <ul className="mt-1 space-y-2 px-1 text-[13px]">
          {next.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3">
              <span className="font-medium">{n.text}</span>
              <span className="shrink-0 text-zinc-500">
                {capitalize(weekday(n.date))} {shortDate(n.date)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-1 py-2 text-[13px] text-zinc-500">Nada agendado.</p>
      )}
    </Card>
  )
}

export function OutcomesCard({ followUp }: { followUp: MockFollowUp }) {
  return (
    <Card title="Qué se registró" description="Lo que se guardó al completar este seguimiento">
      <div className="space-y-2">
        {followUp.outcomes.map((o) => (
          <div key={o.id} className="flex items-start gap-3 rounded-[14px] bg-zinc-50 p-3 ring-1 ring-zinc-200/60">
            <Chip tone={o.tone}>{o.kind}</Chip>
            <p className="text-sm text-zinc-800">{o.text}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
