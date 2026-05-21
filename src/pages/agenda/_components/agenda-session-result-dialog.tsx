import { useEffect, useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { ExternalLink, FlaskConical } from "lucide-react";
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
import {
  DistressThermometer,
  type DistressFormValues,
} from "./distress-thermometer";

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
  showTest: boolean;
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
  const [wizardStep, setWizardStep] = useState<"session" | "test">("session");
  const [savedSessionValues, setSavedSessionValues] = useState<FormValues | null>(null);

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

  const watchedValues = watch();
  useEffect(() => {
    if (!appointment || !open) return;
    sessionStorage.setItem(storageKey, JSON.stringify(watchedValues));
  }, [watchedValues, appointment, open, storageKey]);

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
      setWizardStep("session");
    }
    onOpenChange(nextOpen);
  }

  async function onSubmit(values: FormValues) {
    if (!appointment) return;

    if (values.showTest) {
      setSavedSessionValues(values);
      setWizardStep("test");
      return;
    }

    await completeMutation.mutateAsync({
      id: appointment.id,
      data: values,
    });
    handleOpenChange(false);
  }

  function handleTestSubmit(_testValues: DistressFormValues) {
    if (savedSessionValues && appointment) {
      completeMutation.mutate({
        id: appointment.id,
        data: savedSessionValues,
      });
    }
    handleOpenChange(false);
  }

  function handleTestCancel() {
    handleOpenChange(false);
  }

  async function handleCancelSession() {
    if (!appointment) return;
    await cancelMutation.mutateAsync(appointment.id);
    handleOpenChange(false);
  }

  const isPending = completeMutation.isPending || cancelMutation.isPending;
  const timeDisplay = appointment?.scheduledAt.slice(11, 16) ?? "";
  const showTest = watch("showTest");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        {wizardStep === "session" ? (
          <>
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

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1">
              <div className="flex gap-6 min-h-0 flex-1">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-2">
                  <div className="space-y-2">
                    <Label>Tema abordado</Label>
                    <Textarea
                      {...register("topicAddressed")}
                      placeholder="Ej: Ansiedad por diagnóstico oncológico, manejo del duelo..."
                      className="min-h-20 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Detalles de la sesión</Label>
                    <Textarea
                      {...register("sessionDetails")}
                      placeholder="Describí lo trabajado durante la sesión..."
                      className="min-h-24 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Observaciones adicionales</Label>
                    <Textarea
                      {...register("additionalObservations")}
                      placeholder="Actitud del paciente, nivel de participación..."
                      className="min-h-20 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Recomendaciones</Label>
                    <Textarea
                      {...register("recommendations")}
                      placeholder="Ejercicios para casa, lecturas sugeridas..."
                      className="min-h-20 resize-none"
                    />
                  </div>

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

                <aside className="w-48 shrink-0 border-l border-border/60 pl-4">
                  <Controller
                    name="showTest"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border/60 bg-muted/20 p-4">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="mt-0.5 size-4 rounded accent-primary cursor-pointer shrink-0"
                        />
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <FlaskConical className="size-3 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium leading-tight">
                              Termómetro de Distrés
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Test NCCN para evaluar malestar en la última semana.
                          </p>
                        </div>
                      </label>
                    )}
                  />
                </aside>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelSession}
                  disabled={isPending}
                >
                  Cancelar sesión
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || isSubmitting || !appointment}
                >
                  {isPending
                    ? "Guardando..."
                    : showTest
                      ? "Siguiente"
                      : "Completar sesión"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Termómetro de Distrés</DialogTitle>
              <DialogDescription className="mt-1">
                <span className="text-xs text-muted-foreground">
                  {patientName}
                </span>
              </DialogDescription>
            </DialogHeader>

            <DistressThermometer
              onSubmit={handleTestSubmit}
              onCancel={handleTestCancel}
            />
          </>
        )}
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
    showTest: false,
  };
}
