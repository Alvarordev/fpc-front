import { useState } from "react";
import { TriangleAlert, CheckCircle, X, Clock, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAlerts, useResolveAlert } from "../_hooks/use-alerts";
import type { Alert } from "@/types";

type Filter = "ACTIVE" | "RESOLVED" | "all";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AlertsContent() {
  const [filter, setFilter] = useState<Filter>("ACTIVE");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const { data: alerts = [] } = useAlerts(filter);
  const resolveAlert = useResolveAlert();

  const sorted = [...alerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  async function handleResolve(alert: Alert) {
    if (!user) return;
    await resolveAlert.mutateAsync({
      id: alert.id,
      resolvedByAgentId: user.id,
    });
    setConfirmId(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Alertas
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {(
          [
            { value: "ACTIVE" as Filter, label: "Activas" },
            { value: "all" as Filter, label: "Todas" },
            { value: "RESOLVED" as Filter, label: "Resueltas" },
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
            {filter === "ACTIVE"
              ? "No hay alertas activas en este momento."
              : filter === "RESOLVED"
                ? "No hay alertas resueltas."
                : "No hay alertas registradas."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((alert) => {
            const isActive = alert.status === "ACTIVE";
            const isPending = confirmId === alert.id;

            return (
              <div
                key={alert.id}
                className={cn(
                  "rounded-xl border bg-card p-4",
                  isActive && "border-l-4 border-l-red-400",
                  !isActive && "border-l-4 border-l-emerald-400 opacity-75",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full shrink-0",
                      isActive ? "bg-red-50" : "bg-emerald-50",
                    )}
                  >
                    {isActive ? (
                      <TriangleAlert className="size-4 text-red-600" />
                    ) : (
                      <CheckCircle className="size-4 text-emerald-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="size-3.5 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">
                            {alert.healthCenterName}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {alert.title}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "border text-xs font-medium shrink-0",
                          isActive
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200",
                        )}
                      >
                        {isActive ? "Activa" : "Resuelta"}
                      </Badge>
                    </div>

                    <p className="text-sm text-foreground mt-2 leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      <span>
                        Reportada el {formatDate(alert.createdAt)}
                        {alert.createdByAgentName &&
                          ` por ${alert.createdByAgentName}`}
                      </span>
                      {alert.resolvedAt && (
                        <span className="ml-2">
                          · Resuelta el {formatDate(alert.resolvedAt)}
                          {alert.resolvedByAgentName &&
                            ` por ${alert.resolvedByAgentName}`}
                        </span>
                      )}
                    </div>

                    {isActive && (
                      <div className="mt-3">
                        {isPending ? (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-xs text-red-800 flex-1 font-medium">
                              ¿Confirmar que este problema fue resuelto?
                            </p>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-red-600 hover:bg-red-700"
                              onClick={() => handleResolve(alert)}
                              disabled={resolveAlert.isPending}
                            >
                              <CheckCircle className="size-3 mr-1" />
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => setConfirmId(null)}
                            >
                              <X className="size-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setConfirmId(alert.id)}
                          >
                            Marcar como resuelta
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
