import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { healthCentersApi } from "@/lib/api";

const alertSchema = z.object({
  healthCenterId: z.string().min(1, "Seleccioná un establecimiento"),
  title: z.string().min(3, "Título requerido"),
  description: z.string().min(5, "Detallá el problema reportado"),
});

export type AlertFormValues = z.infer<typeof alertSchema>;

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: AlertFormValues) => void;
}

export function AlertDialog({ open, onOpenChange, onSave }: AlertDialogProps) {
  const { data: hospitals = [] } = useQuery({
    queryKey: ["health-centers"],
    queryFn: () => healthCentersApi.list(),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const form = useForm<AlertFormValues>({
    resolver: zodResolver(alertSchema),
    defaultValues: { healthCenterId: "", title: "", description: "" },
  });

  async function handleSave() {
    const valid = await form.trigger();
    if (!valid) return;
    onSave(form.getValues());
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar alerta hospitalaria</DialogTitle>
          <DialogDescription>
            La alerta se creará al guardar el contacto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Establecimiento</Label>
            <Controller
              name="healthCenterId"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar establecimiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((h) => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Textarea
              {...form.register("title")}
              className="min-h-16 resize-none"
              placeholder="Título resumido de la alerta..."
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Detalle</Label>
            <Textarea
              {...form.register("description")}
              className="min-h-24 resize-none"
              placeholder="Describí el problema reportado por el paciente..."
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar alerta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
