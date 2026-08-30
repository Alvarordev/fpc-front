import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
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
import { patientsApi, type CompanionPatient } from "@/api/patients"
import type {
  CreatePsychooncologyAppointmentInput,
  PsychooncologyAppointment,
  UpdatePsychooncologyAppointmentInput,
} from "@/api/psychooncology-appointments"
import { isAvailabilitySlotInFuture } from "@/lib/calendar-helpers"
import { ENROLLMENT_RATING_OPTIONS } from "./enrollment-rating-options"
import { relationshipLabels } from "../_lib/clinical-labels"

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

function companionLabel(companion: CompanionPatient) {
  return (
    companion.companion?.fullName ??
    companion.companionDisplayName ??
    "Acompañante"
  )
}

const MODALITY_OPTIONS = [
  { value: "CALL", label: "Llamada" },
  { value: "VIDEO_CALL", label: "Videollamada" },
] as const

const BENEFICIARY_OPTIONS = [
  { value: "PATIENT", label: "Paciente" },
  { value: "COMPANION", label: "Acompañante" },
] as const

const RELATIONSHIP_OPTIONS = Object.entries(relationshipLabels).map(
  ([value, label]) => ({ value, label }),
)

const ADD_NEW_COMPANION = "ADD_NEW"

type BeneficiaryType = (typeof BENEFICIARY_OPTIONS)[number]["value"]

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
  const queryClient = useQueryClient()
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<
    string | undefined
  >(appointment?.volunteerId)
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(
    appointment?.availabilityId,
  )
  const [beneficiaryType, setBeneficiaryType] = useState<BeneficiaryType>(
    appointment?.beneficiaryType ?? "PATIENT",
  )
  const [selectedCompanionId, setSelectedCompanionId] = useState<
    string | undefined
  >(appointment?.companionId ?? undefined)
  const [newCompanionName, setNewCompanionName] = useState("")
  const [newCompanionPhone, setNewCompanionPhone] = useState("")
  const [newCompanionRelationship, setNewCompanionRelationship] = useState("")
  const [newCompanionOtherRelationship, setNewCompanionOtherRelationship] =
    useState("")
  const [modality, setModality] = useState<"CALL" | "VIDEO_CALL">(
    appointment?.modality ?? "CALL",
  )
  const [zoomLink, setZoomLink] = useState(appointment?.zoomLink ?? "")
  const [schedulingNotes, setSchedulingNotes] = useState(
    appointment?.schedulingNotes ?? "",
  )
  const [satisfactionRating, setSatisfactionRating] = useState(
    appointment?.satisfactionRating
      ? String(appointment.satisfactionRating)
      : "",
  )
  const [satisfactionComment, setSatisfactionComment] = useState(
    appointment?.satisfactionComment ?? "",
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const volunteerId =
    ownVolunteerId ?? selectedVolunteerId ?? appointment?.volunteerId

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
  const companionsQuery = useQuery({
    queryKey: ["patient-companions", patientId],
    queryFn: () => patientsApi.companions(patientId),
    enabled: open,
    staleTime: 30_000,
  })

  const availableSlots = (slotsQuery.data ?? []).filter(
    (slot) =>
      (slot.status === "AVAILABLE" && isAvailabilitySlotInFuture(slot)) ||
      (slot.id === appointment?.availabilityId &&
        slot.volunteerId === volunteerId),
  )
  const availableVolunteers = (volunteersQuery.data ?? []).filter(
    (volunteer) => volunteer.isActive,
  )
  const companionOptions = (companionsQuery.data ?? []).map((companion) => ({
    value: companion.companionId,
    label: companionLabel(companion),
  }))
  const companionItems = [
    ...(selectedCompanionId &&
    selectedCompanionId !== ADD_NEW_COMPANION &&
    !companionOptions.some((item) => item.value === selectedCompanionId)
      ? [
          {
            value: selectedCompanionId,
            label: appointment?.companionFullName ?? "Acompañante",
          },
        ]
      : []),
    ...companionOptions,
    { value: ADD_NEW_COMPANION, label: "Añadir acompañante" },
  ]
  const volunteerOptions = availableVolunteers.map((volunteer) => ({
    value: volunteer.id,
    label: volunteerLabel(volunteer),
  }))
  const volunteerItems =
    volunteerId && !volunteerOptions.some((item) => item.value === volunteerId)
      ? [
          {
            value: volunteerId,
            label: appointment ? "Psicooncólogo asignado" : "Mi perfil",
          },
          ...volunteerOptions,
        ]
      : volunteerOptions

  function close() {
    onOpenChange(false)
    setSelectedVolunteerId(undefined)
    setSelectedSlotId(undefined)
    setBeneficiaryType("PATIENT")
    setSelectedCompanionId(undefined)
    setNewCompanionName("")
    setNewCompanionPhone("")
    setNewCompanionRelationship("")
    setNewCompanionOtherRelationship("")
    setModality("CALL")
    setZoomLink("")
    setSchedulingNotes("")
    setSatisfactionRating("")
    setSatisfactionComment("")
  }

  async function submit() {
    if (!volunteerId || !selectedSlotId) return
    let companionId: string | null = null

    setIsSubmitting(true)
    try {
      if (beneficiaryType === "COMPANION") {
        if (!selectedCompanionId) {
          toast.error("Selecciona un acompañante")
          return
        }

        if (selectedCompanionId === ADD_NEW_COMPANION) {
          const relationship =
            newCompanionRelationship === "OTHER"
              ? newCompanionOtherRelationship.trim()
              : newCompanionRelationship
          if (!newCompanionName.trim()) {
            toast.error("Ingresa el nombre del acompañante")
            return
          }
          if (!newCompanionPhone.trim()) {
            toast.error("Ingresa el teléfono del acompañante")
            return
          }
          if (!relationship) {
            toast.error("Selecciona el parentesco del acompañante")
            return
          }

          const companion = await patientsApi.createCompanion(patientId, {
            fullName: newCompanionName.trim(),
            primaryPhone: newCompanionPhone.trim(),
            relationship,
          })
          companionId = companion.id
          await queryClient.invalidateQueries({
            queryKey: ["patient-companions", patientId],
          })
        } else {
          companionId = selectedCompanionId
        }
      }

      if (isEdit && appointment) {
        const input: UpdatePsychooncologyAppointmentInput = {
          availabilityId:
            selectedSlotId !== appointment.availabilityId
              ? selectedSlotId
              : undefined,
          modality,
          zoomLink:
            modality === "VIDEO_CALL" && zoomLink.trim()
              ? zoomLink.trim()
              : null,
          schedulingNotes: schedulingNotes.trim() || null,
        }

        const previousBeneficiaryType = appointment.beneficiaryType ?? "PATIENT"
        const previousCompanionId = appointment.companionId ?? null
        if (
          beneficiaryType !== previousBeneficiaryType ||
          companionId !== previousCompanionId
        ) {
          input.beneficiaryType = beneficiaryType
          input.companionId = companionId
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
          beneficiaryType,
          companionId,
          availabilityId: selectedSlotId,
          followUpId,
          modality,
          zoomLink:
            modality === "VIDEO_CALL" && zoomLink.trim()
              ? zoomLink.trim()
              : undefined,
          schedulingNotes: schedulingNotes.trim() || undefined,
        },
      })
      close()
    } catch (error) {
      if (companionId === null && beneficiaryType === "COMPANION") {
        toast.error("No se pudo agregar el acompañante", {
          description:
            error instanceof Error ? error.message : "Error inesperado",
        })
        return
      }
      throw error
    } finally {
      setIsSubmitting(false)
    }
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
                  ? "Podés reprogramar el horario o cambiar el psicooncólogo, además de actualizar la modalidad y el motivo de derivación."
                  : "Esta cita se registrará de forma independiente."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>¿La sesión es para…?</Label>
            <Select
              items={BENEFICIARY_OPTIONS}
              value={beneficiaryType}
              onValueChange={(value) => {
                const nextType = value as BeneficiaryType
                setBeneficiaryType(nextType)
                if (nextType === "PATIENT") {
                  setSelectedCompanionId(undefined)
                }
              }}
              disabled={isEdit}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BENEFICIARY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {beneficiaryType === "COMPANION" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Acompañante</Label>
                <Select
                  items={companionItems}
                  value={selectedCompanionId}
                  onValueChange={(value) =>
                    setSelectedCompanionId(value ?? undefined)
                  }
                  disabled={isEdit || companionsQuery.isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar acompañante" />
                  </SelectTrigger>
                  <SelectContent>
                    {companionItems.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompanionId === ADD_NEW_COMPANION && (
                <div className="space-y-3 rounded-xl border border-dashed p-3">
                  <p className="text-muted-foreground text-xs">
                    Registra los datos básicos del nuevo acompañante.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="new-companion-name">Nombre completo</Label>
                    <Input
                      id="new-companion-name"
                      value={newCompanionName}
                      onChange={(event) =>
                        setNewCompanionName(event.target.value)
                      }
                      placeholder="Nombre y apellido"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-companion-phone">Teléfono</Label>
                    <Input
                      id="new-companion-phone"
                      value={newCompanionPhone}
                      onChange={(event) =>
                        setNewCompanionPhone(event.target.value)
                      }
                      placeholder="987654321"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parentesco</Label>
                    <Select
                      items={RELATIONSHIP_OPTIONS}
                      value={newCompanionRelationship || undefined}
                      onValueChange={(value) => {
                        setNewCompanionRelationship(value ?? "")
                        if (value !== "OTHER") {
                          setNewCompanionOtherRelationship("")
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar parentesco" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newCompanionRelationship === "OTHER" && (
                    <div className="space-y-2">
                      <Label htmlFor="new-companion-other-relationship">
                        Especifica el parentesco
                      </Label>
                      <Input
                        id="new-companion-other-relationship"
                        value={newCompanionOtherRelationship}
                        onChange={(event) =>
                          setNewCompanionOtherRelationship(event.target.value)
                        }
                        placeholder="Describe la relación"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Psicooncólogo</Label>
            <Select
              items={volunteerItems}
              value={volunteerId}
              onValueChange={(value) => {
                if (ownVolunteerId) return
                setSelectedVolunteerId(value ?? undefined)
                setSelectedSlotId(undefined)
              }}
              disabled={Boolean(ownVolunteerId)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar psicooncólogo" />
              </SelectTrigger>
              <SelectContent>
                {volunteerItems.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
            <Label htmlFor="scheduling-notes">
              Motivo de derivación / comentarios
            </Label>
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
                <Label htmlFor="satisfaction-comment">
                  Comentario de la encuesta
                </Label>
                <Textarea
                  id="satisfaction-comment"
                  value={satisfactionComment}
                  onChange={(event) =>
                    setSatisfactionComment(event.target.value)
                  }
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
          <Button
            onClick={submit}
            disabled={!selectedSlotId || isPending || isSubmitting}
          >
            {isPending || isSubmitting
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
