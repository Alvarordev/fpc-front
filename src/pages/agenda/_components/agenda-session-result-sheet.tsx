import { useEffect, useCallback, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { ExternalLink, FlaskConical } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
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

type Outcome = "COMPLETED" | "CANCELLED"

interface FormValues {
  outcome: Outcome
  topicAddressed: string
  sessionDetails: string
  additionalObservations: string
  recommendations: string
  referral: ReferralType | ""
  showTest: boolean
}

interface AgendaSessionResultSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: PsychooncologyAppointment | null
  patientName: string
  patientId: string
  volunteerId: string | undefined
}

export function AgendaSessionResultSheet({
  open,
  onOpenChange,
  appointment,
  patientName,
  patientId,
}: AgendaSessionResultSheetProps) {
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

  // Save draft to sessionStorage on every change
  const watchedValues = watch()
  useEffect(() => {
    if (!appointment || !open) return
    sessionStorage.setItem(storageKey, JSON.stringify(watchedValues))
  }, [watchedValues, appointment, open, storageKey])

  // Restore draft when opening
  useEffect(() => {
    if (open && appointment) {
      reset(loadDraft())
    }
  }, [open, appointment, reset, loadDraft])

  const outcome = watch("outcome")
  const isCompleting = outcome === "COMPLETED"

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

    if (values.outcome === "CANCELLED") {
      await cancelMutation.mutateAsync(appointment.id)
      handleOpenChange(false)
      return
    }

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

  const isPending = completeMutation.isPending || cancelMutation.isPending
  const timeDisplay = appointment?.scheduledAt?.slice(11, 16) ?? ""

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-full max-h-[85vh] flex-col rounded-t-xl"
      >
        {wizardStep === "session" ? (
          <>
            <SheetHeader className="border-border/60 shrink-0 border-b px-4 py-4">
              <SheetTitle>Registrar sesión</SheetTitle>
              <SheetDescription className="mt-1 flex items-center gap-2">
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
                        items={{
                          COMPLETED: "Sí, asistió",
                          CANCELLED: "No asistió / cancelar",
                        }}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMPLETED">Sí, asistió</SelectItem>
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
                    {/* ── Test toggle — visible at the top ── */}
                    <Controller
                      name="showTest"
                      control={control}
                      render={({ field }) => (
                        <label className="border-border/60 bg-muted/20 flex cursor-pointer items-start gap-3 rounded-xl border p-4">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="accent-primary mt-0.5 size-4 cursor-pointer rounded"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <FlaskConical className="text-muted-foreground size-3.5" />
                              <span className="text-sm font-medium">
                                Aplicar Termómetro de Distrés
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              Test de screening rápido (NCCN). Evalúa el nivel
                              de malestar en la última semana.
                            </p>
                          </div>
                        </label>
                      )}
                    />

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
                  </>
                )}
              </div>

              <SheetFooter className="border-border/60 flex shrink-0 items-center justify-between border-t p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || isSubmitting || !appointment}
                >
                  {isPending
                    ? "Guardando..."
                    : watch("showTest") && isCompleting
                      ? "Siguiente"
                      : "Guardar sesión"}
                </Button>
              </SheetFooter>
            </form>
          </>
        ) : (
          <>
            <SheetHeader className="border-border/60 shrink-0 border-b px-4 py-4">
              <SheetTitle>Termómetro de Distrés</SheetTitle>
              <SheetDescription className="mt-1">
                <span className="text-muted-foreground text-xs">
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
  )
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
  }
}
