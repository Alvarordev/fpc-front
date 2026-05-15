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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { volunteersApi, availabilityApi } from "@/lib/api";
import type { Volunteer, AvailabilitySlot } from "@/types";

const psicoSchema = z.object({
  volunteerId: z.string().min(1, "Seleccioná un voluntario"),
  slotId: z.string().min(1, "Seleccioná un horario"),
  modality: z.enum(["CALL", "VIDEO_CALL"]),
  slotDate: z.string(),
  slotStartTime: z.string(),
});

export type PsicoFormValues = z.infer<typeof psicoSchema>;

function formatSlot(slot: AvailabilitySlot): string {
  const date = new Date(slot.date + "T12:00:00").toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${date} — ${slot.startTime.slice(0, 5)} a ${slot.endTime.slice(0, 5)}`;
}

interface PsicoSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PsicoFormValues) => void;
}

export function PsicoSessionDialog({ open, onOpenChange, onSave }: PsicoSessionDialogProps) {
  const { data: volunteers = [] } = useQuery<Volunteer[]>({
    queryKey: ["volunteers"],
    queryFn: () => volunteersApi.list(),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const form = useForm<PsicoFormValues>({
    resolver: zodResolver(psicoSchema),
    defaultValues: { volunteerId: "", slotId: "", modality: "CALL" },
  });

  const selectedVolunteerId = form.watch("volunteerId");

  const { data: slots = [] } = useQuery<AvailabilitySlot[]>({
    queryKey: ["availability", selectedVolunteerId],
    queryFn: () => availabilityApi.list(selectedVolunteerId),
    enabled: Boolean(selectedVolunteerId) && open,
  });

  const availableSlots = slots.filter((s) => s.status === "AVAILABLE");

  async function handleSave() {
    const valid = await form.trigger();
    if (!valid) return;
    const values = form.getValues();
    const selectedSlot = slots.find((s) => s.id === values.slotId);
    onSave({
      ...values,
      slotDate: selectedSlot?.date ?? "",
      slotStartTime: selectedSlot?.startTime ?? "",
    });
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar psicosesión</DialogTitle>
          <DialogDescription>
            Esta programación quedará vinculada al contacto cuando guardes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Voluntario / Psicólogo</Label>
            <Controller
              name="volunteerId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue("slotId", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar voluntario" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteers.filter((v) => v.isActive).map((vol) => (
                      <SelectItem key={vol.id} value={vol.id}>
                        {vol.firstName} {vol.lastName} — {vol.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Horario disponible</Label>
            <Controller
              name="slotId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!selectedVolunteerId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedVolunteerId
                          ? "Primero seleccioná voluntario"
                          : availableSlots.length === 0
                          ? "Sin horarios disponibles"
                          : "Seleccionar horario"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {formatSlot(slot)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Modalidad</Label>
            <Controller
              name="modality"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CALL">Llamada</SelectItem>
                    <SelectItem value="VIDEO_CALL">Videollamada</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar programación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
