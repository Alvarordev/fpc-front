import { createBrowserRouter } from "react-router-dom"
import { AuthGuard, GuestGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LoginPage } from "@/pages/login/page"
import { HomePage } from "@/pages/home/page"
import PatientsPage from "@/pages/pacientes/page"
import ProspectsPage from "@/pages/prospectos/page"
import PatientDetailPage from "@/pages/pacientes/[id]/page"
import FollowUpPage from "@/pages/pacientes/[id]/seguimientos/page"
import VolunteersPage from "@/pages/voluntarios/page"
import AgendaPage from "@/pages/agenda/page"
import DisponibilidadPage from "@/pages/disponibilidad/page"
import UsersPage from "@/pages/usuarios/page"
import HealthCentersPage from "@/pages/hospitales/page"
import AlertsPage from "@/pages/alertas/page"
import AppointmentsPage from "@/pages/citas/page"
import EnrolamientoPage from "@/pages/enrolamiento/page"
import CallcenterPage from "@/pages/callcenter/page"

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
      { index: true, element: <HomePage /> },
      {
        path: "agenda",
        element: (
          <RoleGuard allowedRoles={["VOLUNTEER"]}>
            <AgendaPage />
          </RoleGuard>
        ),
      },
      {
        path: "disponibilidad",
        element: (
          <RoleGuard allowedRoles={["VOLUNTEER"]}>
            <DisponibilidadPage />
          </RoleGuard>
        ),
      },
      { path: "pacientes", element: <PatientsPage /> },
      {
        path: "prospectos",
        element: (
          <RoleGuard allowedRoles={["ADMIN", "AGENT", "FOUNDATION"]}>
            <ProspectsPage />
          </RoleGuard>
        ),
      },
      { path: "pacientes/:id", element: <PatientDetailPage /> },
      {
        path: "pacientes/:id/seguimientos/:followUpId",
        element: <FollowUpPage />,
      },
      {
        path: "voluntarios",
        element: (
          <RoleGuard allowedRoles={["ADMIN", "AGENT", "FOUNDATION"]}>
            <VolunteersPage />
          </RoleGuard>
        ),
      },
      {
        path: "usuarios",
        element: (
          <RoleGuard allowedRoles={["ADMIN"]}>
            <UsersPage />
          </RoleGuard>
        ),
      },
      {
        path: "callcenter",
        element: (
          <RoleGuard allowedRoles={["ADMIN"]}>
            <CallcenterPage />
          </RoleGuard>
        ),
      },
      {
        path: "hospitales",
        element: (
          <RoleGuard allowedRoles={["ADMIN", "AGENT", "FOUNDATION"]}>
            <HealthCentersPage />
          </RoleGuard>
        ),
      },
      {
        path: "alertas",
        element: (
          <RoleGuard allowedRoles={["ADMIN", "AGENT"]}>
            <AlertsPage />
          </RoleGuard>
        ),
      },
      {
        path: "citas",
        element: (
          <RoleGuard allowedRoles={["ADMIN", "AGENT"]}>
            <AppointmentsPage />
          </RoleGuard>
        ),
      },
      {
        path: "enrolamiento",
        element: (
          <RoleGuard allowedRoles={["ADMIN", "AGENT"]}>
            <EnrolamientoPage />
          </RoleGuard>
        ),
      },
    ],
  },
])
