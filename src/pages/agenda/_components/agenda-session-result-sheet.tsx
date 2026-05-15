import { useForm, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "@/lib/api";
import { toast } from "sonner";
import type { PsychooncologyAppointment } from "@/types";

interface AgendaSessionResultSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: PsychooncologyAppointment | null;
  patientName: string;
  volunteerId: string | undefined;
}

type Outcome = "COMPLETED" | "CANCELLED";

interface FormValues {
  outcome: Outcome;
  notes: string;
}

export function AgendaSessionResultSheet({
  open,
  onOpenChange,
  appointment,
  patientName,
  volunteerId,
}: AgendaSessionResultSheetProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      outcome: "COMPLETED",
      notes: "",
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({
      id,
      notes,
    }: {
      id: string;
      notes: string;
    }) =>
      appointmentsApi.complete(id, {
        sessionDetails: notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Sesión registrada como completada");
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: () => {
      toast.error("Error al registrar la sesión");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: () => {
      toast.success("Sesión cancelada");
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: () => {
      toast.error("Error al cancelar la sesión");
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset({ outcome: "COMPLETED", notes: "" });
    }
    onOpenChange(nextOpen);
  }

  async function onSubmit(values: FormValues) {
    if (!appointment) return;

    if (values.outcome === "COMPLETED") {
      await completeMutation.mutateAsync({
        id: appointment.id,
        notes: values.notes,
      });
    } else {
      await cancelMutation.mutateAsync(appointment.id);
    }

    handleOpenChange(false);
  }

  const isPending = completeMutation.isPending || cancelMutation.isPending;

  const timeDisplay = appointment
    ? appointment.scheduledAt.slice(11, 16)
    : "";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "max-h-[85vh] rounded-t-xl"
            : "flex flex-col gap-0 p-0 sm:max-w-md"
        }
      >
        <SheetHeader className="border-border/60 border-b px-4 py-4">
          <SheetTitle>Registrar sesión</SheetTitle>
          {appointment && (
            <p className="text-muted-foreground text-sm">
              {patientName} · {timeDisplay}
            </p>
          )}
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex h-full flex-col"
        >
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                ¿El paciente asistió?
              </Label>
              <Controller
                name="outcome"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETED">
                        Sí, asistió
                      </SelectItem>
                      <SelectItem value="CANCELLED">
                        No asistió / cancelar
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Notas de la sesión
              </Label>
              <Textarea
                {...register("notes")}
                placeholder="Registra observaciones, acuerdos y próximos pasos..."
                className="min-h-32 resize-none"
              />
            </div>
          </div>

          <SheetFooter className="border-border/60 border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isPending || isSubmitting || !appointment
              }
            >
              {isPending ? "Guardando..." : "Guardar sesión"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
