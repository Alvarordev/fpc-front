import { useEffect, useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { ExternalLink, FlaskConical } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  SheetDescription,
} from "@/components/ui/sheet";
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

type Outcome = "COMPLETED" | "CANCELLED";

interface FormValues {
  outcome: Outcome;
  topicAddressed: string;
  sessionDetails: string;
  additionalObservations: string;
  recommendations: string;
  referral: ReferralType | "";
  showTest: boolean;
}

interface AgendaSessionResultSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: PsychooncologyAppointment | null;
  patientName: string;
  patientId: string;
  volunteerId: string | undefined;
}

export function AgendaSessionResultSheet({
  open,
  onOpenChange,
  appointment,
  patientName,
  patientId,
}: AgendaSessionResultSheetProps) {
  const queryClient = useQueryClient();
  const storageKey = appointment ? `${STORAGE_PREFIX}${appointment.id}` : "";
  const [wizardStep, setWizardStep] = useState<"session" | "test">("session");

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

  const outcome = watch("outcome");
  const isCompleting = outcome === "COMPLETED";

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

    if (values.outcome === "COMPLETED") {
      await completeMutation.mutateAsync({
        id: appointment.id,
        data: values,
      });
    } else {
      await cancelMutation.mutateAsync(appointment.id);
    }

    // If test is toggled on and patient attended, go to test step
    if (values.showTest && values.outcome === "COMPLETED") {
      setWizardStep("test");
      return;
    }

    handleOpenChange(false);
  }

  function handleTestSubmit(_testValues: DistressFormValues) {
    // TODO: save test results to backend
    handleOpenChange(false);
  }

  function handleTestCancel() {
    handleOpenChange(false);
  }

  const isPending = completeMutation.isPending || cancelMutation.isPending;
  const timeDisplay = appointment?.scheduledAt.slice(11, 16) ?? "";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-full max-h-[85vh] flex-col rounded-t-xl"
      >
        {wizardStep === "session" ? (
          <>
            <SheetHeader className="border-border/60 border-b px-4 py-4 shrink-0">
              <SheetTitle>Registrar sesión</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
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
              </SheetDescription>
            </SheetHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
                {/* Outcome selector */}
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

                {/* Completion fields — only when patient attended */}
                {isCompleting && (
                  <>
                    <div className="space-y-2">
                      <Label>Tema abordado</Label>
                      <Textarea
                        {...register("topicAddressed")}
                        placeholder="Ej: Ansiedad por diagnóstico oncológico..."
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
                            <SelectTrigger className="w-full">
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

                    {/* ── Test toggle ── */}
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <Controller
                        name="showTest"
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-start gap-3 cursor-pointer">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FlaskConical className="size-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  Aplicar Termómetro de Distrés
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Test de screening rápido (NCCN). Evalúa el nivel
                                de malestar en la última semana.
                              </p>
                            </div>
                          </label>
                        )}
                      />
                    </div>
                  </>
                )}
              </div>

              <SheetFooter className="border-border/60 shrink-0 border-t p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isPending || isSubmitting || !appointment
                  }
                  className="flex-1"
                >
                  {isPending
                    ? "Guardando..."
                    : watch("showTest") && isCompleting
                      ? "Guardar y continuar al test"
                      : "Guardar sesión"}
                </Button>
              </SheetFooter>
            </form>
          </>
        ) : (
          <>
            <SheetHeader className="border-border/60 border-b px-4 py-4 shrink-0">
              <SheetTitle>Termómetro de Distrés</SheetTitle>
              <SheetDescription className="mt-1">
                <span className="text-xs text-muted-foreground">
                  {patientName}
                </span>
              </SheetDescription>
            </SheetHeader>

            <DistressThermometer
              onSubmit={handleTestSubmit}
              onCancel={handleTestCancel}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function getDefaults(): FormValues {
  return {
    outcome: "COMPLETED",
    topicAddressed: "",
    sessionDetails: "",
    additionalObservations: "",
    recommendations: "",
    referral: "",
    showTest: false,
  };
}
