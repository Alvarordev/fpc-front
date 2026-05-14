import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Clock,
  UserCheck,
  TriangleAlert,
  Building2,
  ShieldUser,
} from "lucide-react";
import type { NavGroup } from "@/types/navigation";
import type { UserRole } from "@/types";

export const navConfig: Record<UserRole, NavGroup[]> = {
  AGENT: [
    {
      label: "Gestión",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
        { title: "Pacientes", url: "/pacientes", icon: Users },
        { title: "Voluntarios", url: "/voluntarios", icon: UserCheck },
      ],
    },
    {
      label: "Seguimiento",
      items: [
        { title: "Alertas", url: "/alertas", icon: TriangleAlert },
        { title: "Hospitales", url: "/hospitales", icon: Building2 },
      ],
    },
  ],
  VOLUNTEER: [
    {
      label: "Gestión",
      items: [
        { title: "Mi Agenda", url: "/agenda", icon: CalendarDays },
        { title: "Mis Pacientes", url: "/pacientes", icon: Users },
        { title: "Disponibilidad", url: "/disponibilidad", icon: Clock },
      ],
    },
  ],
  ADMIN: [
    {
      label: "Gestión",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
        { title: "Pacientes", url: "/pacientes", icon: Users },
        { title: "Voluntarios", url: "/voluntarios", icon: UserCheck },
        { title: "Usuarios", url: "/usuarios", icon: ShieldUser },
      ],
    },
    {
      label: "Operaciones",
      items: [
        { title: "Alertas", url: "/alertas", icon: TriangleAlert },
        { title: "Hospitales", url: "/hospitales", icon: Building2 },
      ],
    },
  ],
};

export const pathTitles: Record<string, string> = {
  "/": "Dashboard",
  "/pacientes": "Pacientes",
  "/inscripcion": "Inscripción",
  "/agenda": "Mi Agenda",
  "/disponibilidad": "Disponibilidad",
  "/voluntarios": "Voluntarios",
  "/alertas": "Alertas",
  "/hospitales": "Hospitales",
  "/usuarios": "Usuarios",
};
