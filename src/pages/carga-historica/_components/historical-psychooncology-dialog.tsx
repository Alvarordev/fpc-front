import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  historicalRecordsApi,
  type CreateHistoricalPsychooncologyAppointmentInput,
} from "@/api/historical-records"
import {
  psychooncologyAppointmentsApi,
  type PsychooncologyAppointment,
} from "@/api/psychooncology-appointments"
import { volunteersApi } from "@/api/volunteers"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, SelectField } from "./historical-form-fields"
import {
  APPOINTMENT_STATUS_OPTIONS,
  MODALITY_OPTIONS,
  REFERRAL_OPTIONS,
  toDateInputValue,
  type SelectOption,
} from "./historical-record-options"

type Modality = CreateHistoricalPsychooncologyAppointmentInput["modality"]
type AppointmentStatus =
  CreateHistoricalPsychooncologyAppointmentInput["status"]

const ANONYMOUS_VOLUNTEER = "__ANONYMOUS__"
const NO_FOLLOW_UP = "__NONE__"
const NO_REFERRAL = "__UNSET__"

interface HistoricalPsychooncologyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  /** When set the dialog edits that session instead of creating a new one. */
  appointmentId?: string | null
  followUpItems: SelectOption[]
  defaultFollowUpId?: string
  onSaved?: () => void
}

