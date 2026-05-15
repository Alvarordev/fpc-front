import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUser } from "../_hooks/use-users";
import { volunteersApi } from "@/lib/api";
import type { UserRole } from "@/types";

const schema = z
  .object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    role: z.enum(["ADMIN", "AGENT", "VOLUNTEER"] as const),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    specialty: z.string().optional(),
    phone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "VOLUNTEER") return;

    if (!data.firstName || data.firstName.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["firstName"],
        message: "Nombre requerido (mín. 2 caracteres)",
      });
    }
    if (!data.lastName || data.lastName.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["lastName"],
        message: "Apellido requerido (mín. 2 caracteres)",
      });
    }
    if (!data.specialty || data.specialty.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["specialty"],
        message: "Especialidad requerida",
      });
    }
    if (!data.phone || data.phone.trim().length < 9) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Teléfono inválido (mín. 9 dígitos)",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  AGENT: "Agente",
  VOLUNTEER: "Voluntario",
};

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const createUser = useCreateUser();
  const [stepError, setStepError] = useState<string | null>(null);
  const [isCreatingVolunteer, setIsCreatingVolunteer] = useState(false);

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
  });

  const selectedRole = watch("role");
  const isPending = createUser.isPending || isCreatingVolunteer;

  function handleClose() {
    onOpenChange(false);
    reset();
    setStepError(null);
    setIsCreatingVolunteer(false);
  }

  async function onSubmit(values: FormValues) {
    setStepError(null);

    const createdUser = await createUser.mutateAsync({
      email: values.email,
      password: values.password,
      role: values.role,
    });

    if (values.role !== "VOLUNTEER") {
      handleClose();
      return;
    }

    setIsCreatingVolunteer(true);
    try {
      await volunteersApi.create({
        userId: createdUser.id,
        firstName: values.firstName!,
        lastName: values.lastName!,
        specialty: values.specialty!,
        email: values.email,
        phone: values.phone!,
      });
      handleClose();
    } catch (err) {
      setStepError(
        (err as Error)?.message ?? "Error al crear el voluntario",
      );
    } finally {
      setIsCreatingVolunteer(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(92vw,26rem)] p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>Crear nuevo usuario</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 mt-2"
        >
          <div className="space-y-2">
            <Label className="text-xs">Rol</Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => setValue("role", v as UserRole)}
            >
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AGENT">Agente</SelectItem>
                <SelectItem value="VOLUNTEER">Voluntario</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
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
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
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
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {selectedRole === "VOLUNTEER" && (
            <>
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  Datos del voluntario
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
                      <p className="text-xs text-destructive">
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
                      <p className="text-xs text-destructive">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  <Label className="text-xs">Especialidad</Label>
                  <Input
                    {...register("specialty")}
                    className="h-9 text-sm"
                    placeholder="Psicooncología, Psicología clínica, etc."
                  />
                  {errors.specialty && (
                    <p className="text-xs text-destructive">
                      {errors.specialty.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mt-3">
                  <Label className="text-xs">Teléfono</Label>
                  <Input
                    {...register("phone")}
                    className="h-9 text-sm"
                    placeholder="987654321"
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">
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
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending}
            >
              {isPending
                ? isCreatingVolunteer
                  ? "Creando voluntario..."
                  : "Creando..."
                : `Crear ${roleLabels[selectedRole].toLowerCase()}`}
            </Button>
          </div>
        </form>

        {(createUser.isError || stepError) && (
          <div className="border-destructive/20 bg-destructive/5 rounded-xl border p-4 mt-2">
            <p className="text-destructive text-sm">
              {stepError ??
                (createUser.error as Error)?.message ??
                "Error al crear usuario"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
