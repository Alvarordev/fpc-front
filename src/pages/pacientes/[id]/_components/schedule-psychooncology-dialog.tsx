import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { volunteersApi } from "@/api/volunteers"
import type { CreatePsychooncologyAppointmentInput } from "@/api/psychooncology-appointments"
import { isAvailabilitySlotInFuture } from "@/lib/calendar-helpers"

interface SchedulePsychooncologyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  followUpId?: string
  ownVolunteerId?: string
  isPending: boolean
  onSubmit: (input: CreatePsychooncologyAppointmentInput) => Promise<void>
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
  isPending,
  onSubmit,
}: SchedulePsychooncologyDialogProps) {
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>()
  const [selectedSlotId, setSelectedSlotId] = useState<string>()
  const [modality, setModality] = useState<"CALL" | "VIDEO_CALL">("CALL")
  const [zoomLink, setZoomLink] = useState("")
  const volunteerId = ownVolunteerId ?? selectedVolunteerId
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
    (slot) => slot.status === "AVAILABLE" && isAvailabilitySlotInFuture(slot),
  )
  const availableVolunteers = (volunteersQuery.data ?? []).filter(
    (volunteer) => volunteer.isActive,
  )

  function close() {
    onOpenChange(false)
    setSelectedVolunteerId(undefined)
    setSelectedSlotId(undefined)
    setModality("CALL")
    setZoomLink("")
  }

  async function submit() {
    if (!volunteerId || !selectedSlotId) return

    await onSubmit({
      patientId,
      availabilityId: selectedSlotId,
      followUpId,
      modality,
      zoomLink:
        modality === "VIDEO_CALL" && zoomLink.trim() ? zoomLink.trim() : undefined,
    })
    close()
  }

  const selectedVolunteer = availableVolunteers.find(
    (volunteer) => volunteer.id === volunteerId,
  )
  const selectedSlot = availableSlots.find((slot) => slot.id === selectedSlotId)

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar cita de psicooncología</DialogTitle>
          <DialogDescription>
            {followUpId
              ? "La cita quedará vinculada al seguimiento actual."
              : "Esta cita se registrará de forma independiente."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Psicooncólogo</Label>
            <Select
              value={volunteerId}
              onValueChange={(value) => {
                if (ownVolunteerId) return
                setSelectedVolunteerId(value ?? undefined)
                setSelectedSlotId(undefined)
              }}
              disabled={Boolean(ownVolunteerId)}
            >
              <SelectTrigger className="w-full">
                {selectedVolunteer ? (
                  volunteerLabel(selectedVolunteer)
                ) : (
                  <SelectValue placeholder="Seleccionar psicooncólogo" />
                )}
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
              value={selectedSlotId}
              onValueChange={(value) => setSelectedSlotId(value ?? undefined)}
              disabled={!volunteerId || slotsQuery.isLoading}
            >
              <SelectTrigger className="w-full">
                {selectedSlot ? (
                  slotLabel(selectedSlot)
                ) : (
                  <SelectValue
                    placeholder={
                      volunteerId
                        ? "Seleccionar horario"
                        : "Primero seleccioná un psicooncólogo"
                    }
                  />
                )}
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!selectedSlotId || isPending}>
            {isPending ? "Agendando..." : "Agendar cita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
