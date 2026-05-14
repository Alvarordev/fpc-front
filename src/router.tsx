import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
import { AuthGuard, GuestGuard } from "@/components/auth-guard";
import { LoginPage } from "@/pages/login/page";
import { DashboardPage } from "@/pages/dashboard/page";

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
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
    ],
  },
]);
