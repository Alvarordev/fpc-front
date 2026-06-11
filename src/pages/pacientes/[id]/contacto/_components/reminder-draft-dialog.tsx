import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReminderType } from "@/types";

const TYPE_OPTIONS: { value: ReminderType; label: string }[] = [
  { value: "LABORATORIO", label: "Laboratorio" },
  { value: "IMAGEN", label: "Imagen" },
  { value: "CONSULTA", label: "Consulta" },
  { value: "PROCEDIMIENTO", label: "Procedimiento" },
  { value: "MEDICACION", label: "Medicación" },
  { value: "OTRO", label: "Otro" },
];

const reminderSchema = z.object({
  type: z.enum(["LABORATORIO", "IMAGEN", "CONSULTA", "PROCEDIMIENTO", "MEDICACION", "OTRO"] as const),
  description: z.string().min(1, "Descripción requerida"),
  scheduledDate: z.string().min(1, "Fecha requerida"),
  notes: z.string().optional(),
});

export type ReminderDraftFormValues = z.infer<typeof reminderSchema>;

interface ReminderDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ReminderDraftFormValues) => void;
}

export function ReminderDraftDialog({ open, onOpenChange, onSave }: ReminderDraftDialogProps) {
  const form = useForm<ReminderDraftFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      type: "LABORATORIO",
      description: "",
      scheduledDate: "",
      notes: "",
    },
  });

  function handleSubmit(values: ReminderDraftFormValues) {
    onSave(values);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo recordatorio</DialogTitle>
          <DialogDescription>
            Registrá una cita, procedimiento o medicación próxima del paciente.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
              Tipo <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />
            {form.formState.errors.type && (
              <p className="text-xs text-destructive">{form.formState.errors.type.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Input
              {...form.register("description")}
              placeholder="Ej: Hemograma completo, Tomografía de tórax..."
              className="bg-card border"
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
              Fecha <span className="text-destructive">*</span>
            </Label>
            <Input
              {...form.register("scheduledDate")}
              type="date"
              className="bg-card border max-w-60"
            />
            {form.formState.errors.scheduledDate && (
              <p className="text-xs text-destructive">{form.formState.errors.scheduledDate.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
              Notas
            </Label>
            <Textarea
              {...form.register("notes")}
              placeholder="Detalles adicionales..."
              className="bg-card border min-h-16"
              rows={2}
            />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!form.formState.isValid}>
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
