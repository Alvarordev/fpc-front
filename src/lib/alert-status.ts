import type { Alert } from "@/api/alerts"

export const alertStatusLabels: Record<Alert["status"], string> = {
  REPORTED: "Reportada",
  IN_REVIEW: "En revisión",
  RESOLVED: "Resuelta",
}

export const alertStatusClasses: Record<Alert["status"], string> = {
  REPORTED: "bg-red-50 text-red-700 border-red-200",
  IN_REVIEW: "bg-amber-50 text-amber-800 border-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
}
