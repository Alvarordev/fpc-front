import { LoginForm } from "./_components/login-form";

export function LoginPage() {
  return (
    <main className="flex min-h-screen">
      {/* ── Left panel: branding ── */}
      <aside
        className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-blue-950 p-10 lg:flex"
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent" />

        {/* Logo */}
        <div className="relative z-10">
          <img
            src="/logo_footer.png"
            alt="Fundación Peruana de Cáncer"
            className="h-14 w-auto object-contain"
          />
        </div>

        {/* Center — volunteer image + tagline */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <img
            src="/img_voluntario.png"
            alt="Voluntario FPC"
            className="max-h-64 w-auto rounded-2xl object-contain opacity-90"
          />
          <div className="max-w-md text-center space-y-2">
            <p className="text-xl font-semibold text-white/90 leading-relaxed">
              Acompañamos a pacientes oncológicos con apoyo psicológico
              gratuito en todo el Perú.
            </p>
            <p className="text-sm text-white/50">
              Programa de Psicooncología · Fundación Peruana de Cáncer
            </p>
          </div>
        </div>

        {/* Bottom attribution */}
        <p className="relative z-10 text-xs text-white/30">
          &copy; {new Date().getFullYear()} Fundación Peruana de Cáncer
        </p>
      </aside>

      {/* ── Right panel: login form ── */}
      <section className="flex flex-1 items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo — only visible on small screens */}
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
    </main>
  );
}
