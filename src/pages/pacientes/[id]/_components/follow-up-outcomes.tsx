import type { ComponentType } from "react"
import {
  AlertTriangle,
  Bell,
  Brain,
  ClipboardList,
  FileText,
  HeartPulse,
  MapPin,
  Pill,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"
import type { PatientTimelineOutcome } from "@/api/patient-timeline"
import { cn } from "@/lib/utils"

const outcomeIcons: Record<
  PatientTimelineOutcome["type"],
  ComponentType<{ className?: string }>
> = {
  DIAGNOSIS: Stethoscope,
  TREATMENT: ClipboardList,
  MEDICATION: Pill,
  SYMPTOM: HeartPulse,
  INSURANCE: ShieldCheck,
  SIS_AFFILIATION: ShieldCheck,
  ADDRESS: MapPin,
  SOCIAL_NOTE: FileText,
  REMINDER: Bell,
  PSYCHOONCOLOGY_APPOINTMENT: Brain,
  ALERT: AlertTriangle,
}

interface FollowUpOutcomesProps {
  outcomes: PatientTimelineOutcome[]
  limit?: number
  className?: string
}

export function FollowUpOutcomes({
  outcomes,
  limit,
  className,
}: FollowUpOutcomesProps) {
  if (outcomes.length === 0) return null

  const visibleOutcomes = limit ? outcomes.slice(0, limit) : outcomes
  const hiddenCount = outcomes.length - visibleOutcomes.length

  return (
    <div className={cn("border-border/70 mt-4 border-t pt-3", className)}>
      <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <ClipboardList className="size-3.5" />
        Se registró en este seguimiento
      </div>
      <div className="space-y-2">
        {visibleOutcomes.map((outcome) => {
          const Icon = outcomeIcons[outcome.type]

          return (
            <div
              key={`${outcome.type}-${outcome.recordId}`}
              className="bg-muted/40 flex items-start gap-2.5 rounded-lg px-3 py-2"
            >
              <span className="bg-background text-muted-foreground ring-border/70 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ring-1">
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-foreground text-xs font-semibold">
                  {outcome.label}
                </p>
                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
                  {outcome.summary}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      {hiddenCount > 0 && (
        <p className="text-muted-foreground mt-2 text-xs">
          +{hiddenCount} {hiddenCount === 1 ? "resultado" : "resultados"} en el
          detalle del seguimiento
        </p>
      )}
    </div>
  )
}
