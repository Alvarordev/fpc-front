import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Agent } from "@/api/agents"
import { agentsApi } from "@/api/agents"
import type { Foundation } from "@/api/foundations"
import { foundationsApi } from "@/api/foundations"
import type { User, UpdateUserInput } from "@/api/users"
import type { Volunteer } from "@/api/volunteers"
import { volunteersApi } from "@/api/volunteers"
import { useUpdateUser } from "../_hooks/use-users"
import type { UserRole } from "@/types"

const schema = z
  .object({
    email: z.string().email("Email inválido"),
    password: z.string().optional(),
    isActive: z.boolean(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    specialty: z.string().optional(),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    commitmentStartAt: z.string().optional(),
    commitmentEndAt: z.string().optional(),
    hasVolunteerCertificate: z.boolean(),
    additionalComments: z.string().optional(),
    completedSustainabilityModule: z.boolean(),
    completedDesignThinkingModule: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.password && data.password.length > 0 && data.password.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Mínimo 8 caracteres",
      })
    }
  })

type FormValues = z.infer<typeof schema>

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  FOUNDATION: "Fundación",
  AGENT: "Agente",
  VOLUNTEER: "Voluntario",
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  const space = trimmed.indexOf(" ")
  if (space === -1) return { firstName: trimmed, lastName: "" }
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim(),
  }
}

export type UserProfileMatch =
  | { role: "AGENT"; profile: Agent }
  | { role: "FOUNDATION"; profile: Foundation }
  | { role: "VOLUNTEER"; profile: Volunteer }
  | { role: "ADMIN"; profile: null }

interface EditUserDialogProps {
  user: User | null
  profileMatch: UserProfileMatch | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function defaultsFrom(
  user: User,
  match: UserProfileMatch | null,
): FormValues {
  const base: FormValues = {
    email: user.email,
    password: "",
    isActive: user.isActive,
    firstName: "",
    lastName: "",
    specialty: "",
    phone: "",
    birthDate: "",
    commitmentStartAt: "",
    commitmentEndAt: "",
    hasVolunteerCertificate: false,
    additionalComments: "",
    completedSustainabilityModule: false,
    completedDesignThinkingModule: false,
  }

  if (!match) return base

  if (match.role === "AGENT") {
    const names = splitFullName(match.profile.fullName)
    return {
      ...base,
      firstName: names.firstName,
      lastName: names.lastName,
      phone: match.profile.phone,
    }
  }

  if (match.role === "FOUNDATION") {
    return {
      ...base,
      firstName: match.profile.firstName,
      lastName: match.profile.lastName,
      phone: match.profile.phone,
    }
  }

  if (match.role === "VOLUNTEER") {
    return {
      ...base,
      firstName: match.profile.firstName,
      lastName: match.profile.lastName,
      specialty: match.profile.specialty,
      phone: match.profile.phone,
      birthDate: match.profile.birthDate?.slice(0, 10) ?? "",
      commitmentStartAt: match.profile.commitmentStartAt?.slice(0, 10) ?? "",
      commitmentEndAt: match.profile.commitmentEndAt?.slice(0, 10) ?? "",
      hasVolunteerCertificate: match.profile.hasVolunteerCertificate,
      additionalComments: match.profile.additionalComments ?? "",
      completedSustainabilityModule:
        match.profile.completedSustainabilityModule,
      completedDesignThinkingModule:
        match.profile.completedDesignThinkingModule,
    }
  }

  return base
}

export function EditUserDialog({
  user,
  profileMatch,
  open,
  onOpenChange,
}: EditUserDialogProps) {
  const updateUser = useUpdateUser()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)

