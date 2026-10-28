import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TriangleAlert, CheckCircle, Clock, Building2, Sparkles, History, Ticket, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { alertStatusClasses, alertStatusLabels } from "@/lib/alert-status";
import { useAuthStore } from "@/store/auth-store";
import { alertsApi, type Alert } from "@/api/alerts";
import { useAlerts, useResolveAlert } from "../_hooks/use-alerts";
import { AlertOperations } from "./alert-operations";
import { AlertTimelineDrawer } from "./alert-timeline-drawer";
import { CreateAlertDialog } from "./create-alert-dialog";

type Filter = Alert["status"] | "all";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function AlertsContent() {
  const [filter, setFilter] = useState<Filter>("REPORTED");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canResolve = user?.role === "FOUNDATION";
  const { data: alerts = [] } = useAlerts(filter);
  const resolveAlert = useResolveAlert();

  const sorted = [...alerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  async function handleResolve(alert: Alert, e: React.MouseEvent) {
    e.stopPropagation();
    const notes = resolutionNotes.trim();
    if (!notes) return;
    try {
      await resolveAlert.mutateAsync({ id: alert.id, resolutionNotes: notes });
      setConfirmId(null);
      setResolutionNotes("");
    } catch (err) {
      toast.error("No se pudo resolver la alerta", {
        description: err instanceof Error ? err.message : "Error inesperado",
      });
    }
  }

  async function handleReview(alert: Alert, event: React.MouseEvent) {
    event.stopPropagation();
    try {
      await alertsApi.update(alert.id, { status: "IN_REVIEW" });
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alerta en revisión");
    } catch (err) {
      toast.error("No se pudo pasar la alerta a revisión", {
        description: err instanceof Error ? err.message : "Error inesperado",
      });
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Header & New Alert Button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Alertas e Incidentes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {alerts.length} {alerts.length === 1 ? "alerta registrada" : "alertas registradas"} con seguimiento, tickets WhatsApp e IA
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-sm font-medium text-xs h-9 px-4"
        >
          <Plus className="size-4" />
          Nueva Alerta
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(
          [
            { value: "REPORTED" as Filter, label: "Reportadas" },
            { value: "IN_REVIEW" as Filter, label: "En revisión" },
            { value: "RESOLVED" as Filter, label: "Resueltas" },
            { value: "all" as Filter, label: "Todas" },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              filter === value
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30",
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "alerta" : "alertas"}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <p className="text-sm font-medium text-foreground">
            Sin alertas
          </p>
          <p className="text-xs text-muted-foreground">
            {filter === "REPORTED"
              ? "No hay alertas reportadas."
              : filter === "IN_REVIEW"
                ? "No hay alertas en revisión."
                : filter === "RESOLVED"
                  ? "No hay alertas resueltas."
                  : "No hay alertas registradas."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((alert) => {
            const isOpen = alert.status !== "RESOLVED";
            const isPending = confirmId === alert.id;

            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={cn(
                  "rounded-xl border bg-card p-4 transition-all duration-200 cursor-pointer hover:shadow-md",
                  alert.status === "REPORTED" && "border-l-4 border-l-red-500",
                  alert.status === "IN_REVIEW" && "border-l-4 border-l-amber-500",
                  alert.status === "RESOLVED" && "border-l-4 border-l-emerald-500 opacity-80",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full shrink-0 mt-0.5",
                      isOpen ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600",
                    )}
                  >
                    {isOpen ? (
                      <TriangleAlert className="size-4" />
                    ) : (
                      <CheckCircle className="size-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Building2 className="size-3.5 text-muted-foreground" />
                          <p className="text-sm font-semibold text-foreground">
                            {alert.healthCenterName}
                          </p>
                          {alert.ticketNumber && (
                            <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 text-[10px] font-mono">
                              <Ticket className="size-2.5 mr-1 text-slate-500" />
                              {alert.ticketNumber}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-medium text-foreground/90 mt-0.5">
                          {alert.title}
                        </p>
                        {alert.categoryLabel && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {alert.categoryLabel}
                          </p>
                        )}

                        {/* Patient Information Badge */}
                        {alert.patientFullName && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border w-fit font-medium">
                            <User className="size-3.5 text-red-600 shrink-0" />
                            <span className="text-foreground">
                              Paciente: <strong className="text-foreground">{alert.patientFullName}</strong>
                            </span>
                            {alert.patientDni && (
                              <span className="text-[11px] text-muted-foreground">| DNI: {alert.patientDni}</span>
                            )}
                            {alert.patientPhone && (
                              <span className="text-[11px] text-emerald-700 font-semibold">| Tel: {alert.patientPhone}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {alert.aiSummary && (
                          <Badge variant="outline" className="bg-indigo-50/50 text-indigo-700 border-indigo-200 text-[10px]">
                            <Sparkles className="size-2.5 mr-1" />
                            IA Resumido
                          </Badge>
                        )}
                        <Badge
                          className={cn(
                            "border text-xs font-medium shrink-0",
                            alertStatusClasses[alert.status],
                          )}
                        >
                          {alertStatusLabels[alert.status]}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {alert.description}
                    </p>
                    {alert.aiSummary && (
                      <p className="mt-2 rounded-md border border-indigo-100 bg-indigo-50/60 p-2 text-xs leading-relaxed text-indigo-950">
                        {alert.aiSummary}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-3 flex-wrap text-xs text-muted-foreground border-t pt-2.5">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>
                          Reportada el {formatDate(alert.createdAt)}
                          {alert.createdByName && ` por ${alert.createdByName}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlert(alert);
                          }}
                        >
                          <History className="size-3 mr-1" />
                          Línea de Tiempo / Bot IA
                        </Button>

                        {alert.status === "REPORTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={(event) => handleReview(alert, event)}
                          >
                            Pasar a revisión
                          </Button>
                        )}

                        {isOpen && canResolve && (
                          <div>
                            {isPending ? (
                              <div
                                className="flex flex-col gap-2 p-1.5 rounded-lg bg-red-50 border border-red-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Textarea
                                  value={resolutionNotes}
                                  onChange={(event) => setResolutionNotes(event.target.value)}
                                  placeholder="Nota del procedimiento (obligatoria)"
                                  className="min-h-16 bg-white text-xs"
                                />
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-red-800 font-medium">
                                    ¿Resolver?
                                  </span>
                                  <Button
                                    size="sm"
                                    className="h-6 text-[10px] bg-red-600 hover:bg-red-700 px-2 text-white"
                                    onClick={(e) => handleResolve(alert, e)}
                                    disabled={resolveAlert.isPending || !resolutionNotes.trim()}
                                  >
                                    Sí
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-[10px] px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmId(null);
                                      setResolutionNotes("");
                                    }}
                                  >
                                    No
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResolutionNotes("");
                                  setConfirmId(alert.id);
                                }}
                              >
                                Marcar resuelta
                              </Button>
                            )}
                          </div>
                        )}
                        <AlertOperations alert={alert} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Alert Dialog Modal */}
      <CreateAlertDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Timeline & AI Process Summary Drawer */}
      <AlertTimelineDrawer
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </div>
  );
}
