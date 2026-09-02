import { useEffect, useCallback, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { ExternalLink, FlaskConical } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import { patientTabUrl } from "@/pages/pacientes/[id]/_lib/patient-tabs"
import { toast } from "sonner"
import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import type { ReferralType } from "@/types"
import { DistressThermometer } from "./distress-thermometer"

const STORAGE_PREFIX = "agenda-session-form-"

const referralLabels: Record<ReferralType, string> = {
  PSYCHIATRY: "Psiquiatría",
  NEUROLOGY: "Neurología",
  CONTINUE_PSYCHOLOGY: "Continuar psicología",
  PSYCHOONCOLOGIST: "Derivar a psicooncólogo",
  NONE: "Ninguna",
}

interface FormValues {
  topicAddressed: string
  sessionDetails: string
  additionalObservations: string
  recommendations: string
  referral: ReferralType | ""
  showTest: boolean
}

interface AgendaSessionResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: PsychooncologyAppointment | null
  patientName: string
  patientId: string
  volunteerId: string | undefined
}

export function AgendaSessionResultDialog({
  open,
  onOpenChange,
  appointment,
  patientName,
  patientId,
}: AgendaSessionResultDialogProps) {
  const queryClient = useQueryClient()
  const storageKey = appointment ? `${STORAGE_PREFIX}${appointment.id}` : ""
  const [wizardStep, setWizardStep] = useState<"session" | "test">("session")
  const [savedSessionValues, setSavedSessionValues] =
    useState<FormValues | null>(null)

  const loadDraft = useCallback((): FormValues => {
    if (!appointment) return getDefaults()
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) return JSON.parse(raw) as FormValues
    } catch {
      /* ignore corrupt data */
    }
    return getDefaults()
  }, [appointment, storageKey])

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: getDefaults(),
  })

  const watchedValues = watch()
  useEffect(() => {
    if (!appointment || !open) return
    sessionStorage.setItem(storageKey, JSON.stringify(watchedValues))
  }, [watchedValues, appointment, open, storageKey])

  useEffect(() => {
    if (open && appointment) {
      reset(loadDraft())
    }
  }, [open, appointment, reset, loadDraft])

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) =>
      psychooncologyAppointmentsApi.update(id, {
        status: "COMPLETED",
        topicAddressed: data.topicAddressed || undefined,
        sessionDetails: data.sessionDetails || undefined,
        additionalObservations: data.additionalObservations || undefined,
        recommendations: data.recommendations || undefined,
        referral: (data.referral as ReferralType) || undefined,
      }),
    onSuccess: () => {
      toast.success("Sesión registrada correctamente")
      queryClient.invalidateQueries({ queryKey: ["agenda"] })
      queryClient.invalidateQueries({
        queryKey: ["psychooncology-appointments"],
      })
      queryClient.invalidateQueries({ queryKey: ["patient-timeline"] })
      clearDraft()
    },
    onError: () => {
      toast.error("Error al registrar la sesión")
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => psychooncologyAppointmentsApi.cancel(id),
    onSuccess: () => {
      toast.success("Sesión cancelada")
      queryClient.invalidateQueries({ queryKey: ["agenda"] })
      queryClient.invalidateQueries({
        queryKey: ["psychooncology-appointments"],
      })
      queryClient.invalidateQueries({ queryKey: ["patient-timeline"] })
      clearDraft()
    },
    onError: () => {
      toast.error("Error al cancelar la sesión")
    },
  })

  function clearDraft() {
    if (storageKey) sessionStorage.removeItem(storageKey)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset(getDefaults())
      clearDraft()
      setWizardStep("session")
    }
    onOpenChange(nextOpen)
  }

  async function onSubmit(values: FormValues) {
    if (!appointment) return

    if (values.showTest) {
      setSavedSessionValues(values)
      setWizardStep("test")
      return
    }

    await completeMutation.mutateAsync({
      id: appointment.id,
      data: values,
    })
    handleOpenChange(false)
  }

  function handleTestSubmit() {
    if (savedSessionValues && appointment) {
      completeMutation.mutate({
        id: appointment.id,
        data: savedSessionValues,
      })
    }
    handleOpenChange(false)
  }

  function handleTestCancel() {
    handleOpenChange(false)
  }

  async function handleCancelSession() {
    if (!appointment) return
    await cancelMutation.mutateAsync(appointment.id)
    handleOpenChange(false)
  }

  const isPending = completeMutation.isPending || cancelMutation.isPending
  const timeDisplay = appointment?.scheduledAt?.slice(11, 16) ?? ""
  const showTest = watch("showTest")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        {wizardStep === "session" ? (
          <>
            <DialogHeader>
              <DialogTitle>Registrar sesión</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2">
                <span>
                  {patientName} · {timeDisplay}
                </span>
                <a
                  href={patientTabUrl(patientId, "psicooncologia")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex shrink-0 items-center gap-1 text-xs hover:underline"
                >
                  Ver ficha
                  <ExternalLink className="size-3" />
                </a>
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex min-h-0 flex-1 gap-6">
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
                            {field.value ? (
                              referralLabels[field.value as ReferralType]
                            ) : (
                              <SelectValue placeholder="Seleccionar derivación (opcional)" />
                            )}
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

                <aside className="border-border/60 w-48 shrink-0 border-l pl-4">
                  <Controller
                    name="showTest"
                    control={control}
                    render={({ field }) => (
                      <label className="border-border/60 bg-muted/20 flex cursor-pointer items-start gap-3 rounded-xl border p-4">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="accent-primary mt-0.5 size-4 shrink-0 cursor-pointer rounded"
                        />
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <FlaskConical className="text-muted-foreground size-3 shrink-0" />
                            <span className="text-xs leading-tight font-medium">
                              Termómetro de Distrés
                            </span>
                          </div>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            Test NCCN para evaluar malestar en la última semana.
                          </p>
                        </div>
                      </label>
                    )}
                  />
                </aside>
              </div>

              <DialogFooter className="shrink-0 gap-2 sm:gap-0">
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
                <span className="text-muted-foreground text-xs">
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
  )
}

function getDefaults(): FormValues {
  return {
    topicAddressed: "",
    sessionDetails: "",
    additionalObservations: "",
    recommendations: "",
    referral: "",
    showTest: false,
  }
}
