import { useState } from "react"
import type { PatientDetailsResponse, CompanionPatient } from "@/api/patients"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { genderLabels, relationshipLabels } from "../../_lib/clinical-labels"

const PATIENT_CONTACT_VALUE = "__PATIENT__"

export type FollowUpContactValues =
  | {
      kind: "PATIENT"
      primaryPhone: string
      secondaryPhone: string
    }
  | {
      kind: "COMPANION"
      linkId: string
      companionId: string
      fullName: string
      primaryPhone: string
      secondaryPhone: string
      gender: string
      relationship: string
      isPrimaryContact: boolean
      isCaregiver: boolean
    }
  | {
      kind: "NEW_CAREGIVER"
      fullName: string
      primaryPhone: string
      secondaryPhone: string
      gender: string
      relationship: string
    }

interface FollowUpContactFormProps {
  patient: PatientDetailsResponse
  companions: CompanionPatient[]
  isPending: boolean
  onSubmit: (values: FollowUpContactValues) => Promise<void>
}

function getCompanionLabel(link: CompanionPatient) {
  const name =
    link.companion?.fullName ?? link.companionDisplayName ?? "Acompañante"
  const relationship = link.relationship
    ? (relationshipLabels[link.relationship] ?? link.relationship)
    : "Sin parentesco"
  return `${name} · ${relationship}`
}