export function HistoricalPsychooncologyDialog({
  open,
  onOpenChange,
  patientId,
  appointmentId,
  followUpItems,
  defaultFollowUpId,
  onSaved,
}: HistoricalPsychooncologyDialogProps) {
  const isEditing = Boolean(appointmentId)
  const appointmentsQuery = useQuery({
    queryKey: ["psychooncology-appointments", patientId],
    queryFn: () => psychooncologyAppointmentsApi.list({ patientId }),
    enabled: open && isEditing,
  })

  const existing = isEditing
    ? appointmentsQuery.data?.find(
        (appointment) => appointment.id === appointmentId,
      )
    : undefined
  const isReady = !isEditing || Boolean(existing)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editar sesión psicooncológica"
              : "Agregar sesión psicooncológica"}
          </DialogTitle>
          <DialogDescription>
            Registrá una sesión ya ocurrida junto con su resultado. No se
            reserva ningún horario del calendario.
          </DialogDescription>
        </DialogHeader>

        {isReady ? (
          <HistoricalPsychooncologyForm
            patientId={patientId}
            appointmentId={appointmentId ?? null}
            existing={existing}
            followUpItems={followUpItems}
            defaultFollowUpId={defaultFollowUpId}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        ) : (
          <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
            <Loader2 className="size-4 animate-spin" /> Cargando sesión...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Split from the dialog so every field can seed itself from the already
 * resolved record; the dialog only mounts it once the data is available.
 */
function HistoricalPsychooncologyForm({
  patientId,
  appointmentId,
  existing,
  followUpItems,
  defaultFollowUpId,
  onClose,
  onSaved,
}: {
  patientId: string
  appointmentId: string | null
  existing?: PsychooncologyAppointment
  followUpItems: SelectOption[]
  defaultFollowUpId?: string
  onClose: () => void
  onSaved?: () => void
}) {
  const queryClient = useQueryClient()

  const [scheduledOn, setScheduledOn] = useState(() =>
    toDateInputValue(existing?.scheduledOn ?? existing?.scheduledAt),
  )
  const [completedOn, setCompletedOn] = useState(() =>
    toDateInputValue(existing?.completedOn ?? existing?.completedAt),
  )
  const [sessionNumber, setSessionNumber] = useState(() =>
    existing ? String(existing.sessionNumber) : "1",
  )
  const [modality, setModality] = useState<Modality>(
    () => existing?.modality ?? "CALL",
  )
  const [status, setStatus] = useState<AppointmentStatus>(
    () => existing?.status ?? "COMPLETED",
  )
  const [volunteerId, setVolunteerId] = useState(
    () => existing?.volunteerId || ANONYMOUS_VOLUNTEER,
  )
  const [followUpId, setFollowUpId] = useState(
    () => existing?.followUpId ?? defaultFollowUpId ?? "",
  )
  const [schedulingNotes, setSchedulingNotes] = useState(
    () => existing?.schedulingNotes ?? "",
  )
  const [topicAddressed, setTopicAddressed] = useState(
    () => existing?.topicAddressed ?? "",
  )
  const [sessionDetails, setSessionDetails] = useState(
    () => existing?.sessionDetails ?? "",
  )
  const [additionalObservations, setAdditionalObservations] = useState(
    () => existing?.additionalObservations ?? "",
  )
  const [recommendations, setRecommendations] = useState(
    () => existing?.recommendations ?? "",
  )
  const [referral, setReferral] = useState(() => existing?.referral ?? "")
  const [error, setError] = useState<string | null>(null)

  const volunteersQuery = useQuery({
    queryKey: ["volunteers"],
    queryFn: volunteersApi.list,
    staleTime: 300_000,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!scheduledOn)
        throw new Error("Indica la fecha en que se programó la sesión")
      const parsedSessionNumber = Number(sessionNumber)
      if (!Number.isInteger(parsedSessionNumber) || parsedSessionNumber < 1)
        throw new Error("El número de sesión debe ser un entero positivo")

      const isAnonymous = volunteerId === ANONYMOUS_VOLUNTEER
      const results = {
        schedulingNotes: schedulingNotes.trim() || null,
        topicAddressed: topicAddressed.trim() || null,
        sessionDetails: sessionDetails.trim() || null,
        additionalObservations: additionalObservations.trim() || null,
        recommendations: recommendations.trim() || null,
        referral: referral || null,
      }
      const shared = {
        ...results,
        volunteerId: isAnonymous ? undefined : volunteerId,
        useAnonymousVolunteer: isAnonymous,
        followUpId: followUpId || undefined,
        sessionNumber: parsedSessionNumber,
        modality,
        status,
        scheduledOn,
        ...(completedOn ? { completedOn } : {}),
      }

      if (appointmentId) {
        return historicalRecordsApi.updatePsychooncologyAppointment(
          appointmentId,
          shared,
        )
      }
      return historicalRecordsApi.createPsychooncologyAppointment({
        ...shared,
        patientId,
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patient-timeline", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["psychooncology-appointments"],
        }),
      ])
      toast.success(
        appointmentId
          ? "Sesión histórica actualizada"
          : "Sesión histórica guardada",
      )
      onSaved?.()
      onClose()
    },
    onError: (cause: Error) => {
      setError(cause.message)
      toast.error("No se pudo guardar la sesión histórica", {
        description: cause.message,
      })
    },
  })

  const volunteerItems: SelectOption[] = [
    { value: ANONYMOUS_VOLUNTEER, label: "Voluntario no identificado" },
    ...(volunteersQuery.data ?? [])
      .filter((volunteer) => !volunteer.isAnonymous)
      .map((volunteer) => ({
        value: volunteer.id,
        label: `${volunteer.firstName} ${volunteer.lastName} · ${volunteer.specialty}${
          volunteer.isActive ? "" : " · Inactivo"
        }`,
      })),
  ]
  const followUpSelectItems: SelectOption[] = [
    { value: NO_FOLLOW_UP, label: "Sin seguimiento relacionado" },
    ...followUpItems,
  ]
  const referralItems: SelectOption[] = [
    { value: NO_REFERRAL, label: "Sin derivación registrada" },
    ...REFERRAL_OPTIONS,
  ]

  return (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Fecha programada *">
            <Input
              type="date"
              value={scheduledOn}
              onChange={(event) => setScheduledOn(event.target.value)}
              className="bg-card border"
            />
          </Field>
          <Field label="Fecha de realización">
            <Input
              type="date"
              value={completedOn}
              onChange={(event) => setCompletedOn(event.target.value)}
              className="bg-card border"
            />
          </Field>
          <Field label="Número de sesión *">
            <Input
              type="number"
              min={1}
              step={1}
              value={sessionNumber}
              onChange={(event) => setSessionNumber(event.target.value)}
              className="bg-card border"
            />
          </Field>
          <SelectField
            label="Modalidad"
            value={modality}
            placeholder="Seleccionar modalidad"
            items={MODALITY_OPTIONS}
            onChange={(value) => setModality(value as Modality)}
          />
          <SelectField
            label="Estado"
            value={status}
            placeholder="Seleccionar estado"
            items={APPOINTMENT_STATUS_OPTIONS}
            onChange={(value) => setStatus(value as AppointmentStatus)}
          />
          <SelectField
            label="Voluntario original"
            value={volunteerId}
            placeholder="Seleccionar voluntario"
            items={volunteerItems}
            onChange={setVolunteerId}
          />
          <div className="md:col-span-2">
            <SelectField
              label="Seguimiento relacionado"
              value={followUpId || NO_FOLLOW_UP}
              placeholder="Seleccionar seguimiento"
              items={followUpSelectItems}
              onChange={(value) =>
                setFollowUpId(value === NO_FOLLOW_UP ? "" : value)
              }
            />
          </div>
          <div className="md:col-span-2">
            <Field label="Notas de programación">
              <Textarea
                value={schedulingNotes}
                onChange={(event) => setSchedulingNotes(event.target.value)}
                placeholder="Motivo de la derivación o contexto de la sesión"
                className="min-h-16 resize-y"
              />
            </Field>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border p-3">
          <p className="text-muted-foreground text-xs">
            Resultado de la sesión
          </p>
          <Field label="Tema abordado">
            <Textarea
              value={topicAddressed}
              onChange={(event) => setTopicAddressed(event.target.value)}
              placeholder="Ej: Ansiedad por diagnóstico oncológico, manejo del duelo..."
              className="min-h-16 resize-y"
            />
          </Field>
          <Field label="Detalles de la sesión">
            <Textarea
              value={sessionDetails}
              onChange={(event) => setSessionDetails(event.target.value)}
              placeholder="Describí lo trabajado durante la sesión..."
              className="min-h-20 resize-y"
            />
          </Field>
          <Field label="Observaciones adicionales">
            <Textarea
              value={additionalObservations}
              onChange={(event) =>
                setAdditionalObservations(event.target.value)
              }
              placeholder="Actitud del paciente, nivel de participación..."
              className="min-h-16 resize-y"
            />
          </Field>
          <Field label="Recomendaciones">
            <Textarea
              value={recommendations}
              onChange={(event) => setRecommendations(event.target.value)}
              placeholder="Ejercicios para casa, lecturas sugeridas..."
              className="min-h-16 resize-y"
            />
          </Field>
          <SelectField
            label="Derivación"
            value={referral || NO_REFERRAL}
            placeholder="Seleccionar derivación"
            items={referralItems}
            onChange={(value) =>
              setReferral(value === NO_REFERRAL ? "" : value)
            }
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>

      <DialogFooter className="shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={saveMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="gap-1.5"
        >
          {saveMutation.isPending && (
            <Loader2 className="size-3.5 animate-spin" />
          )}
          {appointmentId ? "Guardar cambios" : "Guardar sesión"}
        </Button>
      </DialogFooter>
    </>
  )
}
