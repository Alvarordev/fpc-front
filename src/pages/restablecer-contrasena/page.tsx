import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleCheck, Link2Off } from "lucide-react";
import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearAccessToken } from "@/lib/auth-session";
import { useAuthStore } from "@/store/auth-store";
import { AuthShell } from "@/pages/login/_components/auth-shell";
import { BackToLogin } from "@/pages/recuperar-contrasena/page";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Usa al menos 8 caracteres")
      .max(128, "Usa como máximo 128 caracteres"),
    confirm: z.string().min(1, "Repite la nueva contraseña"),
  })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden",
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const verify = useQuery({
    queryKey: ["password-reset", token],
    queryFn: () => authApi.verifyPasswordReset(token).then(() => true),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });
  const reset = useMutation({
    mutationFn: (values: FormValues) => authApi.resetPassword(token, values.password),
    onSuccess: () => {
      // El backend cerró todas las sesiones; se limpia también la de este navegador.
      clearAccessToken();
      useAuthStore.setState({ user: null, isLoading: false });
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const invalid = !token || verify.isError;

  return (
    <AuthShell>
      {reset.isSuccess ? (
        <div className="space-y-6">
          <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CircleCheck className="size-5" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Contraseña actualizada
            </h2>
            <p className="text-sm text-muted-foreground">
              Ya puedes ingresar con tu nueva contraseña. Por seguridad, cerramos
              las sesiones abiertas en otros dispositivos.
            </p>
          </div>
          <Button className="w-full" nativeButton={false} render={<Link to="/login" />}>
            Iniciar sesión
          </Button>
        </div>
      ) : invalid ? (
        <div className="space-y-6">
          <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Link2Off className="size-5" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              El enlace ya no sirve
            </h2>
            <p className="text-sm text-muted-foreground">
              Puede que haya vencido (dura 1 hora), que ya lo hayas usado o que
              esté incompleto. Pide uno nuevo.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              nativeButton={false}
              render={<Link to="/recuperar-contrasena" />}
            >
              Pedir un enlace nuevo
            </Button>
            <BackToLogin />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Elige una nueva contraseña
            </h2>
            <p className="text-sm text-muted-foreground">
              Usa al menos 8 caracteres. Al guardarla, se cerrarán tus sesiones
              abiertas.
            </p>
          </div>

          <form
            onSubmit={handleSubmit((values) => reset.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                autoFocus
                disabled={verify.isLoading}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Repite la contraseña</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                disabled={verify.isLoading}
                {...register("confirm")}
              />
              {errors.confirm && (
                <p className="text-destructive text-xs">{errors.confirm.message}</p>
              )}
            </div>

            {reset.error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2.5">
                <p className="text-destructive text-sm">{reset.error.message}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={verify.isLoading || reset.isPending}
              className="w-full"
            >
              {verify.isLoading
                ? "Comprobando enlace…"
                : reset.isPending
                  ? "Guardando…"
                  : "Guardar contraseña"}
            </Button>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
