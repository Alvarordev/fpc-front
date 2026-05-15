import { useAuthStore } from "@/store/auth-store";
import { AdminPatientsContent } from "./admin-patients-content";
import { VolunteerPatientsContent } from "./volunteer-patients-content";

export function PatientsContent() {
  const role = useAuthStore((s) => s.user?.role);

  if (role === "VOLUNTEER") {
    return <VolunteerPatientsContent />;
  }

  return <AdminPatientsContent />;
}
