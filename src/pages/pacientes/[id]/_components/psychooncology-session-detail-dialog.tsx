import { Brain, CalendarDays, ExternalLink, Mail, Phone, UserRound, Video } from "lucide-react"
import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { DataList, InsetRow } from "@/components/ds/data"
import { Modal } from "@/components/ds/modal"
import type { Tone } from "@/components/ds/tone"
import { formatAgendaDateTime } from "@/pages/agente-agenda/_lib/agenda"
import { ENROLLMENT_RATING_OPTIONS } from "./enrollment-rating-options"

interface PsychooncologySessionDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: PsychooncologyAppointment | null
  patientName: string
  volunteerName: string
  onRegister?: () => void
}

const STATUS: Record<PsychooncologyAppointment["status"], { label: string; tone: Tone }> = {
  SCHEDULED: { label: "Programada", tone: "blue" },
  COMPLETED: { label: "Completada", tone: "green" },
  CANCELLED: { label: "Cancelada", tone: "gray" },
  NO_SHOW: { label: "No se presentó", tone: "amber" },
  RESCHEDULED: { label: "Reprogramada", tone: "blue" },
  OVERDUE: { label: "Vencida", tone: "red" },
}

const referralLabels: Record<string, string> = {
  PSYCHIATRY: "Psiquiatría",
  NEUROLOGY: "Neurología",
  CONTINUE_PSYCHOLOGY: "Continuar psicología",
  PSYCHOONCOLOGIST: "Derivar a psicooncólogo",
  NONE: "Ninguna",
}

export function PsychooncologySessionDetailDialog({ open, onOpenChange, appointment: a, patientName, volunteerName, onRegister }: PsychooncologySessionDetailDialogProps) {
  if (!open || !a) return null

  const isVideo = a.modality === "VIDEO_CALL"
  const sessionLabel = a.sessionNumber ? `Sesión ${a.sessionNumber}` : "Sesión extra"
  const status = STATUS[a.status]
  const beneficiary = a.beneficiaryType === "COMPANION" ? (text(a.companionFullName) ?? "Acompañante") : patientName
  const record: [string, React.ReactNode][] = [
    ["Tema abordado", text(a.topicAddressed)],
    ["Detalles de la sesión", text(a.sessionDetails)],
    ["Observaciones", text(a.additionalObservations)],
    ["Recomendaciones", text(a.recommendations)],
    ["Derivación", a.referral ? (referralLabels[a.referral] ?? a.referral) : null],
  ]
  const hasRecord = record.some(([, v]) => v)
  const canRegister = onRegister && (a.status === "SCHEDULED" || a.status === "OVERDUE" || a.status === "NO_SHOW")
  const rating = ENROLLMENT_RATING_OPTIONS.find((o) => o.value === String(a.satisfactionRating ?? ""))?.label

  return (
    <Modal
      open
      onClose={() => onOpenChange(false)}
      icon={Brain}
      title={`${sessionLabel} de psicooncología`}
      description={a.scheduledAt ? formatAgendaDateTime(a.scheduledAt) : undefined}
      tags={
        <>
          <Chip tone={status.tone}>{status.label}</Chip>
          {a.isAdditionalSession && <Chip tone="violet">Adicional</Chip>}
        </>
      }
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          {canRegister && (
            <Button
              variant="dark"
              onClick={() => {
                onOpenChange(false)
                onRegister()
              }}
            >
              Registrar sesión
            </Button>
          )}
        </>
      }
    >
      <Panel title="Sesión">
        <div className="grid gap-2 sm:grid-cols-2">
          <InsetRow icon={UserRound} label="Para" value={beneficiary} />
          <InsetRow icon={Brain} label="Psicooncólogo" value={volunteerName || "Sin asignar"} />
          <InsetRow icon={CalendarDays} label="Fecha y hora" value={a.scheduledAt ? formatAgendaDateTime(a.scheduledAt) : "Sin registrar"} />
          <InsetRow
            icon={isVideo ? Video : Phone}
            label="Modalidad"
            value={isVideo ? "Videollamada" : "Llamada"}
            trailing={
              isVideo && a.zoomLink ? (
                <a href={a.zoomLink} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-zinc-700 hover:text-zinc-900">
                  Abrir
                  <ExternalLink className="size-3.5" />
                </a>
              ) : undefined
            }
          />
          {a.patientEmail && <InsetRow icon={Mail} label="Correo del paciente" value={a.patientEmail} />}
        </div>
        {a.schedulingNotes && <p className="mt-3 rounded-[14px] bg-zinc-50 p-3 text-sm text-zinc-700 ring-1 ring-zinc-200/60">{a.schedulingNotes}</p>}
      </Panel>
      {hasRecord ? (
        <Panel title="Registro de la atención">
          <DataList labelWidth={150} items={record} />
        </Panel>
      ) : (
        a.status === "COMPLETED" && (
          <Panel title="Registro de la atención">
            <p className="text-[13px] text-zinc-500">No se registraron notas de la sesión.</p>
          </Panel>
        )
      )}
      {(a.completedAt || a.noAnswerNote || rating || a.satisfactionComment) && (
        <Panel title="Resultado">
          <DataList
            labelWidth={150}
            items={[
              ...(a.completedAt ? ([["Completada el", formatAgendaDateTime(a.completedAt)]] as [string, React.ReactNode][]) : []),
              ...(a.noAnswerNote ? ([["Por qué no se realizó", a.noAnswerNote]] as [string, React.ReactNode][]) : []),
              ...(rating ? ([["Calificación", rating]] as [string, React.ReactNode][]) : []),
              ...(a.satisfactionComment ? ([["Comentario", a.satisfactionComment]] as [string, React.ReactNode][]) : []),
            ]}
          />
        </Panel>
      )}
    </Modal>
  )
}

function text(value: string | null | undefined) {
  return value?.trim() || null
}
