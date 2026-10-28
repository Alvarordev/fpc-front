import { AuthShell } from "./_components/auth-shell";
import { LoginForm } from "./_components/login-form";

export function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
