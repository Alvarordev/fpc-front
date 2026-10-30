import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UserRound } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { foundationsApi } from "@/api/foundations"
import type { User } from "@/api/users"
import { volunteersApi } from "@/api/volunteers"
import { FormModal } from "@/components/ds/form-modal"
import type { Values } from "@/components/ds/questions"
import { boolToYes, userCreateGroups, userEditGroups, userRoleLabels, yesToBool } from "@/lib/user-questions"
import { useCreateUser, useUpdateUser } from "../_hooks/use-users"
import type { UserProfileMatch } from "./user-profile"

function splitFullName(fullName: string) {
  const trimmed = fullName.trim()
  const space = trimmed.indexOf(" ")
  if (space === -1) return { firstName: trimmed, lastName: "" }
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1).trim() }
}

export function UserFormModal({
  open,
  user,
  profileMatch,
  onClose,
}: {
  open: boolean
  user?: User | null
  profileMatch?: UserProfileMatch | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const createAgent = useMutation({ mutationFn: agentsApi.create, onSuccess: invalidate })
  const createVolunteer = useMutation({ mutationFn: volunteersApi.create, onSuccess: invalidate })
  const createFoundation = useMutation({ mutationFn: foundationsApi.create, onSuccess: invalidate })
  const updateAgent = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof agentsApi.update>[1] }) => agentsApi.update(id, input),
    onSuccess: invalidate,
  })
  const updateVolunteer = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof volunteersApi.update>[1] }) => volunteersApi.update(id, input),
    onSuccess: invalidate,
  })
  const updateFoundation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof foundationsApi.update>[1] }) => foundationsApi.update(id, input),
    onSuccess: invalidate,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["users"] })
    queryClient.invalidateQueries({ queryKey: ["agents"] })
    queryClient.invalidateQueries({ queryKey: ["volunteers"] })
    queryClient.invalidateQueries({ queryKey: ["foundations"] })
  }

  if (!open) return null
  const editing = Boolean(user)
  const pending =
    createUser.isPending ||
    updateUser.isPending ||
    createAgent.isPending ||
    createVolunteer.isPending ||
    createFoundation.isPending ||
    updateAgent.isPending ||
    updateVolunteer.isPending ||
    updateFoundation.isPending

  async function submit(values: Values) {
    const email = values.email?.trim() ?? ""
    const password = values.password?.trim() ?? ""
    const role = (editing ? user!.role : values.role) as User["role"]
    if (!editing && password.length < 8) return toast.error("La contraseña debe tener al menos 8 caracteres")
    if (role !== "ADMIN") {
      if ((values.firstName ?? "").trim().length < 2) return toast.error("Escribe el nombre")
      if ((values.lastName ?? "").trim().length < 2) return toast.error("Escribe el apellido")
      if ((values.phone ?? "").trim().length < 9) return toast.error("El teléfono debe tener al menos 9 dígitos")
    }
    if (role === "VOLUNTEER" && (values.specialty ?? "").trim().length < 2) return toast.error("Escribe la especialidad")
    if (values.commitmentStartAt && values.commitmentEndAt && values.commitmentEndAt < values.commitmentStartAt) {
      return toast.error("La fecha de fin debe ser posterior al inicio")
    }
    try {
      if (editing && user) await saveEdit(user, role, email, values, profileMatch ?? null)
      else await saveCreate(role, email, password, values)
      toast.success(editing ? "Usuario actualizado" : "Usuario creado", { description: email })
      onClose()
    } catch (error) {
      toast.error(editing ? "No se pudo guardar el usuario" : "No se pudo crear el usuario", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      })
    }
  }

  async function saveCreate(role: User["role"], email: string, password: string, values: Values) {
    const firstName = values.firstName!.trim()
    const lastName = values.lastName?.trim() ?? ""
    const phone = values.phone?.trim() ?? ""
    if (role === "AGENT") await createAgent.mutateAsync({ email, password, fullName: `${firstName} ${lastName}`.trim(), phone })
    else if (role === "VOLUNTEER") {
      await createVolunteer.mutateAsync({
        email,
        password,
        firstName,
        lastName,
        specialty: values.specialty!.trim(),
        phone,
        birthDate: values.birthDate || undefined,
        commitmentStartAt: values.commitmentStartAt || undefined,
        commitmentEndAt: values.commitmentEndAt || undefined,
        hasVolunteerCertificate: yesToBool(values.hasVolunteerCertificate),
        additionalComments: values.additionalComments?.trim() || undefined,
        completedSustainabilityModule: yesToBool(values.completedSustainabilityModule),
        completedDesignThinkingModule: yesToBool(values.completedDesignThinkingModule),
      })
    } else if (role === "FOUNDATION") await createFoundation.mutateAsync({ email, password, firstName, lastName, phone })
    else await createUser.mutateAsync({ email, password, role })
  }

  async function saveEdit(target: User, role: User["role"], email: string, values: Values, match: UserProfileMatch | null) {
    await updateUser.mutateAsync({ id: target.id, input: { email } })
    if (role === "AGENT" && match?.role === "AGENT") {
      await updateAgent.mutateAsync({
        id: match.profile.id,
        input: { fullName: `${values.firstName ?? ""} ${values.lastName ?? ""}`.trim(), phone: values.phone?.trim() || undefined },
      })
    } else if (role === "FOUNDATION" && match?.role === "FOUNDATION") {
      await updateFoundation.mutateAsync({
        id: match.profile.id,
        input: {
          firstName: values.firstName?.trim() || undefined,
          lastName: values.lastName?.trim() || undefined,
          phone: values.phone?.trim() || undefined,
        },
      })
    } else if (role === "VOLUNTEER" && match?.role === "VOLUNTEER") {
      await updateVolunteer.mutateAsync({
        id: match.profile.id,
        input: {
          firstName: values.firstName?.trim() || undefined,
          lastName: values.lastName?.trim() || undefined,
          specialty: values.specialty?.trim() || undefined,
          email,
          phone: values.phone?.trim() || undefined,
          birthDate: values.birthDate || null,
          commitmentStartAt: values.commitmentStartAt || null,
          commitmentEndAt: values.commitmentEndAt || null,
          hasVolunteerCertificate: yesToBool(values.hasVolunteerCertificate),
          additionalComments: values.additionalComments?.trim() || null,
          completedSustainabilityModule: yesToBool(values.completedSustainabilityModule),
          completedDesignThinkingModule: yesToBool(values.completedDesignThinkingModule),
        },
      })
    }
  }

  const initial = initialValues(user ?? null, profileMatch ?? null)

  return (
    <FormModal
      icon={UserRound}
      title={editing ? "Editar usuario" : "Nuevo usuario"}
      description={editing && user ? userRoleLabels[user.role] : "Elige el rol y completa los datos de la cuenta."}
      groups={editing ? userEditGroups() : userCreateGroups()}
      initial={initial}
      submitLabel={editing ? "Guardar" : "Crear usuario"}
      pending={pending}
      onClose={onClose}
      onSubmit={submit}
    />
  )
}

