import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HeartHandshake } from "lucide-react"
import { toast } from "sonner"
import type { Volunteer } from "@/api/volunteers"
import { volunteersApi } from "@/api/volunteers"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { CopyValue } from "@/components/ds/copy-value"
import { FieldGrid } from "@/components/ds/data"
import { FormModal } from "@/components/ds/form-modal"
import { Modal } from "@/components/ds/modal"
import type { Values } from "@/components/ds/questions"
import { boolToYes, userEditGroups, yesToBool } from "@/lib/user-questions"
import { formatCommitmentDate } from "@/lib/volunteer-commitment"
import { volunteerName } from "../_lib/volunteer-filters"
import { useVolunteerCalendar } from "../_hooks/use-volunteers"

export function VolunteerProfileDialog({
  volunteer,
  canEdit,
  onClose,
}: {
  volunteer: Volunteer
  canEdit: boolean
  onClose: () => void
}) {
  const [editing, setEditing] = useState(false)
  const queryClient = useQueryClient()
  const range = useMemo(() => {
    const now = new Date()
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
    }
  }, [])
  const calendar = useVolunteerCalendar(range.from, range.to)
  const entry = calendar.data?.volunteers.find((item) => item.id === volunteer.id)
  const patients = [...new Map((entry?.appointments ?? []).map((item) => [item.patientId, item.patientName])).values()]
  const upcoming = [...(entry?.appointments ?? [])]
    .filter((item) => item.status === "SCHEDULED" || item.status === "OVERDUE")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const slots = [...(entry?.availabilitySlots ?? [])].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))

  const update = useMutation({
    mutationFn: (input: Parameters<typeof volunteersApi.update>[1]) => volunteersApi.update(volunteer.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] })
      queryClient.invalidateQueries({ queryKey: ["volunteer-calendar"] })
    },
  })

  async function submit(values: Values) {
    if ((values.firstName ?? "").trim().length < 2) return toast.error("Escribe el nombre")
    if ((values.lastName ?? "").trim().length < 2) return toast.error("Escribe el apellido")
    if ((values.phone ?? "").trim().length < 9) return toast.error("El teléfono debe tener al menos 9 dígitos")
    if ((values.specialty ?? "").trim().length < 2) return toast.error("Escribe la especialidad")
    if (values.commitmentStartAt && values.commitmentEndAt && values.commitmentEndAt < values.commitmentStartAt) {
      return toast.error("La fecha de fin debe ser posterior al inicio")
    }
    try {
      await update.mutateAsync({
        firstName: values.firstName!.trim(),
        lastName: values.lastName!.trim(),
        specialty: values.specialty!.trim(),
        email: values.email!.trim(),
        phone: values.phone!.trim(),
        birthDate: values.birthDate || null,
        commitmentStartAt: values.commitmentStartAt || null,
        commitmentEndAt: values.commitmentEndAt || null,
        hasVolunteerCertificate: yesToBool(values.hasVolunteerCertificate),
        additionalComments: values.additionalComments?.trim() || null,
        completedSustainabilityModule: yesToBool(values.completedSustainabilityModule),
        completedDesignThinkingModule: yesToBool(values.completedDesignThinkingModule),
      })
      toast.success("Perfil actualizado")
      setEditing(false)
    } catch (error) {
      toast.error("No se pudo guardar el perfil", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      })
    }
  }

  if (editing) {
    return (
      <FormModal
        icon={HeartHandshake}
        title="Editar voluntario"
        description={volunteerName(volunteer)}
        groups={userEditGroups()}
        initial={{
          role: "VOLUNTEER",
          email: volunteer.email,
          firstName: volunteer.firstName,
          lastName: volunteer.lastName,
          phone: volunteer.phone,
          specialty: volunteer.specialty,
          birthDate: volunteer.birthDate?.slice(0, 10) ?? null,
          commitmentStartAt: volunteer.commitmentStartAt?.slice(0, 10) ?? null,
          commitmentEndAt: volunteer.commitmentEndAt?.slice(0, 10) ?? null,
          hasVolunteerCertificate: boolToYes(volunteer.hasVolunteerCertificate),
          completedSustainabilityModule: boolToYes(volunteer.completedSustainabilityModule),
          completedDesignThinkingModule: boolToYes(volunteer.completedDesignThinkingModule),
          additionalComments: volunteer.additionalComments,
        }}
        submitLabel="Guardar"
        pending={update.isPending}
        onClose={() => !update.isPending && setEditing(false)}
        onSubmit={submit}
      />
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      icon={HeartHandshake}
      title={volunteerName(volunteer)}
      description={volunteer.specialty}
      tags={volunteer.isActive ? <Chip tone="green">Activo</Chip> : <Chip tone="gray">Inactivo</Chip>}
      footer={
        canEdit ? (
          <Button variant="dark" onClick={() => setEditing(true)}>
            Editar
          </Button>
        ) : undefined
      }
    >
      <Panel title="Datos">
        <FieldGrid
          items={[
            ["Correo", <CopyValue key="email" value={volunteer.email} label="Correo" />],
            ["Teléfono", volunteer.phone ? <CopyValue key="phone" value={volunteer.phone} label="Teléfono" /> : "Sin teléfono"],
            ["Nacimiento", volunteer.birthDate ? formatCommitmentDate(volunteer.birthDate) : "Sin registrar"],
            ["Acta", volunteer.commitmentEndAt ? `Hasta ${formatCommitmentDate(volunteer.commitmentEndAt)}` : "Sin fecha"],
          ]}
        />
      </Panel>
      <Panel title="Especialidad">
        <p className="text-sm text-zinc-800">{volunteer.specialty}</p>
      </Panel>
      <Panel title="Pacientes">
        {patients.length === 0 ? (
          <p className="text-[13px] text-zinc-500">No hay pacientes en el mes en curso.</p>
        ) : (
          <ul className="space-y-1 text-sm text-zinc-800">
            {patients.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Sesiones próximas">
        {upcoming.length === 0 ? (
          <p className="text-[13px] text-zinc-500">No hay sesiones agendadas este mes.</p>
        ) : (
          <ul className="space-y-2 text-sm text-zinc-800">
            {upcoming.map((session) => (
              <li key={session.id}>
                {session.patientName}
                <span className="text-[13px] text-zinc-500">
                  {" "}
                  · {new Date(session.scheduledAt).toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Disponibilidad">
        {slots.length === 0 ? (
          <p className="text-[13px] text-zinc-500">No hay horarios cargados este mes.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {slots.map((slot) => (
              <Chip key={slot.id} tone={slot.status === "AVAILABLE" ? "blue" : "gray"}>
                {slot.date.slice(8, 10)} · {slot.startTime.slice(0, 5)}
              </Chip>
            ))}
          </ul>
        )}
      </Panel>
    </Modal>
  )
}
