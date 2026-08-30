import type { ReactNode } from "react"
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  Video,
} from "lucide-react"
import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import { formatAgendaDateTime } from "@/pages/agente-agenda/_lib/agenda"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ENROLLMENT_RATING_OPTIONS } from "./enrollment-rating-options"

interface PsychooncologySessionDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: PsychooncologyAppointment | null
  patientName: string
  volunteerName: string
  onRegister?: () => void
}

const statusLabels: Record<PsychooncologyAppointment["status"], string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No contestó",
}

const statusStyles: Record<PsychooncologyAppointment["status"], string> = {
  SCHEDULED: "border-violet-200 bg-violet-50 text-violet-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-zinc-200 bg-zinc-100 text-zinc-600",
  NO_ANSWER: "border-amber-200 bg-amber-50 text-amber-700",
}

const referralLabels: Record<string, string> = {
  PSYCHIATRY: "Psiquiatría",
  NEUROLOGY: "Neurología",
  CONTINUE_PSYCHOLOGY: "Continuar psicología",
  PSYCHOONCOLOGIST: "Derivar a psicooncólogo",
  NONE: "Ninguna",
}

export function PsychooncologySessionDetailDialog({
  open,
  onOpenChange,
  appointment,
  patientName,
  volunteerName,
  onRegister,
}: PsychooncologySessionDetailDialogProps) {
  if (!appointment) return null

  const value = (key: keyof PsychooncologyAppointment) =>
    (appointment as unknown as Record<string, unknown>)[key]
  const scheduledAt = textValue(value("scheduledAt"))
  const completedAt = textValue(value("completedAt"))
  const zoomLink = textValue(value("zoomLink"))
  const patientEmail = textValue(value("patientEmail"))
  const companionName = textValue(value("companionFullName"))
  const schedulingNotes = textValue(value("schedulingNotes"))
  const noAnswerNote = textValue(value("noAnswerNote"))
  const topicAddressed = textValue(value("topicAddressed"))
  const sessionDetails = textValue(value("sessionDetails"))
  const additionalObservations = textValue(value("additionalObservations"))
  const recommendations = textValue(value("recommendations"))
  const referral = textValue(value("referral"))
  const satisfactionComment = textValue(value("satisfactionComment"))
  const satisfactionRating = value("satisfactionRating")
  const isVideo = appointment.modality === "VIDEO_CALL"
  const ModalityIcon = isVideo ? Video : Phone
  const sessionLabel = appointment.sessionNumber
    ? `Sesión ${appointment.sessionNumber}`
    : "Sesión extra"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-5 sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle>Detalle de sesión psicooncológica</DialogTitle>
            <Badge className={statusStyles[appointment.status]}>
              {statusLabels[appointment.status]}
            </Badge>
          </div>
          <DialogDescription>
            {patientName} · {sessionLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
          <DetailSection title="Datos de la sesión" icon={CalendarDays}>
            <DetailItem label="Paciente" value={patientName} />
            <DetailItem
              label="Beneficiario"
              value={
                appointment.beneficiaryType === "COMPANION"
                  ? (companionName ?? "Acompañante")
                  : "Paciente"
              }
            />
            <DetailItem label="Voluntario" value={volunteerName} />
            <DetailItem label="Sesión" value={sessionLabel} />
            <DetailItem
              label="Fecha y hora"
              value={
                scheduledAt
                  ? formatAgendaDateTime(scheduledAt)
                  : "Sin registrar"
              }
            />
            <DetailItem
              label="Modalidad"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <ModalityIcon className="size-3.5" />
                  {isVideo ? "Videollamada" : "Llamada"}
                </span>
              }
            />
            <DetailItem
              label="Sesión adicional"
              value={appointment.isAdditionalSession ? "Sí" : "No"}
            />
            <DetailItem
              label="Seguimiento vinculado"
              value={textValue(value("followUpId")) ?? "Sin registrar"}
            />
            <DetailItem
              label="Correo del paciente"
              value={
                patientEmail ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {patientEmail}
                  </span>
                ) : (
                  "Sin registrar"
                )
              }
            />
            <DetailItem
              label="Enlace de videollamada"
              value={
                zoomLink ? (
                  <a
                    href={zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    Abrir enlace
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  "Sin registrar"
                )
              }
            />
            <DetailItem
              className="sm:col-span-2"
              label="Notas de programación"
              value={schedulingNotes ?? "Sin registrar"}
            />
          </DetailSection>

          <DetailSection title="Registro de atención" icon={FileText}>
            <DetailItem
              className="sm:col-span-2"
              label="Tema abordado"
              value={topicAddressed ?? "Sin registrar"}
            />
            <DetailItem
              className="sm:col-span-2"
              label="Detalles de la sesión"
              value={sessionDetails ?? "Sin registrar"}
            />
            <DetailItem
              className="sm:col-span-2"
              label="Observaciones adicionales"
              value={additionalObservations ?? "Sin registrar"}
            />
            <DetailItem
              className="sm:col-span-2"
              label="Recomendaciones"
              value={recommendations ?? "Sin registrar"}
            />
            <DetailItem
              label="Derivación"
              value={
                (referral && referralLabels[referral]) ??
                referral ??
                "Sin registrar"
              }
            />
          </DetailSection>

          <DetailSection title="Resultado" icon={CheckCircle2}>
            <DetailItem
              label="Completada el"
              value={
                completedAt
                  ? formatAgendaDateTime(completedAt)
                  : "Sin registrar"
              }
            />
            <DetailItem
              label="Nota de no contestó"
              value={noAnswerNote ?? "Sin registrar"}
            />
            <DetailItem
              label="Calificación"
              value={
                ratingLabel(satisfactionRating) ??
                textValue(satisfactionRating) ??
                "Sin registrar"
              }
            />
            <DetailItem
              className="sm:col-span-2"
              label="Comentario de satisfacción"
              value={satisfactionComment ?? "Sin registrar"}
            />
          </DetailSection>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {appointment.status === "SCHEDULED" && onRegister ? (
            <Button
              onClick={() => {
                onOpenChange(false)
                onRegister()
              }}
            >
              Registrar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof CalendarDays
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="text-primary size-4" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="bg-muted/20 grid gap-x-4 gap-y-3 rounded-xl border p-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  )
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground mt-1 text-sm leading-relaxed wrap-break-word">
        {value}
      </dd>
    </div>
  )
}

function textValue(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const result = String(value).trim()
  return result || null
}

function ratingLabel(value: unknown) {
  if (typeof value !== "number" && typeof value !== "string") return undefined
  return ENROLLMENT_RATING_OPTIONS.find(
    (option) => option.value === String(value),
  )?.label
}
