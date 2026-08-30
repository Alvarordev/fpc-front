import { Brain, TriangleAlert, Bell, CalendarPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ReminderKind } from "@/api/reminders"

export interface ReminderDraft {
  kind: ReminderKind
  description: string
  dueAt: string
  medicalAppointment?: {
    specialty: string
    healthCenterId?: string
    isFirstConsultation?: boolean
  }
}

interface FollowUpAsideProps {
  onPsicoOpen: () => void
  hasPsicoDraft: boolean
  onClearPsico: () => void
  onAlertOpen: () => void
  hasAlertDraft: boolean
  onClearAlert: () => void
  onNextContactOpen: () => void
  hasNextContactDraft: boolean
  onClearNextContact: () => void
  onReminderOpen: () => void
  reminderDrafts: ReminderDraft[]
  onRemoveReminder: (index: number) => void
  className?: string
}

function formatDraftDueAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return value
  return date.toLocaleString("es-PE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function FollowUpAside({
  onPsicoOpen,
  hasPsicoDraft,
  onClearPsico,
  onAlertOpen,
  hasAlertDraft,
  onClearAlert,
  onNextContactOpen,
  hasNextContactDraft,
  onClearNextContact,
  onReminderOpen,
  reminderDrafts,
  onRemoveReminder,
  className,
}: FollowUpAsideProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "border-border/60 self-start xl:sticky xl:top-4",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Acciones</CardTitle>
        <p className="text-muted-foreground text-xs">
          Se registran al completar el seguimiento.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 w-full justify-start gap-2"
          onClick={onPsicoOpen}
        >
          <Brain className="size-4 text-violet-500" />
          Derivar a psicooncología
        </Button>
        {hasPsicoDraft && (
          <DraftChip
            color="violet"
            text="Psicosesión lista para guardar."
            onClear={onClearPsico}
          />
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 w-full justify-start gap-2"
          onClick={onAlertOpen}
        >
          <TriangleAlert className="size-4 text-amber-500" />
          Reportar incidencia hospitalaria
        </Button>
        {hasAlertDraft && (
          <DraftChip
            color="amber"
            text="Alerta lista para registrar."
            onClear={onClearAlert}
          />
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 w-full justify-start gap-2"
          onClick={onNextContactOpen}
        >
          <CalendarPlus className="size-4 text-sky-500" />
          Agendar siguiente seguimiento
        </Button>
        {hasNextContactDraft && (
          <DraftChip
            color="sky"
            text="Siguiente seguimiento listo para guardar."
            onClear={onClearNextContact}
          />
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 w-full justify-start gap-2"
          onClick={onReminderOpen}
        >
          <Bell className="size-4 text-amber-500" />
          Agregar recordatorio
        </Button>

        {reminderDrafts.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {reminderDrafts.map((reminder, index) => (
              <li
                key={`${reminder.description}-${reminder.dueAt}-${index}`}
                className="flex items-start justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
              >
                <div className="min-w-0">
                  {reminder.kind === "MEDICAL_APPOINTMENT" && (
                    <span className="mb-0.5 inline-block rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-700">
                      Cita médica
                    </span>
                  )}
                  <p className="text-xs text-amber-800">
                    {reminder.kind === "MEDICAL_APPOINTMENT"
                      ? reminder.medicalAppointment?.specialty ??
                        reminder.description
                      : reminder.description}
                  </p>
                  <p className="text-[10px] text-amber-700/80">
                    {formatDraftDueAt(reminder.dueAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveReminder(index)}
                  className="shrink-0 text-amber-500 hover:text-amber-700"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function DraftChip({
  color,
  text,
  onClear,
}: {
  color: "violet" | "amber" | "sky"
  text: string
  onClear: () => void
}) {
  const classes = {
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
  }[color]

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${classes}`}
    >
      <span className="text-xs">{text}</span>
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 opacity-70 hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
