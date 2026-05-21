import { useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "@/lib/api";
import { toast } from "sonner";
import type { PsychooncologyAppointment, ReferralType } from "@/types";

const STORAGE_PREFIX = "agenda-session-form-";

const referralLabels: Record<ReferralType, string> = {
  PSYCHIATRY: "Psiquiatría",
  NEUROLOGY: "Neurología",
  CONTINUE_PSYCHOLOGY: "Continuar psicología",
  PSYCHOONCOLOGIST: "Derivar a psicooncólogo",
  NONE: "Ninguna",
};

interface FormValues {
  topicAddressed: string;
  sessionDetails: string;
  additionalObservations: string;
  recommendations: string;
  referral: ReferralType | "";
}

interface AgendaSessionResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: PsychooncologyAppointment | null;
  patientName: string;
  patientId: string;
  volunteerId: string | undefined;
}

export function AgendaSessionResultDialog({
  open,
  onOpenChange,
  appointment,
  patientName,
  patientId,
}: AgendaSessionResultDialogProps) {
  const queryClient = useQueryClient();
  const storageKey = appointment ? `${STORAGE_PREFIX}${appointment.id}` : "";

  const loadDraft = useCallback((): FormValues => {
    if (!appointment) return getDefaults();
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw) as FormValues;
    } catch { /* ignore corrupt data */ }
    return getDefaults();
  }, [appointment, storageKey]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: getDefaults(),
  });

  // Save draft to sessionStorage on every change
  const watchedValues = watch();
  useEffect(() => {
    if (!appointment || !open) return;
    sessionStorage.setItem(storageKey, JSON.stringify(watchedValues));
  }, [watchedValues, appointment, open, storageKey]);

  // Restore draft when opening
  useEffect(() => {
    if (open && appointment) {
      reset(loadDraft());
    }
  }, [open, appointment, reset, loadDraft]);

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) =>
      appointmentsApi.complete(id, {
        topicAddressed: data.topicAddressed || undefined,
        sessionDetails: data.sessionDetails || undefined,
        additionalObservations: data.additionalObservations || undefined,
        recommendations: data.recommendations || undefined,
        referral: (data.referral as ReferralType) || undefined,
      }),
    onSuccess: () => {
      toast.success("Sesión registrada correctamente");
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
      clearDraft();
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
      clearDraft();
    },
    onError: () => {
      toast.error("Error al cancelar la sesión");
    },
  });

  function clearDraft() {
    if (storageKey) sessionStorage.removeItem(storageKey);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset(getDefaults());
      clearDraft();
    }
    onOpenChange(nextOpen);
  }

  async function onSubmit(values: FormValues) {
    if (!appointment) return;
    await completeMutation.mutateAsync({
      id: appointment.id,
      data: values,
    });
    handleOpenChange(false);
  }

  async function handleCancel() {
    if (!appointment) return;
    await cancelMutation.mutateAsync(appointment.id);
    handleOpenChange(false);
  }

  const isPending = completeMutation.isPending || cancelMutation.isPending;
  const timeDisplay = appointment?.scheduledAt.slice(11, 16) ?? "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Registrar sesión</DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-1">
              <span>
                {patientName} · {timeDisplay}
              </span>
              <a
                href={`/pacientes/${patientId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
              >
                Ver ficha
                <ExternalLink className="size-3" />
              </a>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Topic addressed */}
            <div className="space-y-2">
              <Label>Tema abordado</Label>
              <Textarea
                {...register("topicAddressed")}
                placeholder="Ej: Ansiedad por diagnóstico oncológico, manejo del duelo..."
                className="min-h-20 resize-none"
              />
            </div>

            {/* Session details */}
            <div className="space-y-2">
              <Label>Detalles de la sesión</Label>
              <Textarea
                {...register("sessionDetails")}
                placeholder="Describí lo trabajado durante la sesión: técnicas, ejercicios, dinámicas..."
                className="min-h-24 resize-none"
              />
            </div>

            {/* Additional observations */}
            <div className="space-y-2">
              <Label>Observaciones adicionales</Label>
              <Textarea
                {...register("additionalObservations")}
                placeholder="Actitud del paciente, nivel de participación, estado anímico..."
                className="min-h-20 resize-none"
              />
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <Label>Recomendaciones</Label>
              <Textarea
                {...register("recommendations")}
                placeholder="Ejercicios para casa, lecturas sugeridas, pautas para la próxima sesión..."
                className="min-h-20 resize-none"
              />
            </div>

            {/* Referral */}
            <div className="space-y-2">
              <Label>Derivación</Label>
              <Controller
                name="referral"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      {field.value
                        ? referralLabels[field.value as ReferralType]
                        : <SelectValue placeholder="Seleccionar derivación (opcional)" />}
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(referralLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancelar sesión
            </Button>
            <Button
              type="submit"
              disabled={isPending || isSubmitting || !appointment}
            >
              {completeMutation.isPending
                ? "Guardando..."
                : "Completar sesión"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getDefaults(): FormValues {
  return {
    topicAddressed: "",
    sessionDetails: "",
    additionalObservations: "",
    recommendations: "",
    referral: "",
  };
}
