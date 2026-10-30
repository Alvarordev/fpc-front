import { CatalogValue } from "@/components/catalog-select"
import { cn } from "@/lib/utils"
import {
  patientHealthSubcategoryColors,
  patientHealthSubcategoryLabels,
} from "@/lib/patient-health-subcategory"
import type { PatientHealthSubcategory } from "@/api/patients"

const NEUTRAL = { badge: "bg-zinc-100 text-zinc-600", dot: "bg-zinc-400" }

/** Subcategoría de salud con su color (píldora del sistema de diseño). */
export function PatientHealthSubcategoryBadge({
  subcategory,
  className,
}: {
  subcategory: PatientHealthSubcategory | null | undefined
  className?: string
}) {
  const colors =
    (subcategory && patientHealthSubcategoryColors[subcategory]) || NEUTRAL

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        colors.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", colors.dot)} />
      {subcategory ? (
        <CatalogValue kind="patient_health_subcategory" code={subcategory} />
      ) : (
        "Sin subcategoría"
      )}
    </span>
  )
}

export function PatientHealthSubcategoryDot({
  subcategory,
  className,
}: {
  subcategory: PatientHealthSubcategory | null | undefined
  className?: string
}) {
  if (!subcategory) return null

  return (
    <span
      aria-label={patientHealthSubcategoryLabels[subcategory]}
      title={patientHealthSubcategoryLabels[subcategory]}
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        patientHealthSubcategoryColors[subcategory]?.dot ?? NEUTRAL.dot,
        className,
      )}
    />
  )
}
