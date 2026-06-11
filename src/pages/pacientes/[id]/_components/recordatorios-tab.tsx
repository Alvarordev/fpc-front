import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BellPlus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useRecordatorios } from "../_hooks/use-recordatorios";
import { recordatoriosApi } from "@/lib/api";
import { ReminderCard } from "./reminder-card";
import { CreateReminderDialog } from "./create-reminder-dialog";
import { toast } from "sonner";
import type { Reminder, CreateReminderRequest, UpdateReminderRequest } from "@/types";

interface RecordatoriosTabProps {
  pacienteId: string;
}

export function RecordatoriosTab({ pacienteId }: RecordatoriosTabProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const canManage = user?.role === "ADMIN" || user?.role === "AGENT";

  const { data: reminders = [], isLoading } = useRecordatorios(pacienteId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const sorted = [...reminders].sort(
    (a, b) => a.scheduledDate.localeCompare(b.scheduledDate)
  );

  const pendientes = sorted.filter((r) => r.status === "PENDIENTE");
  const completados = sorted.filter((r) => r.status !== "PENDIENTE");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["recordatorios", pacienteId] });
  }

  function openCreate() {
    setEditingReminder(null);
    setDialogOpen(true);
  }

  function openEdit(reminder: Reminder) {
    setEditingReminder(reminder);
    setDialogOpen(true);
  }

  async function handleSave(data: CreateReminderRequest | UpdateReminderRequest) {
    if (editingReminder) {
      await recordatoriosApi.update(editingReminder.id, data as UpdateReminderRequest);
      toast.success("Recordatorio actualizado");
    } else {
      await recordatoriosApi.create(data as CreateReminderRequest);
      toast.success("Recordatorio creado");
    }
    invalidate();
  }

  async function handleComplete(reminder: Reminder) {
    try {
      await recordatoriosApi.complete(reminder.id);
      toast.success("Recordatorio marcado como completado");
      invalidate();
    } catch {
      toast.error("No se pudo completar el recordatorio");
    }
  }

  async function handleCancel(reminder: Reminder) {
    try {
      await recordatoriosApi.cancel(reminder.id);
      toast.success("Recordatorio cancelado");
      invalidate();
    } catch {
      toast.error("No se pudo cancelar el recordatorio");
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recordatorios</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
            {completados.length > 0 && ` · ${completados.length} completado${completados.length !== 1 ? "s" : ""}`}
          </p>
          {sorted.length > 0 && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              Los recordatorios se ordenan por fecha programada
            </p>
          )}
        </div>
        {canManage && (
          <Button type="button" size="sm" className="gap-1.5" onClick={openCreate}>
            <BellPlus className="size-3.5" />Agregar
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">Cargando recordatorios...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <ClipboardList className="size-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">Sin recordatorios</p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Registrá citas, procedimientos o medicaciones para hacer seguimiento.
          </p>
          {canManage && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5 mt-3" onClick={openCreate}>
              <BellPlus className="size-3.5" />Crear recordatorio
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pendientes.length > 0 && (
            <div className="space-y-2">
              {pendientes.map((r) => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  canManage={canManage}
                  onEdit={openEdit}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}

          {completados.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-muted-foreground/80 hover:text-muted-foreground py-1 select-none">
                Completados / Cancelados ({completados.length})
              </summary>
              <div className="space-y-2 mt-2">
                {completados.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    canManage={false}
                    onEdit={() => {}}
                    onComplete={() => {}}
                    onCancel={() => {}}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      <CreateReminderDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingReminder(null);
        }}
        patientId={pacienteId}
        reminder={editingReminder}
        onSave={handleSave}
      />
    </div>
  );
}
