import { ArrowLeft, History, Phone, Sparkles } from "lucide-react"
import { ExpandableLine } from "@/components/ds/expandable-line"
import { AiMark } from "@/components/ds/icon"
import { Chip, MetaTag } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { CopyValue } from "@/components/ds/copy-value"
import { InlineAlert } from "@/components/ds/inline-alert"
import { capitalize, initials, longDate, relativeDay, weekday, type MockPatient } from "../../_data/mock-patient"
import { channelLabels, statusLabels, timeOf, type MockFollowUp } from "../_data/mock-follow-up"

// Cabecera del seguimiento: a quién, para qué, cuándo y en qué estado está.

export function FollowUpHeader({ followUp, patient, isOpen }: { followUp: MockFollowUp; patient: MockPatient; isOpen: boolean }) {
  const status = statusLabels[followUp.status]
  const date = followUp.scheduledAt.slice(0, 10)
  return (
    <div className="space-y-4">
      <button className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-900">
        <ArrowLeft className="size-3.5" />
        Volver a la ficha de {patient.firstName}
      </button>
      <section className="rounded-[20px] border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-zinc-900 text-base font-semibold text-white">{initials(patient.fullName)}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-zinc-500">{isOpen ? "Registrar seguimiento" : "Detalle del seguimiento"}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold">
                {followUp.purpose} con {patient.firstName}
              </h1>
              <Chip tone={status.tone}>{status.label}</Chip>
              <Chip tone="violet">{patient.health.phase}</Chip>
              {patient.health.diagnosis && <Chip tone="blue">{patient.health.diagnosis}</Chip>}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <MetaTag icon={Phone}>
                <CopyValue value={patient.phone} label="Celular" />
              </MetaTag>
              <MetaTag>{patient.fullName}</MetaTag>
              <MetaTag>{patient.document}</MetaTag>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              {channelLabels[followUp.channel]} agendada para el {weekday(date)} {longDate(date)} a las {timeOf(followUp.scheduledAt)} ({relativeDay(date)}), a cargo de {followUp.agent}
            </p>
          </div>
          {!isOpen && <Button>Editar seguimiento</Button>}
        </div>
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {followUp.previous && (
            <ExpandableLine
              icon={<History className="size-4 text-zinc-400" />}
              label={`Último contacto, ${relativeDay(followUp.previous.date)}`}
              text={followUp.previous.note}
            />
          )}
          {patient.caseSummary && <ExpandableLine icon={<AiMark icon={Sparkles} className="[&_svg]:size-4" />} label="Resumen del caso" text={patient.caseSummary} />}
        </div>
        {patient.alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {patient.alerts.map((a) => (
              <InlineAlert key={a.id} aside={capitalize(`abierta ${relativeDay(a.since)}`)}>
                {a.title}
              </InlineAlert>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

