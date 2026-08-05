import { useState } from "react";
import {
  X,
  Sparkles,
  Send,
  Building2,
  CheckCircle,
  TriangleAlert,
  MessageSquare,
  Share2,
  Clock,
  Loader2,
  Ticket,
  Copy,
  Check,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
  useAlertEvents,
  useAddAlertEvent,
  useGenerateAISummary,
} from "../_hooks/use-alert-timeline";
import type { Alert, AlertEventType } from "@/types";

interface AlertTimelineDrawerProps {
  alert: Alert | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function getEventIcon(type: AlertEventType) {
  switch (type) {
    case "CREATED":
      return <TriangleAlert className="size-3.5 text-amber-600" />;
    case "DERIVED":
      return <Share2 className="size-3.5 text-purple-600" />;
    case "COMMENT":
      return <MessageSquare className="size-3.5 text-blue-600" />;
    case "AI_SUMMARY_GENERATED":
      return <Sparkles className="size-3.5 text-indigo-600" />;
    case "RESOLVED":
      return <CheckCircle className="size-3.5 text-emerald-600" />;
    default:
      return <Clock className="size-3.5 text-muted-foreground" />;
  }
}

export function AlertTimelineDrawer({ alert, onClose }: AlertTimelineDrawerProps) {
  const [newComment, setNewComment] = useState("");
  const [copiedTicket, setCopiedTicket] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data: events = [], isLoading: isLoadingEvents } = useAlertEvents(alert?.id ?? null);
  const addEvent = useAddAlertEvent(alert?.id ?? null);
  const generateAI = useGenerateAISummary(alert?.id ?? null);

  if (!alert) return null;

  const isActive = alert.status === "ACTIVE";

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addEvent.mutateAsync({
      title: "Avance de Gestión",
      description: newComment.trim(),
      agentId: user?.id,
    });
    setNewComment("");
  }

  async function handleGenerateAISummary() {
    await generateAI.mutateAsync();
  }

  function handleCopyTicket() {
    if (!alert?.ticketNumber) return;
    navigator.clipboard.writeText(alert.ticketNumber);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-background border-l shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-card/50 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                {alert.healthCenterName}
              </h2>
              {alert.ticketNumber && (
                <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 font-mono text-xs">
                  <Ticket className="size-3 mr-1 text-slate-500" />
                  {alert.ticketNumber}
                </Badge>
              )}
            </div>
            <h1 className="text-base font-bold text-foreground mt-1">
              {alert.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge
                className={cn(
                  "text-xs font-medium border",
                  isActive
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200",
                )}
              >
                {isActive ? "Activa" : "Resuelta"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Prioridad: {alert.severity}
              </Badge>

              {alert.ticketNumber && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[11px] px-2 text-slate-600 hover:text-slate-900 border border-slate-200"
                  onClick={handleCopyTicket}
                >
                  {copiedTicket ? (
                    <>
                      <Check className="size-3 text-emerald-600 mr-1" />
                      Ticket copiado
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 mr-1" />
                      Copiar Ticket
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Patient Header Card */}
            {alert.patientFullName && (
              <div className="mt-2.5 p-2.5 bg-muted/40 border rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-red-600 shrink-0" />
                  <div>
                    <div className="font-bold text-foreground">
                      Paciente: {alert.patientFullName}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      {alert.patientDni && <span>DNI: {alert.patientDni}</span>}
                      {alert.patientPhone && <span className="text-emerald-700 font-medium">Tel: {alert.patientPhone}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* AI Executive Summary Card */}
          <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-background p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs">
                <Sparkles className="size-4 text-indigo-600" />
                <span>Resumen de Proceso con IA</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={handleGenerateAISummary}
                disabled={generateAI.isPending}
              >
                {generateAI.isPending ? (
                  <>
                    <Loader2 className="size-3 mr-1.5 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3 mr-1.5 text-indigo-600" />
                    {alert.aiSummary ? "Actualizar Resumen" : "Generar Resumen IA"}
                  </>
                )}
              </Button>
            </div>

            {alert.aiSummary ? (
              <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed font-mono bg-background/80 p-3 rounded-lg border border-indigo-100">
                {alert.aiSummary}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Genera un resumen ejecutivo inteligente impulsado por IA para sintetizar todos los hitos y derivaciones de esta alerta.
              </p>
            )}
          </div>

          {/* Description Card */}
          <div className="rounded-xl border bg-card p-3.5 text-xs space-y-1">
            <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
              Detalle Inicial del Caso
            </p>
            <p className="text-foreground leading-relaxed">{alert.description}</p>
          </div>

          {/* Timeline Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Línea de Tiempo del Caso ({events.length})
            </h3>

            {isLoadingEvents ? (
              <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin mr-2" />
                Cargando historial de hitos...
              </div>
            ) : events.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-3 text-center">
                Sin hitos registrados en la línea de tiempo.
              </p>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {events.map((evt) => (
                  <div key={evt.id} className="relative group">
                    {/* Icon Dot */}
                    <div className="absolute -left-6 top-0.5 flex size-5 items-center justify-center rounded-full bg-background border shadow-xs">
                      {getEventIcon(evt.eventType)}
                    </div>

                    <div className="rounded-lg border bg-card p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {evt.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(evt.createdAt)}
                        </span>
                      </div>
                      {evt.agentName && (
                        <p className="text-[11px] text-muted-foreground">
                          Por: <span className="font-medium text-foreground">{evt.agentName}</span>
                        </p>
                      )}
                      {evt.description && (
                        <p className="text-xs text-foreground/90 mt-1 leading-relaxed whitespace-pre-wrap">
                          {evt.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: New Comment Input */}
        <form onSubmit={handleAddComment} className="p-3 border-t bg-card/50 flex gap-2">
          <input
            type="text"
            placeholder="Añadir nota o avance a la línea de tiempo..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-background border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            disabled={addEvent.isPending}
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 text-xs px-3"
            disabled={addEvent.isPending || !newComment.trim()}
          >
            {addEvent.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
