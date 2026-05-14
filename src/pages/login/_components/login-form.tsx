import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLogin } from "../_hooks/use-login";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const { mutate, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(values: LoginFormValues) {
    mutate(values, {
      onSuccess: () => navigate("/"),
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center text-lg">
          Fundación Peruana de Cáncer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-destructive text-sm">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <p className="text-destructive text-sm">{error.message}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
