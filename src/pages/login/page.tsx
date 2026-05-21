import { LoginForm } from "./_components/login-form";

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl min-h-[600px]">
        <aside className="relative hidden w-[45%] overflow-hidden lg:block">
          <img
            src="/img_voluntario.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/50" />

          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <img
              src="/logo_footer.png"
              alt="Fundación Peruana de Cáncer"
              className="h-12 w-auto object-contain"
            />

            <div className="space-y-2">
              <p className="text-lg font-semibold leading-relaxed text-white/90">
                Acompañamos a pacientes oncológicos con apoyo psicológico
                gratuito en todo el Perú.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex flex-1 items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="flex flex-col items-center gap-3 lg:hidden">
              <img
                src="/logo_footer.png"
                alt="FPC"
                className="h-10 w-auto object-contain brightness-0 dark:brightness-100 dark:invert"
              />
              <h1 className="text-lg font-semibold text-foreground">
                Fundación Peruana de Cáncer
              </h1>
            </div>

            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
