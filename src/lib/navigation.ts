import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Clock,
  UserCheck,
  TriangleAlert,
  Building2,
  Headset,
  ShieldUser,
  Calendar,
  UserRound,
} from "lucide-react"
import type { NavGroup } from "@/types/navigation"
import type { UserRole } from "@/types"

export const navConfig: Record<UserRole, NavGroup[]> = {
  AGENT: [
    {
      label: "Gestión",
      items: [
        { title: "Mi agenda", url: "/", icon: LayoutDashboard },
        { title: "Pacientes", url: "/pacientes", icon: Users },
        { title: "Prospectos", url: "/prospectos", icon: UserRound },
        { title: "Voluntarios", url: "/voluntarios", icon: UserCheck },
      ],
    },
    {
      label: "Seguimiento",
      items: [
        { title: "Alertas", url: "/alertas", icon: TriangleAlert },
        { title: "Citas Médicas", url: "/citas", icon: Calendar },
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
        { title: "Equipo SEPA", url: "/equipo-sepa", icon: Building2 },
      ],
    },
  ],
  ADMIN: [
    {
      label: "Gestión",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
        { title: "Pacientes", url: "/pacientes", icon: Users },
        { title: "Prospectos", url: "/prospectos", icon: UserRound },
        { title: "Voluntarios", url: "/voluntarios", icon: UserCheck },
        { title: "Usuarios", url: "/usuarios", icon: ShieldUser },
      ],
    },
    {
      label: "Operaciones",
      items: [
        { title: "Call center", url: "/callcenter", icon: Headset },
        { title: "Alertas", url: "/alertas", icon: TriangleAlert },
        { title: "Citas Médicas", url: "/citas", icon: Calendar },
        { title: "Hospitales", url: "/hospitales", icon: Building2 },
      ],
    },
  ],
  FOUNDATION: [
    {
      label: "Gestión",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
        { title: "Pacientes", url: "/pacientes", icon: Users },
        { title: "Prospectos", url: "/prospectos", icon: UserRound },
        { title: "Voluntarios", url: "/voluntarios", icon: UserCheck },
      ],
    },
  ],
}

export const pathTitles: Record<string, string> = {
  "/": "Dashboard",
  "/pacientes": "Pacientes",
  "/prospectos": "Prospectos",
  "/inscripcion": "Inscripción",
  "/enrolamiento": "Enrolamiento",
  "/agenda": "Mi Agenda",
  "/disponibilidad": "Disponibilidad",
  "/equipo-sepa": "Equipo SEPA",
  "/voluntarios": "Voluntarios",
  "/alertas": "Alertas",
  "/citas": "Citas Médicas",
  "/hospitales": "Hospitales",
  "/usuarios": "Usuarios",
  "/callcenter": "Call center",
}
