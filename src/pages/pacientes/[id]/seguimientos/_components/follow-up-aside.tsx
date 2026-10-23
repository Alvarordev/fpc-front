import { Bell, Brain, CalendarPlus, Check, TriangleAlert, X } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { CatalogValue } from "@/components/catalog-select"
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
  const hasPending =
    hasPsicoDraft ||
    hasAlertDraft ||
    hasNextContactDraft ||
    reminderDrafts.length > 0

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex flex-wrap gap-2">
        <ActionPill
          icon={Brain}
          iconClassName="text-violet-500"
          active={hasPsicoDraft}
          onClick={onPsicoOpen}
        >
          Derivar a psicooncología
        </ActionPill>
        <ActionPill
          icon={TriangleAlert}
          iconClassName="text-amber-500"
          active={hasAlertDraft}
          onClick={onAlertOpen}
        >
          Reportar incidencia hospitalaria
        </ActionPill>
        <ActionPill
          icon={CalendarPlus}
          iconClassName="text-sky-500"
          active={hasNextContactDraft}
          onClick={onNextContactOpen}
        >
          Agendar siguiente seguimiento
        </ActionPill>
        <ActionPill
          icon={Bell}
          iconClassName="text-amber-500"
          active={reminderDrafts.length > 0}
          onClick={onReminderOpen}
        >
          Agregar recordatorio
        </ActionPill>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-muted-foreground text-xs">
          {hasPending ? "Se registrará al completar:" : "Se registrará al completar."}
        </p>
        {hasPending ? (
          <>
            {hasPsicoDraft && (
              <DraftChip
                color="violet"
                text="Psicosesión lista para guardar."
                onClear={onClearPsico}
              />
            )}
            {hasAlertDraft && (
              <DraftChip
                color="amber"
                text="Alerta lista para registrar."
                onClear={onClearAlert}
              />
            )}
            {hasNextContactDraft && (
              <DraftChip
                color="sky"
                text="Siguiente seguimiento listo para guardar."
                onClear={onClearNextContact}
              />
            )}
            {reminderDrafts.map((reminder, index) => (
              <DraftChip
                key={`${reminder.description}-${reminder.dueAt}-${index}`}
                color="amber"
                text={
                  <>
                    Recordatorio:{" "}
                    {reminder.kind === "MEDICAL_APPOINTMENT" &&
                    reminder.medicalAppointment?.specialty ? (
                      <CatalogValue
                        kind="medical_specialty"
                        code={reminder.medicalAppointment.specialty}
                      />
                    ) : (
                      reminder.description
                    )}
                    , {formatDraftDueAt(reminder.dueAt)}
                  </>
                }
                onClear={() => onRemoveReminder(index)}
              />
            ))}
          </>
        ) : null}
      </div>
    </div>
  )
}

function ActionPill({
  icon: Icon,
  iconClassName,
  active,
  onClick,
  children,
}: {
  icon: typeof Brain
  iconClassName: string
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "h-8 gap-1.5 rounded-full px-3 text-xs",
        active && "border-primary/30 bg-primary/5",
      )}
      onClick={onClick}
    >
      {active ? (
        <Check className="size-3.5 text-primary" />
      ) : (
        <Icon className={cn("size-3.5", iconClassName)} />
      )}
      {children}
    </Button>
  )
}

function DraftChip({
  color,
  text,
  onClear,
}: {
  color: "violet" | "amber" | "sky"
  text: ReactNode
  onClear: () => void
}) {
  const classes = {
    violet: "border-violet-200 bg-violet-50 text-violet-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    sky: "border-sky-200 bg-sky-50 text-sky-800",
  }[color]

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]",
        classes,
      )}
    >
      <span className="min-w-0 truncate">{text}</span>
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 opacity-60 hover:opacity-100"
        aria-label="Quitar"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}