export function FollowUpContactForm({
  patient,
  companions,
  isPending,
  onSubmit,
}: FollowUpContactFormProps) {
  const primaryLink = companions.find((link) => link.isPrimaryContact)
  const [selectedId, setSelectedId] = useState(
    primaryLink?.companionId ?? PATIENT_CONTACT_VALUE,
  )
  const selectedLink = companions.find(
    (link) => link.companionId === selectedId,
  )
  const selectedPerson = selectedLink?.companion
  const [fullName, setFullName] = useState(
    selectedPerson?.fullName ?? patient.fullName,
  )
  const [primaryPhone, setPrimaryPhone] = useState(
    selectedPerson?.primaryPhone ?? patient.primaryPhone,
  )
  const [secondaryPhone, setSecondaryPhone] = useState(
    selectedPerson?.secondaryPhone ?? patient.secondaryPhone ?? "",
  )
  const [gender, setGender] = useState(selectedPerson?.gender ?? "")
  const [relationship, setRelationship] = useState(
    selectedLink?.relationship ?? "",
  )
  const [isPrimaryContact, setIsPrimaryContact] = useState(
    selectedLink?.isPrimaryContact ?? false,
  )
  const [isCaregiver, setIsCaregiver] = useState(
    selectedLink?.isCaregiver ?? false,
  )
  const [addingCaregiver, setAddingCaregiver] = useState(false)
  const [newCaregiverName, setNewCaregiverName] = useState("")
  const [newCaregiverPhone, setNewCaregiverPhone] = useState("")
  const [newCaregiverSecondaryPhone, setNewCaregiverSecondaryPhone] =
    useState("")
  const [newCaregiverGender, setNewCaregiverGender] = useState("")
  const [newCaregiverRelationship, setNewCaregiverRelationship] = useState("")

  function selectContact(value: string | null) {
    if (!value) return
    const link = companions.find((item) => item.companionId === value)
    const person = link?.companion
    setSelectedId(value)
    setFullName(person?.fullName ?? patient.fullName)
    setPrimaryPhone(person?.primaryPhone ?? patient.primaryPhone)
    setSecondaryPhone(person?.secondaryPhone ?? patient.secondaryPhone ?? "")
    setGender(person?.gender ?? "")
    setRelationship(link?.relationship ?? "")
    setIsPrimaryContact(link?.isPrimaryContact ?? false)
    setIsCaregiver(link?.isCaregiver ?? false)
    setAddingCaregiver(false)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (addingCaregiver) {
      await onSubmit({
        kind: "NEW_CAREGIVER",
        fullName: newCaregiverName,
        primaryPhone: newCaregiverPhone,
        secondaryPhone: newCaregiverSecondaryPhone,
        gender: newCaregiverGender,
        relationship: newCaregiverRelationship,
      })
      return
    }
    if (selectedId === PATIENT_CONTACT_VALUE) {
      await onSubmit({ kind: "PATIENT", primaryPhone, secondaryPhone })
      return
    }
    if (!selectedLink) return
    await onSubmit({
      kind: "COMPANION",
      linkId: selectedLink.id,
      companionId: selectedLink.companionId,
      fullName,
      primaryPhone,
      secondaryPhone,
      gender,
      relationship,
      isPrimaryContact,
      isCaregiver,
    })
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div>
        <p className="text-sm font-medium">Contacto para seguimiento</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Selecciona quién recibirá las llamadas o mensajes de este paciente.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Persona de contacto</Label>
        <Select
          items={[
            {
              value: PATIENT_CONTACT_VALUE,
              label: `${patient.fullName} · Paciente`,
            },
            ...companions.map((link) => ({
              value: link.companionId,
              label: getCompanionLabel(link),
            })),
          ]}
          value={selectedId}
          onValueChange={selectContact}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PATIENT_CONTACT_VALUE}>
              {patient.fullName} · Paciente
            </SelectItem>
            {companions.map((link) => (
              <SelectItem key={link.companionId} value={link.companionId}>
                {getCompanionLabel(link)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {selectedId !== PATIENT_CONTACT_VALUE && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="follow-up-contact-name">Nombre</Label>
            <Input
              id="follow-up-contact-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="follow-up-contact-primary-phone">
            Celular principal
          </Label>
          <Input
            id="follow-up-contact-primary-phone"
            value={primaryPhone}
            onChange={(event) => setPrimaryPhone(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="follow-up-contact-secondary-phone">
            Celular auxiliar
          </Label>
          <Input
            id="follow-up-contact-secondary-phone"
            value={secondaryPhone}
            onChange={(event) => setSecondaryPhone(event.target.value)}
          />
        </div>
        {selectedId !== PATIENT_CONTACT_VALUE && (
          <>
            <div className="space-y-2">
              <Label>Parentesco</Label>
              <Select
                items={Object.entries(relationshipLabels).map(
                  ([value, label]) => ({
                    value,
                    label,
                  }),
                )}
                value={relationship}
                onValueChange={(value) => setRelationship(value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar parentesco" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(relationshipLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Género</Label>
              <Select
                items={Object.entries(genderLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={gender}
                onValueChange={(value) => setGender(value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(genderLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {selectedId !== PATIENT_CONTACT_VALUE && (
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isPrimaryContact}
              onCheckedChange={(checked) => setIsPrimaryContact(!!checked)}
            />
            Contacto principal
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isCaregiver}
              onCheckedChange={(checked) => setIsCaregiver(!!checked)}
            />
            Cuidador
          </label>
        </div>
      )}

      {selectedId === PATIENT_CONTACT_VALUE && (
        <div className="space-y-4 rounded-lg border border-dashed p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Cuidador</p>
              <p className="text-muted-foreground text-xs">
                Registra un cuidador si el seguimiento se realizará con el
                paciente.
              </p>
            </div>
            {!addingCaregiver && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddingCaregiver(true)}
              >
                Agregar cuidador
              </Button>
            )}
          </div>
          {addingCaregiver && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="new-caregiver-name">Nombre</Label>
                <Input
                  id="new-caregiver-name"
                  value={newCaregiverName}
                  onChange={(event) => setNewCaregiverName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-caregiver-phone">Celular principal</Label>
                <Input
                  id="new-caregiver-phone"
                  value={newCaregiverPhone}
                  onChange={(event) => setNewCaregiverPhone(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-caregiver-secondary-phone">
                  Celular auxiliar
                </Label>
                <Input
                  id="new-caregiver-secondary-phone"
                  value={newCaregiverSecondaryPhone}
                  onChange={(event) =>
                    setNewCaregiverSecondaryPhone(event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Parentesco</Label>
                <Select
                  items={Object.entries(relationshipLabels).map(
                    ([value, label]) => ({
                      value,
                      label,
                    }),
                  )}
                  value={newCaregiverRelationship}
                  onValueChange={(value) =>
                    setNewCaregiverRelationship(value ?? "")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar parentesco" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(relationshipLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Género</Label>
                <Select
                  items={Object.entries(genderLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  value={newCaregiverGender}
                  onValueChange={(value) => setNewCaregiverGender(value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(genderLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || (addingCaregiver && !newCaregiverRelationship)}
        >
          {isPending
            ? "Guardando..."
            : addingCaregiver
              ? "Guardar cuidador"
              : "Guardar contacto"}
        </Button>
        <p className="text-muted-foreground text-xs">
          Los cambios se aplican al guardar este seguimiento.
        </p>
      </div>
    </form>
  )
}
