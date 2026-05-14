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
import type { UserRole } from "@/types";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(["ADMIN", "AGENT", "VOLUNTEER"] as const),
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", role: "AGENT" },
  });

  const selectedRole = watch("role");

  function handleClose() {
    onOpenChange(false);
    reset();
  }

  async function onSubmit(values: FormValues) {
    await createUser.mutateAsync(values);
    handleClose();
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
              disabled={createUser.isPending}
            >
              {createUser.isPending
                ? "Creando..."
                : `Crear ${roleLabels[selectedRole].toLowerCase()}`}
            </Button>
          </div>
        </form>

        {createUser.isError && (
          <div className="border-destructive/20 bg-destructive/5 rounded-xl border p-4 mt-2">
            <p className="text-destructive text-sm">
              {(createUser.error as Error)?.message ?? "Error al crear usuario"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
