import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  patientHealthSubcategoryColors,
  patientHealthSubcategoryLabels,
} from "@/lib/patient-health-subcategory"
import type { PatientHealthSubcategory } from "@/api/patients"

interface PatientHealthSubcategoryBadgeProps {
  subcategory: PatientHealthSubcategory | null | undefined
  className?: string
}

export function PatientHealthSubcategoryBadge({
  subcategory,
  className,
}: PatientHealthSubcategoryBadgeProps) {
  const colors = subcategory
    ? patientHealthSubcategoryColors[subcategory]
    : {
        badge: "border-border bg-muted/50 text-muted-foreground",
        dot: "bg-muted-foreground",
      }

  return (
    <Badge className={cn("border font-medium", colors.badge, className)}>
      <span className={cn("size-2 rounded-full", colors.dot)} />
      {subcategory
        ? patientHealthSubcategoryLabels[subcategory]
        : "Sin subcategoría"}
    </Badge>
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
        patientHealthSubcategoryColors[subcategory].dot,
        className,
      )}
    />
  )
}