  const updateAgent = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Parameters<typeof agentsApi.update>[1]
    }) => agentsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] })
    },
  })
  const updateFoundation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Parameters<typeof foundationsApi.update>[1]
    }) => foundationsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foundations"] })
      queryClient.invalidateQueries({ queryKey: ["users", "foundation-team"] })
    },
  })
  const updateVolunteer = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Parameters<typeof volunteersApi.update>[1]
    }) => volunteersApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] })
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      isActive: true,
      firstName: "",
      lastName: "",
      specialty: "",
      phone: "",
      birthDate: "",
      commitmentStartAt: "",
      commitmentEndAt: "",
      hasVolunteerCertificate: false,
      additionalComments: "",
      completedSustainabilityModule: false,
      completedDesignThinkingModule: false,
    },
  })

  useEffect(() => {
    if (open && user) {
      reset(defaultsFrom(user, profileMatch))
      setFormError(null)
    }
  }, [open, user, profileMatch, reset])

  const isPending =
    updateUser.isPending ||
    updateAgent.isPending ||
    updateFoundation.isPending ||
    updateVolunteer.isPending

  const role = user?.role
  const showProfile =
    role === "AGENT" || role === "FOUNDATION" || role === "VOLUNTEER"

  function handleClose() {
    if (isPending) return
    onOpenChange(false)
    setFormError(null)
  }

  async function onSubmit(values: FormValues) {
    if (!user || user.role === "ADMIN") return
    setFormError(null)

    try {
      const accountInput: UpdateUserInput = {
        email: values.email.trim(),
        isActive: values.isActive,
      }
      if (values.password && values.password.length >= 8) {
        accountInput.password = values.password
      }

      await updateUser.mutateAsync({ id: user.id, input: accountInput })

      if (role === "AGENT" && profileMatch?.role === "AGENT") {
        await updateAgent.mutateAsync({
          id: profileMatch.profile.id,
          input: {
            fullName: `${values.firstName ?? ""} ${values.lastName ?? ""}`.trim(),
            phone: values.phone?.trim() || undefined,
          },
        })
      } else if (
        role === "FOUNDATION" &&
        profileMatch?.role === "FOUNDATION"
      ) {
        await updateFoundation.mutateAsync({
          id: profileMatch.profile.id,
          input: {
            firstName: values.firstName?.trim() || undefined,
            lastName: values.lastName?.trim() || undefined,
            phone: values.phone?.trim() || undefined,
          },
        })
      } else if (role === "VOLUNTEER" && profileMatch?.role === "VOLUNTEER") {
        if (
          values.commitmentStartAt &&
          values.commitmentEndAt &&
          values.commitmentEndAt < values.commitmentStartAt
        ) {
          setFormError("La fecha de fin debe ser posterior al inicio")
          return
        }
        await updateVolunteer.mutateAsync({
          id: profileMatch.profile.id,
          input: {
            firstName: values.firstName?.trim() || undefined,
            lastName: values.lastName?.trim() || undefined,
            specialty: values.specialty?.trim() || undefined,
            email: values.email.trim(),
            phone: values.phone?.trim() || undefined,
            birthDate: values.birthDate || null,
            commitmentStartAt: values.commitmentStartAt || null,
            commitmentEndAt: values.commitmentEndAt || null,
            hasVolunteerCertificate: values.hasVolunteerCertificate,
            additionalComments: values.additionalComments?.trim() || null,
            completedSustainabilityModule: values.completedSustainabilityModule,
            completedDesignThinkingModule: values.completedDesignThinkingModule,
          },
        })
      }

      toast.success("Usuario actualizado")
      handleClose()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Error al actualizar usuario",
      )
    }
  }

  if (!user) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose()
      }}
    >
      <DialogContent className="max-h-[90vh] w-[min(92vw,28rem)] overflow-y-auto p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Rol</Label>
            <div>
              <Badge variant="outline">{roleLabels[user.role]}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              {...register("email")}
              className="h-9 text-sm"
            />
            {errors.email && (
              <p className="text-destructive text-xs">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">
              Contraseña{" "}
              <span className="text-muted-foreground font-normal">
                (dejar vacío para no cambiar)
              </span>
            </Label>
            <Input
              type="password"
              {...register("password")}
              className="h-9 text-sm"
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-destructive text-xs">
                {errors.password.message}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch("isActive")}
              onCheckedChange={(checked) =>
                setValue("isActive", checked === true)
              }
            />
            Usuario activo
          </label>

          {showProfile && (
            <div className="mt-4 border-t pt-4">
              <p className="text-muted-foreground mb-3 text-xs font-medium">
                Datos del perfil
              </p>

              {!profileMatch || profileMatch.role === "ADMIN" ? (
                <p className="text-muted-foreground text-xs">
                  No se encontró el perfil vinculado a este usuario.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        {...register("firstName")}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Apellido</Label>
                      <Input
                        {...register("lastName")}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {role === "VOLUNTEER" && (
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs">Especialidad</Label>
                      <Input
                        {...register("specialty")}
                        className="h-9 text-sm"
                      />
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    <Label className="text-xs">Teléfono</Label>
                    <Input {...register("phone")} className="h-9 text-sm" />
                  </div>

                  {role === "VOLUNTEER" && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      <p className="text-muted-foreground text-xs font-medium">
                        Datos adicionales del voluntariado
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Fecha de nacimiento</Label>
                          <Input
                            type="date"
                            {...register("birthDate")}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">
                            Inicio del compromiso
                          </Label>
                          <Input
                            type="date"
                            {...register("commitmentStartAt")}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Fin del compromiso</Label>
                          <Input
                            type="date"
                            {...register("commitmentEndAt")}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={watch("hasVolunteerCertificate")}
                          onCheckedChange={(checked) =>
                            setValue(
                              "hasVolunteerCertificate",
                              checked === true,
                            )
                          }
                        />
                        Tiene certificado de voluntariado
                      </label>
                      <div className="space-y-2">
                        <Label className="text-xs">
                          Comentarios adicionales
                        </Label>
                        <Textarea
                          {...register("additionalComments")}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={watch("completedSustainabilityModule")}
                            onCheckedChange={(checked) =>
                              setValue(
                                "completedSustainabilityModule",
                                checked === true,
                              )
                            }
                          />
                          Módulo de sostenibilidad completado
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={watch("completedDesignThinkingModule")}
                            onCheckedChange={(checked) =>
                              setValue(
                                "completedDesignThinkingModule",
                                checked === true,
                              )
                            }
                          />
                          Módulo de design thinking completado
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>

        {(formError ||
          updateUser.isError ||
          updateAgent.isError ||
          updateFoundation.isError ||
          updateVolunteer.isError) && (
          <div className="border-destructive/20 bg-destructive/5 mt-2 rounded-xl border p-4">
            <p className="text-destructive text-sm">
              {formError ??
                (updateUser.error as Error)?.message ??
                (updateAgent.error as Error)?.message ??
                (updateFoundation.error as Error)?.message ??
                (updateVolunteer.error as Error)?.message ??
                "Error al actualizar usuario"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
