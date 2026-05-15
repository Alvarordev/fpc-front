import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  // Volunteers go straight to their agenda
  if (user?.role === "VOLUNTEER") {
    return <Navigate to="/agenda" replace />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </div>
  );
}
