import { cn } from "@/lib/utils";
import {
  FlaskConical,
  Scan,
  Stethoscope,
  Syringe,
  Pill,
  Ellipsis,
  CheckCircle2,
  XCircle,
  Pencil,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Reminder, ReminderType } from "@/types";

const TYPE_CONFIG: Record<ReminderType, { icon: typeof FlaskConical; label: string; color: string }> = {
  LABORATORIO: { icon: FlaskConical, label: "Laboratorio", color: "bg-purple-500" },
  IMAGEN: { icon: Scan, label: "Imagen", color: "bg-blue-500" },
  CONSULTA: { icon: Stethoscope, label: "Consulta", color: "bg-emerald-500" },
  PROCEDIMIENTO: { icon: Syringe, label: "Procedimiento", color: "bg-amber-500" },
  MEDICACION: { icon: Pill, label: "Medicación", color: "bg-rose-500" },
  OTRO: { icon: Ellipsis, label: "Otro", color: "bg-gray-500" },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDIENTE: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  COMPLETADO: { label: "Completado", className: "bg-green-100 text-green-800 border-green-300" },
  CANCELADO: { label: "Cancelado", className: "bg-red-100 text-red-800 border-red-300" },
};

function formatDate(fecha: string): string {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface ReminderCardProps {
  reminder: Reminder;
  canManage: boolean;
  onEdit: (r: Reminder) => void;
  onComplete: (r: Reminder) => void;
  onCancel: (r: Reminder) => void;
}

export function ReminderCard({ reminder, canManage, onEdit, onComplete, onCancel }: ReminderCardProps) {
  const config = TYPE_CONFIG[reminder.type] ?? TYPE_CONFIG.OTRO;
  const statusCfg = STATUS_CONFIG[reminder.status] ?? STATUS_CONFIG.PENDIENTE;
  const Icon = config.icon;
  const isPending = reminder.status === "PENDIENTE";

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border/60 bg-card overflow-hidden",
        reminder.status === "COMPLETADO" && "opacity-70",
        reminder.status === "CANCELADO" && "opacity-50",
      )}
    >
      {/* Left color bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", config.color)} />

      <div className="pl-5 pr-4 py-3.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("shrink-0 size-7 rounded-md flex items-center justify-center", config.color, "bg-opacity-15")}>
              <Icon className="size-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{reminder.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
                  <Calendar className="size-3" />
                  {formatDate(reminder.scheduledDate)}
                </span>
                <span className="text-[10px] text-muted-foreground/50">{config.label}</span>
              </div>
            </div>
          </div>
          <span className={cn("shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border", statusCfg.className)}>
            {statusCfg.label}
          </span>
        </div>

        {/* Notes */}
        {reminder.notes && (
          <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{reminder.notes}</p>
        )}

        {/* Actions */}
        {canManage && isPending && (
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(reminder)}
            >
              <Pencil className="size-3" />Editar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => onComplete(reminder)}
            >
              <CheckCircle2 className="size-3" />Completar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onCancel(reminder)}
            >
              <XCircle className="size-3" />Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
