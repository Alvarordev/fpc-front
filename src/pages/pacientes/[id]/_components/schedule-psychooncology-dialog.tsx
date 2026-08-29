import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { volunteersApi } from "@/api/volunteers"
import type {
  CreatePsychooncologyAppointmentInput,
  PsychooncologyAppointment,
  UpdatePsychooncologyAppointmentInput,
} from "@/api/psychooncology-appointments"
import { isAvailabilitySlotInFuture } from "@/lib/calendar-helpers"
import { ENROLLMENT_RATING_OPTIONS } from "./enrollment-rating-options"

export type SchedulePsychooncologySubmitInput =
  | { mode: "create"; input: CreatePsychooncologyAppointmentInput }
  | { mode: "update"; id: string; input: UpdatePsychooncologyAppointmentInput }

interface SchedulePsychooncologyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  followUpId?: string
  ownVolunteerId?: string
  appointment?: PsychooncologyAppointment | null
  completeIntent?: boolean
  isPending: boolean
  onSubmit: (payload: SchedulePsychooncologySubmitInput) => Promise<void>
}

function volunteerLabel(volunteer: {
  firstName: string
  lastName: string
  specialty: string
}) {
  return `${volunteer.firstName} ${volunteer.lastName} - ${volunteer.specialty}`
}

function slotLabel(slot: { date: string; startTime: string; endTime: string }) {
  const date = new Date(`${slot.date}T12:00:00`).toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  return `${date}, ${slot.startTime.slice(0, 5)} a ${slot.endTime.slice(0, 5)}`
}

const MODALITY_OPTIONS = [
  { value: "CALL", label: "Llamada" },
  { value: "VIDEO_CALL", label: "Videollamada" },
] as const

