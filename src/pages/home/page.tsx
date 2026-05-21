import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { DashboardPage } from "@/pages/dashboard/page";
import AgentAgendaPage from "@/pages/agente-agenda/page";

export function HomePage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === "ADMIN") return <DashboardPage />;
  if (user?.role === "AGENT") return <AgentAgendaPage />;

  return <Navigate to="/agenda" replace />;
}
