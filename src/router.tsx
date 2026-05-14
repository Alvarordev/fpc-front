import { createBrowserRouter } from "react-router-dom";
import { AuthGuard, GuestGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { LoginPage } from "@/pages/login/page";
import { DashboardPage } from "@/pages/dashboard/page";
import PatientsPage from "@/pages/pacientes/page";
import PatientDetailPage from "@/pages/pacientes/[id]/page";

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
    ],
  },
]);