export function SchedulePsychooncologyDialog({
  open,
  onOpenChange,
  patientId,
  followUpId,
  ownVolunteerId,
  appointment,
  completeIntent = false,
  isPending,
  onSubmit,
}: SchedulePsychooncologyDialogProps) {
  const isEdit = Boolean(appointment)
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>()
  const [selectedSlotId, setSelectedSlotId] = useState<string>()
  const [modality, setModality] = useState<"CALL" | "VIDEO_CALL">("CALL")
  const [zoomLink, setZoomLink] = useState("")
  const [schedulingNotes, setSchedulingNotes] = useState("")
  const [satisfactionRating, setSatisfactionRating] = useState("")
  const [satisfactionComment, setSatisfactionComment] = useState("")

  const volunteerId =
    ownVolunteerId ?? appointment?.volunteerId ?? selectedVolunteerId

  const volunteersQuery = useQuery({
    queryKey: ["volunteers"],
    queryFn: volunteersApi.list,
    enabled: open,
    staleTime: 300_000,
  })
  const slotsQuery = useQuery({
    queryKey: ["volunteer-availability", volunteerId],
    queryFn: () => volunteersApi.listAvailability(volunteerId!),
    enabled: open && Boolean(volunteerId),
  })

  const availableSlots = (slotsQuery.data ?? []).filter(
    (slot) =>
      (slot.status === "AVAILABLE" && isAvailabilitySlotInFuture(slot)) ||
      slot.id === appointment?.availabilityId,
  )
  const availableVolunteers = (volunteersQuery.data ?? []).filter(
    (volunteer) => volunteer.isActive,
  )

  useEffect(() => {
    if (!open) return
    if (appointment) {
      setSelectedVolunteerId(appointment.volunteerId)
      setSelectedSlotId(appointment.availabilityId)
      setModality(appointment.modality)
      setZoomLink(appointment.zoomLink ?? "")
      setSchedulingNotes(appointment.schedulingNotes ?? "")
      setSatisfactionRating(
        appointment.satisfactionRating ? String(appointment.satisfactionRating) : "",
      )
      setSatisfactionComment(appointment.satisfactionComment ?? "")
      return
    }
    setSelectedVolunteerId(undefined)
    setSelectedSlotId(undefined)
    setModality("CALL")
    setZoomLink("")
    setSchedulingNotes("")
    setSatisfactionRating("")
    setSatisfactionComment("")
  }, [open, appointment])

  function close() {
    onOpenChange(false)
    setSelectedVolunteerId(undefined)
    setSelectedSlotId(undefined)
    setModality("CALL")
    setZoomLink("")
    setSchedulingNotes("")
    setSatisfactionRating("")
    setSatisfactionComment("")
  }

  async function submit() {
    if (!volunteerId || !selectedSlotId) return

    if (isEdit && appointment) {
      const input: UpdatePsychooncologyAppointmentInput = {
        availabilityId:
          selectedSlotId !== appointment.availabilityId
            ? selectedSlotId
            : undefined,
        modality,
        zoomLink:
          modality === "VIDEO_CALL" && zoomLink.trim() ? zoomLink.trim() : null,
        schedulingNotes: schedulingNotes.trim() || null,
      }

      if (completeIntent) {
        input.status = "COMPLETED"
        if (satisfactionRating) {
          input.satisfactionRating = Number(satisfactionRating)
        }
        if (satisfactionComment.trim()) {
          input.satisfactionComment = satisfactionComment.trim()
        }
      }

      await onSubmit({ mode: "update", id: appointment.id, input })
      close()
      return
    }

    await onSubmit({
      mode: "create",
      input: {
        patientId,
        availabilityId: selectedSlotId,
        followUpId,
        modality,
        zoomLink:
          modality === "VIDEO_CALL" && zoomLink.trim() ? zoomLink.trim() : undefined,
        schedulingNotes: schedulingNotes.trim() || undefined,
      },
    })
    close()
  }

  const showSatisfaction = completeIntent || appointment?.status === "COMPLETED"

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {completeIntent
              ? "Completar sesión de psicooncología"
              : isEdit
                ? "Editar cita de psicooncología"
                : "Agendar cita de psicooncología"}
          </DialogTitle>
          <DialogDescription>
            {completeIntent
              ? "Registra la encuesta de satisfacción y confirma la sesión."
              : followUpId
                ? "La cita quedará vinculada al seguimiento actual."
                : isEdit
                  ? "Podés reprogramar el horario, actualizar la modalidad y el motivo de derivación."
                  : "Esta cita se registrará de forma independiente."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Psicooncólogo</Label>
            <Select
              items={availableVolunteers.map((volunteer) => ({
                value: volunteer.id,
                label: volunteerLabel(volunteer),
              }))}
              value={volunteerId}
              onValueChange={(value) => {
                if (ownVolunteerId || isEdit) return
                setSelectedVolunteerId(value ?? undefined)
                setSelectedSlotId(undefined)
              }}
              disabled={Boolean(ownVolunteerId) || isEdit}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar psicooncólogo" />
              </SelectTrigger>
              <SelectContent>
                {availableVolunteers.map((volunteer) => (
                  <SelectItem key={volunteer.id} value={volunteer.id}>
                    {volunteerLabel(volunteer)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Horario disponible</Label>
            <Select
              items={availableSlots.map((slot) => ({
                value: slot.id,
                label: slotLabel(slot),
              }))}
              value={selectedSlotId}
              onValueChange={(value) => setSelectedSlotId(value ?? undefined)}
              disabled={!volunteerId || slotsQuery.isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    volunteerId
                      ? "Seleccionar horario"
                      : "Primero seleccioná un psicooncólogo"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {slotLabel(slot)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Modalidad</Label>
            <Select
              items={MODALITY_OPTIONS}
              value={modality}
              onValueChange={(value) => {
                const nextModality = value as "CALL" | "VIDEO_CALL"
                setModality(nextModality)
                if (nextModality === "CALL") setZoomLink("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODALITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {modality === "VIDEO_CALL" && (
            <div className="space-y-2">
              <Label htmlFor="zoom-link">Link de Zoom (opcional)</Label>
              <Input
                id="zoom-link"
                type="url"
                value={zoomLink}
                onChange={(event) => setZoomLink(event.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="scheduling-notes">Motivo de derivación / comentarios</Label>
            <Textarea
              id="scheduling-notes"
              value={schedulingNotes}
              onChange={(event) => setSchedulingNotes(event.target.value)}
              placeholder="Motivo de la derivación o contexto para la sesión..."
              rows={3}
            />
          </div>
          {showSatisfaction && (
            <>
              <div className="space-y-2">
                <Label>Calificación de la sesión</Label>
                <Select
                  items={ENROLLMENT_RATING_OPTIONS}
                  value={satisfactionRating}
                  onValueChange={(value) => setSatisfactionRating(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar calificación" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENROLLMENT_RATING_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="satisfaction-comment">Comentario de la encuesta</Label>
                <Textarea
                  id="satisfaction-comment"
                  value={satisfactionComment}
                  onChange={(event) => setSatisfactionComment(event.target.value)}
                  placeholder="Comentarios adicionales del paciente..."
                  rows={3}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!selectedSlotId || isPending}>
            {isPending
              ? "Guardando..."
              : completeIntent
                ? "Completar sesión"
                : isEdit
                  ? "Guardar cambios"
                  : "Agendar cita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
