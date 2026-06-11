import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Reminder, CreateReminderRequest, UpdateReminderRequest, ReminderType } from "@/types";

const TYPE_OPTIONS: { value: ReminderType; label: string }[] = [
  { value: "LABORATORIO", label: "Laboratorio" },
  { value: "IMAGEN", label: "Imagen" },
  { value: "CONSULTA", label: "Consulta" },
  { value: "PROCEDIMIENTO", label: "Procedimiento" },
  { value: "MEDICACION", label: "Medicación" },
  { value: "OTRO", label: "Otro" },
];

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  contactId?: string;
  reminder?: Reminder | null; // if provided, edit mode
  onSave: (data: CreateReminderRequest | UpdateReminderRequest) => Promise<void>;
}

export function CreateReminderDialog({
  open,
  onOpenChange,
  patientId,
  contactId,
  reminder,
  onSave,
}: CreateReminderDialogProps) {
  const isEditing = !!reminder;

  const [type, setType] = useState<ReminderType>("LABORATORIO");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (reminder) {
        setType(reminder.type);
        setDescription(reminder.description);
        setScheduledDate(reminder.scheduledDate);
        setNotes(reminder.notes ?? "");
      } else {
        setType("LABORATORIO");
        setDescription("");
        setScheduledDate("");
        setNotes("");
      }
    }
  }, [open, reminder]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !scheduledDate) return;
    setSaving(true);
    try {
      const data = isEditing
        ? { type, description: description.trim(), scheduledDate, notes: notes.trim() || null }
        : { patientId, contactId, type, description: description.trim(), scheduledDate, notes: notes.trim() || null };
      await onSave(data);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar recordatorio" : "Nuevo recordatorio"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los campos del recordatorio."
              : "Registrá un recordatorio de cita, procedimiento o medicación para el paciente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
              Tipo <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as ReminderType)}>
              <SelectTrigger className="w-full bg-card border">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Hemograma completo, Tomografía de tórax..."
              className="bg-card border"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
              Fecha <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="bg-card border max-w-60"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
              Notas
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales..."
              className="bg-card border min-h-16"
              rows={2}
            />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving || !description.trim() || !scheduledDate}>
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear recordatorio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