function initialValues(user: User | null, match: UserProfileMatch | null): Values {
  if (!user) return { role: "AGENT", hasVolunteerCertificate: "no", completedSustainabilityModule: "no", completedDesignThinkingModule: "no" }
  const base: Values = { email: user.email, role: user.role }
  if (match?.role === "AGENT") {
    const names = splitFullName(match.profile.fullName)
    return { ...base, firstName: names.firstName, lastName: names.lastName, phone: match.profile.phone }
  }
  if (match?.role === "FOUNDATION") {
    return { ...base, firstName: match.profile.firstName, lastName: match.profile.lastName, phone: match.profile.phone }
  }
  if (match?.role === "VOLUNTEER") {
    const volunteer = match.profile
    return {
      ...base,
      firstName: volunteer.firstName,
      lastName: volunteer.lastName,
      phone: volunteer.phone,
      specialty: volunteer.specialty,
      birthDate: volunteer.birthDate,
      commitmentStartAt: volunteer.commitmentStartAt,
      commitmentEndAt: volunteer.commitmentEndAt,
      hasVolunteerCertificate: boolToYes(volunteer.hasVolunteerCertificate),
      completedSustainabilityModule: boolToYes(volunteer.completedSustainabilityModule),
      completedDesignThinkingModule: boolToYes(volunteer.completedDesignThinkingModule),
      additionalComments: volunteer.additionalComments,
    }
  }
  return base
}
