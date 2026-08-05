import { Brain, TriangleAlert, Bell, CalendarPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export interface ReminderDraft {
  description: string
  dueAt: string
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
  reminderDescription: string
  onReminderDescriptionChange: (value: string) => void
  reminderAt: string
  onReminderAtChange: (value: string) => void
  onAddReminder: () => void
  reminderDrafts: ReminderDraft[]
  onRemoveReminder: (index: number) => void
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
  reminderDescription,
  onReminderDescriptionChange,
  reminderAt,
  onReminderAtChange,
  onAddReminder,
  reminderDrafts,
  onRemoveReminder,
}: FollowUpAsideProps) {
  return (
    <Card className="border-border/60 sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Acciones posteriores</CardTitle>
        <p className="text-muted-foreground text-xs">Se registran al completar el seguimiento.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={onPsicoOpen}>
          <Brain className="size-4 text-violet-500" />
          Derivar a psicooncología
        </Button>
        {hasPsicoDraft && (
          <DraftChip color="violet" text="Psicosesión lista para guardar." onClear={onClearPsico} />
        )}

        <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={onAlertOpen}>
          <TriangleAlert className="size-4 text-amber-500" />
          Reportar alerta hospitalaria
        </Button>
        {hasAlertDraft && (
          <DraftChip color="amber" text="Alerta lista para registrar." onClear={onClearAlert} />
        )}

        <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={onNextContactOpen}>
          <CalendarPlus className="size-4 text-sky-500" />
          Agendar siguiente seguimiento
        </Button>
        {hasNextContactDraft && (
          <DraftChip color="sky" text="Siguiente seguimiento listo para guardar." onClear={onClearNextContact} />
        )}

        <div className="border-border/60 space-y-3 border-t pt-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Bell className="size-4 text-amber-500" />
            Agregar recordatorio
          </p>
          <Input
            value={reminderDescription}
            onChange={(event) => onReminderDescriptionChange(event.target.value)}
            placeholder="Descripción"
          />
          <Input
            type="datetime-local"
            value={reminderAt}
            onChange={(event) => onReminderAtChange(event.target.value)}
          />
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            disabled={!reminderDescription || !reminderAt}
            onClick={onAddReminder}
          >
            Agregar a la lista
          </Button>

          {reminderDrafts.length > 0 && (
            <ul className="space-y-1.5">
              {reminderDrafts.map((reminder, index) => (
                <li
                  key={`${reminder.description}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                >
                  <span className="text-xs text-amber-700">{reminder.description}</span>
                  <button type="button" onClick={() => onRemoveReminder(index)} className="shrink-0 text-amber-500 hover:text-amber-700">
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DraftChip({ color, text, onClear }: { color: "violet" | "amber" | "sky"; text: string; onClear: () => void }) {
  const classes = {
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
  }[color]

  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${classes}`}>
      <span className="text-xs">{text}</span>
      <button type="button" onClick={onClear} className="shrink-0 opacity-70 hover:opacity-100">
        <X className="size-3.5" />
      </button>
    </div>
  )
}
