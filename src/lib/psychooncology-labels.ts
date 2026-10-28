import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"

export const psychooncologyStatusLabels: Record<
  PsychooncologyAppointment["status"],
  string
> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  NO_SHOW: "No se presentó",
  CANCELLED: "Cancelada",
  RESCHEDULED: "Reprogramada",
  OVERDUE: "Vencida",
}

export const psychooncologyStatusClasses: Record<
  PsychooncologyAppointment["status"],
  string
> = {
  SCHEDULED:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  COMPLETED:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  NO_SHOW:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  CANCELLED:
    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  RESCHEDULED:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  OVERDUE:
    "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
}
