import { createBrowserRouter } from "react-router-dom";
import { AuthGuard, GuestGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { LoginPage } from "@/pages/login/page";
import { DashboardPage } from "@/pages/dashboard/page";
import PatientsPage from "@/pages/pacientes/page";
import PatientDetailPage from "@/pages/pacientes/[id]/page";
import ContactPage from "@/pages/pacientes/[id]/contacto/page";
import VolunteersPage from "@/pages/voluntarios/page";
import UsersPage from "@/pages/usuarios/page";
import HealthCentersPage from "@/pages/hospitales/page";
import AlertsPage from "@/pages/alertas/page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <GuestGuard>
        <LoginPage />
      </GuestGuard>
    ),
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "pacientes", element: <PatientsPage /> },
      { path: "pacientes/:id", element: <PatientDetailPage /> },
      { path: "pacientes/:id/contacto", element: <ContactPage /> },
      { path: "voluntarios", element: <VolunteersPage /> },
      { path: "usuarios", element: <UsersPage /> },
      { path: "hospitales", element: <HealthCentersPage /> },
      { path: "alertas", element: <AlertsPage /> },
    ],
  },
]);
