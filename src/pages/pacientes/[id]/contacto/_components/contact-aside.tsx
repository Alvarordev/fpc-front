import { Brain, TriangleAlert, Send, CalendarPlus, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContactAsideProps {
  isScheduleMode: boolean;
  isPending: boolean;
  onPsicoOpen: () => void;
  onAlertOpen: () => void;
  onNextContactOpen: () => void;
  onReminderOpen: () => void;
  psicoDraft: boolean;
  alertDraft: boolean;
  nextContactDraft: boolean;
  reminderDraftCount: number;
  onClearNextContact: () => void;
  onClearReminders: () => void;
  onCancel: () => void;
}

export function ContactAside({
  isScheduleMode,
  isPending,
  onPsicoOpen,
  onAlertOpen,
  onNextContactOpen,
  onReminderOpen,
  psicoDraft,
  alertDraft,
  nextContactDraft,
  reminderDraftCount,
  onClearNextContact,
  onClearReminders,
  onCancel,
}: ContactAsideProps) {
  return (
    <Card className="border-border/60 sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {isScheduleMode ? "Acciones" : "Intervenciones y cierre"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isScheduleMode && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onPsicoOpen}
            >
              <Brain className="size-4 text-violet-500" />
              Agendar psicosesión
            </Button>
            {psicoDraft && (
              <p className="text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-md px-3 py-2">
                Psicosesión lista para guardar.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onAlertOpen}
            >
              <TriangleAlert className="size-4 text-amber-500" />
              Reportar alerta hospitalaria
            </Button>
            {alertDraft && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Alerta lista para registrar.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onReminderOpen}
            >
              <Bell className="size-4 text-amber-500" />
              Agregar recordatorio
            </Button>
            {reminderDraftCount > 0 ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <span className="text-xs text-amber-700">
                  {reminderDraftCount} recordatorio{reminderDraftCount !== 1 ? "s" : ""} listo{reminderDraftCount !== 1 ? "s" : ""} para guardar.
                </span>
                <button
                  type="button"
                  onClick={onClearReminders}
                  className="shrink-0 text-amber-500 hover:text-amber-700"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <Bell className="size-4 text-amber-600 shrink-0" />
                <span className="text-xs text-amber-700">
                  Sin recordatorios agregados.
                </span>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onNextContactOpen}
            >
              <CalendarPlus className="size-4 text-sky-500" />
              Agendar siguiente contacto
            </Button>
            {nextContactDraft ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                <span className="text-xs text-sky-700">
                  Siguiente contacto listo para guardar.
                </span>
                <button
                  type="button"
                  onClick={onClearNextContact}
                  className="shrink-0 text-sky-500 hover:text-sky-700"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                <CalendarPlus className="size-4 text-sky-600 shrink-0" />
                <span className="text-xs text-sky-700">
                  Sin siguiente contacto agendado.
                </span>
              </div>
            )}
          </>
        )}

        <div className="pt-2 border-t border-border/60 space-y-2">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Send className="size-4" />
                Guardando...
              </span>
            ) : isScheduleMode ? (
              "Agendar contacto"
            ) : (
              "Guardar contacto"
            )}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
