import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { UpdateVolunteerInput, Volunteer } from "@/api/volunteers"
import { volunteersApi } from "@/api/volunteers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCommitmentDate } from "@/lib/volunteer-commitment"

interface VolunteerProfileDialogProps {
  volunteer: Volunteer
  canEdit: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface VolunteerFormValues {
  firstName: string
  lastName: string
  specialty: string
  email: string
  phone: string
  birthDate: string
  commitmentStartAt: string
  commitmentEndAt: string
  hasVolunteerCertificate: boolean
  additionalComments: string
  completedSustainabilityModule: boolean
  completedDesignThinkingModule: boolean
}

function formValuesFromVolunteer(volunteer: Volunteer): VolunteerFormValues {
  return {
    firstName: volunteer.firstName,
    lastName: volunteer.lastName,
    specialty: volunteer.specialty,
    email: volunteer.email,
    phone: volunteer.phone,
    birthDate: volunteer.birthDate?.slice(0, 10) ?? "",
    commitmentStartAt: volunteer.commitmentStartAt?.slice(0, 10) ?? "",
    commitmentEndAt: volunteer.commitmentEndAt?.slice(0, 10) ?? "",
    hasVolunteerCertificate: volunteer.hasVolunteerCertificate,
    additionalComments: volunteer.additionalComments ?? "",
    completedSustainabilityModule: volunteer.completedSustainabilityModule,
    completedDesignThinkingModule: volunteer.completedDesignThinkingModule,
  }
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || "Sin registrar"}</p>
    </div>
  )
}

function BooleanDetail({ label, value }: { label: string; value: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <Badge
        variant="outline"
        className={
          value
            ? "mt-1 border-emerald-200 bg-emerald-50 text-emerald-700"
            : "mt-1 border-zinc-200 bg-zinc-100 text-zinc-600"
        }
      >
        {value ? "Sí" : "No"}
      </Badge>
    </div>
  )
}

