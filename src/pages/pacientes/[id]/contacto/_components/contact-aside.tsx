import { Brain, TriangleAlert, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContactAsideProps {
  isScheduleMode: boolean;
  isPending: boolean;
  onPsicoOpen: () => void;
  onAlertOpen: () => void;
  psicoDraft: boolean;
  alertDraft: boolean;
  onCancel: () => void;
}

export function ContactAside({
  isScheduleMode,
  isPending,
  onPsicoOpen,
  onAlertOpen,
  psicoDraft,
  alertDraft,
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
