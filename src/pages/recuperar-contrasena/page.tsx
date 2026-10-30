import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/pages/login/_components/auth-shell";

const schema = z.object({
  email: z.string().trim().email("Ingresa un correo válido"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const request = useMutation({
    mutationFn: (values: FormValues) => authApi.requestPasswordReset(values.email),
    onSuccess: (_data, values) => setSentTo(values.email),
  });

  return (
    <AuthShell>
      {sentTo ? (
        <div className="space-y-6">
          <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <MailCheck className="size-5" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Revisa tu correo
            </h2>
            <p className="text-sm text-muted-foreground">
              Si <span className="font-medium text-foreground">{sentTo}</span>{" "}
              tiene una cuenta, te enviamos un enlace para elegir una nueva
              contraseña. Vence en 1 hora.
            </p>
            <p className="text-sm text-muted-foreground">
              Si no llega en unos minutos, revisa la carpeta de spam o pide otro
              enlace.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setSentTo(null)}
            >
              Pedir otro enlace
            </Button>
            <BackToLogin />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Recuperar contraseña
            </h2>
            <p className="text-sm text-muted-foreground">
              Escribe el correo con el que ingresas al CRM y te enviaremos un
              enlace para elegir una nueva contraseña.
            </p>
          </div>

          <form
            onSubmit={handleSubmit((values) => request.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="nombre@fpc.org.pe"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              )}
            </div>

            {request.error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2.5">
                <p className="text-destructive text-sm">{request.error.message}</p>
              </div>
            )}

            <Button type="submit" disabled={request.isPending} className="w-full">
              {request.isPending ? "Enviando…" : "Enviar enlace"}
            </Button>
          </form>

          <BackToLogin />
        </div>
      )}
    </AuthShell>
  );
}

export function BackToLogin() {
  return (
    <Link
      to="/login"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <ArrowLeft className="size-4" />
      Volver a iniciar sesión
    </Link>
  );
}