export function VolunteerProfileDialog({
  volunteer,
  canEdit,
  open,
  onOpenChange,
}: VolunteerProfileDialogProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [values, setValues] = useState(() => formValuesFromVolunteer(volunteer))
  const [formError, setFormError] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: (input: UpdateVolunteerInput) =>
      volunteersApi.update(volunteer.id, input),
    onSuccess: (updatedVolunteer) => {
      setValues(formValuesFromVolunteer(updatedVolunteer))
      setIsEditing(false)
      setFormError(null)
      queryClient.invalidateQueries({ queryKey: ["volunteers"] })
      toast.success("Perfil de voluntario actualizado")
    },
    onError: (error: Error) => {
      setFormError(error.message)
    },
  })

  function updateValue<K extends keyof VolunteerFormValues>(
    key: K,
    value: VolunteerFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }))
  }

  function cancelEditing() {
    setValues(formValuesFromVolunteer(volunteer))
    setFormError(null)
    setIsEditing(false)
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    if (
      values.commitmentStartAt &&
      values.commitmentEndAt &&
      values.commitmentEndAt < values.commitmentStartAt
    ) {
      setFormError("La fecha de fin debe ser posterior al inicio.")
      return
    }

    updateMutation.mutate({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      specialty: values.specialty.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      birthDate: values.birthDate || null,
      commitmentStartAt: values.commitmentStartAt || null,
      commitmentEndAt: values.commitmentEndAt || null,
      hasVolunteerCertificate: values.hasVolunteerCertificate,
      additionalComments: values.additionalComments.trim() || null,
      completedSustainabilityModule: values.completedSustainabilityModule,
      completedDesignThinkingModule: values.completedDesignThinkingModule,
    })
  }

  const fullName = `${volunteer.firstName} ${volunteer.lastName}`

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !updateMutation.isPending) {
          cancelEditing()
          onOpenChange(false)
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar perfil de voluntario" : fullName}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los datos personales, el acta y la formación del voluntario."
              : "Información personal y seguimiento del compromiso voluntario."}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={submit} className="space-y-5">
            <section className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Datos personales
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="volunteer-first-name">Nombre</Label>
                  <Input
                    id="volunteer-first-name"
                    value={values.firstName}
                    onChange={(event) =>
                      updateValue("firstName", event.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volunteer-last-name">Apellido</Label>
                  <Input
                    id="volunteer-last-name"
                    value={values.lastName}
                    onChange={(event) =>
                      updateValue("lastName", event.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volunteer-specialty">Especialidad</Label>
                  <Input
                    id="volunteer-specialty"
                    value={values.specialty}
                    onChange={(event) =>
                      updateValue("specialty", event.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volunteer-phone">Teléfono</Label>
                  <Input
                    id="volunteer-phone"
                    value={values.phone}
                    onChange={(event) =>
                      updateValue("phone", event.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="volunteer-email">Email</Label>
                  <Input
                    id="volunteer-email"
                    type="email"
                    value={values.email}
                    onChange={(event) =>
                      updateValue("email", event.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volunteer-birth-date">
                    Fecha de nacimiento
                  </Label>
                  <Input
                    id="volunteer-birth-date"
                    type="date"
                    value={values.birthDate}
                    onChange={(event) =>
                      updateValue("birthDate", event.target.value)
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Compromiso
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="volunteer-commitment-start">
                    Inicio del compromiso
                  </Label>
                  <Input
                    id="volunteer-commitment-start"
                    type="date"
                    value={values.commitmentStartAt}
                    onChange={(event) =>
                      updateValue("commitmentStartAt", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volunteer-commitment-end">
                    Fin del compromiso
                  </Label>
                  <Input
                    id="volunteer-commitment-end"
                    type="date"
                    value={values.commitmentEndAt}
                    onChange={(event) =>
                      updateValue("commitmentEndAt", event.target.value)
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={values.hasVolunteerCertificate}
                  onCheckedChange={(checked) =>
                    updateValue("hasVolunteerCertificate", checked === true)
                  }
                />
                Tiene certificado de voluntariado
              </label>
            </section>

            <section className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Formación y comentarios
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={values.completedSustainabilityModule}
                    onCheckedChange={(checked) =>
                      updateValue(
                        "completedSustainabilityModule",
                        checked === true,
                      )
                    }
                  />
                  Módulo de sostenibilidad completado
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={values.completedDesignThinkingModule}
                    onCheckedChange={(checked) =>
                      updateValue(
                        "completedDesignThinkingModule",
                        checked === true,
                      )
                    }
                  />
                  Módulo de design thinking completado
                </label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="volunteer-additional-comments">
                  Comentarios adicionales
                </Label>
                <Textarea
                  id="volunteer-additional-comments"
                  value={values.additionalComments}
                  onChange={(event) =>
                    updateValue("additionalComments", event.target.value)
                  }
                  rows={4}
                />
              </div>
            </section>

            {formError && (
              <p className="text-destructive text-sm">{formError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={cancelEditing}
                disabled={updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                {volunteer.firstName[0]}
                {volunteer.lastName[0]}
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold">{fullName}</p>
                <p className="text-muted-foreground text-sm">
                  {volunteer.specialty}
                </p>
              </div>
            </div>
            <section className="grid grid-cols-1 gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <Detail label="Email" value={volunteer.email} />
              <Detail label="Teléfono" value={volunteer.phone} />
              <Detail
                label="Fecha de nacimiento"
                value={formatCommitmentDate(volunteer.birthDate)}
              />
              <Detail
                label="Inicio del compromiso"
                value={formatCommitmentDate(volunteer.commitmentStartAt)}
              />
              <Detail
                label="Fin del compromiso"
                value={formatCommitmentDate(volunteer.commitmentEndAt)}
              />
              <BooleanDetail
                label="Certificado de voluntariado"
                value={volunteer.hasVolunteerCertificate}
              />
              <BooleanDetail
                label="Módulo de sostenibilidad"
                value={volunteer.completedSustainabilityModule}
              />
              <BooleanDetail
                label="Módulo de design thinking"
                value={volunteer.completedDesignThinkingModule}
              />
            </section>
            <section className="space-y-1">
              <p className="text-muted-foreground text-xs">
                Comentarios adicionales
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {volunteer.additionalComments || "Sin comentarios"}
              </p>
            </section>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              {canEdit && (
                <Button onClick={() => setIsEditing(true)}>
                  Editar perfil
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
