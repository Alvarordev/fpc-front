import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
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
import { useCreateUser } from "../_hooks/use-users"
import { agentsApi } from "@/api/agents"
import { volunteersApi } from "@/api/volunteers"
import type { UserRole } from "@/types"

const schema = z
  .object({
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    role: z.enum(["ADMIN", "FOUNDATION", "AGENT", "VOLUNTEER"] as const),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    specialty: z.string().optional(),
    phone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "VOLUNTEER" && data.role !== "AGENT") return

    if (!data.firstName || data.firstName.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["firstName"],
        message: "Nombre requerido (mín. 2 caracteres)",
      })
    }
    if (!data.lastName || data.lastName.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["lastName"],
        message: "Apellido requerido (mín. 2 caracteres)",
      })
    }
    if (data.role === "VOLUNTEER" && (!data.specialty || data.specialty.trim().length < 2)) {
      ctx.addIssue({
        code: "custom",
        path: ["specialty"],
        message: "Especialidad requerida",
      })
    }
    if (!data.phone || data.phone.trim().length < 9) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Teléfono inválido (mín. 9 dígitos)",
      })
    }
  })

type FormValues = z.infer<typeof schema>

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  FOUNDATION: "Fundación",
  AGENT: "Agente",
  VOLUNTEER: "Voluntario",
}

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const createUser = useCreateUser()
  const [stepError, setStepError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const createAgent = useMutation({ mutationFn: agentsApi.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); queryClient.invalidateQueries({ queryKey: ["agents"] }) } })
  const createVolunteer = useMutation({ mutationFn: volunteersApi.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); queryClient.invalidateQueries({ queryKey: ["volunteers"] }) } })

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
      role: "AGENT",
      firstName: "",
      lastName: "",
      specialty: "",
      phone: "",
    },
  })

  const selectedRole = watch("role")
  const isPending = createUser.isPending || createAgent.isPending || createVolunteer.isPending

  function handleClose() {
    onOpenChange(false)
    reset()
    setStepError(null)
  }

  async function onSubmit(values: FormValues) {
    setStepError(null)

    if (values.role === "AGENT") {
      await createAgent.mutateAsync({ email: values.email, password: values.password, fullName: `${values.firstName ?? ""} ${values.lastName ?? ""}`.trim(), phone: values.phone ?? "" })
      handleClose()
      return
    }
    if (values.role === "VOLUNTEER") {
      await createVolunteer.mutateAsync({ email: values.email, password: values.password, firstName: values.firstName!, lastName: values.lastName!, specialty: values.specialty!, phone: values.phone! })
      handleClose()
      return
    }
    await createUser.mutateAsync({ email: values.email, password: values.password, role: values.role })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(92vw,26rem)] p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>Crear nuevo usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Rol</Label>
            <Select
              items={{
                AGENT: "Agente",
                VOLUNTEER: "Voluntario",
                ADMIN: "Administrador",
                FOUNDATION: "Fundación",
              }}
              value={selectedRole}
              onValueChange={(v) => setValue("role", v as UserRole)}
            >
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AGENT">Agente</SelectItem>
                <SelectItem value="VOLUNTEER">Voluntario</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="FOUNDATION">Fundación</SelectItem>
              </SelectContent>
            </Select>
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
            <Label className="text-xs">Contraseña</Label>
            <Input
              type="password"
              {...register("password")}
              className="h-9 text-sm"
            />
            {errors.password && (
              <p className="text-destructive text-xs">
                {errors.password.message}
              </p>
            )}
          </div>

          {(selectedRole === "VOLUNTEER" || selectedRole === "AGENT") && (
            <>
              <div className="mt-4 border-t pt-4">
                <p className="text-muted-foreground mb-3 text-xs font-medium">
                  Datos del perfil
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      {...register("firstName")}
                      className="h-9 text-sm"
                      placeholder="Juan"
                    />
                    {errors.firstName && (
                      <p className="text-destructive text-xs">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Apellido</Label>
                    <Input
                      {...register("lastName")}
                      className="h-9 text-sm"
                      placeholder="Pérez"
                    />
                    {errors.lastName && (
                      <p className="text-destructive text-xs">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {selectedRole === "VOLUNTEER" && <div className="mt-3 space-y-2">
                  <Label className="text-xs">Especialidad</Label>
                  <Input
                    {...register("specialty")}
                    className="h-9 text-sm"
                    placeholder="Psicooncología, Psicología clínica, etc."
                  />
                  {errors.specialty && (
                    <p className="text-destructive text-xs">
                      {errors.specialty.message}
                    </p>
                  )}
                </div>}

                <div className="mt-3 space-y-2">
                  <Label className="text-xs">Teléfono</Label>
                  <Input
                    {...register("phone")}
                    className="h-9 text-sm"
                    placeholder="987654321"
                  />
                  {errors.phone && (
                    <p className="text-destructive text-xs">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending
                ? "Creando..."
                  : `Crear ${roleLabels[selectedRole].toLowerCase()}`}
            </Button>
          </div>
        </form>

        {(createUser.isError || createAgent.isError || createVolunteer.isError || stepError) && (
          <div className="border-destructive/20 bg-destructive/5 mt-2 rounded-xl border p-4">
            <p className="text-destructive text-sm">
              {stepError ??
                (createUser.error as Error)?.message ?? (createAgent.error as Error)?.message ?? (createVolunteer.error as Error)?.message ??
                "Error al crear usuario"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
