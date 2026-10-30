import { AlertTriangle, Bell, Brain, Calendar, ClipboardList, FileText, HeartPulse, MapPin, Pill, ShieldCheck, Stethoscope, type LucideIcon } from "lucide-react"
import type { PatientTimelineOutcome } from "@/api/patient-timeline"
import type { PatientDiagnosis, PatientTreatment } from "@/api/patients"
import { Item } from "@/components/ds/card"
import { ToneIcon } from "@/components/ds/icon"
import type { Tone } from "@/components/ds/tone"
import { catalogLabel, useCatalog } from "@/hooks/use-catalog"

// Lo que se registró al completar un seguimiento. Diagnósticos y tratamientos
// abren su detalle.

const OUTCOMES: Record<PatientTimelineOutcome["type"], { icon: LucideIcon; tone: Tone }> = {
  DIAGNOSIS: { icon: Stethoscope, tone: "violet" },
  TREATMENT: { icon: ClipboardList, tone: "blue" },
  MEDICATION: { icon: Pill, tone: "blue" },
  SYMPTOM: { icon: HeartPulse, tone: "amber" },
  INSURANCE: { icon: ShieldCheck, tone: "gray" },
  SIS_AFFILIATION: { icon: ShieldCheck, tone: "gray" },
  ADDRESS: { icon: MapPin, tone: "gray" },
  SOCIAL_NOTE: { icon: FileText, tone: "gray" },
  REMINDER: { icon: Bell, tone: "amber" },
  PSYCHOONCOLOGY_APPOINTMENT: { icon: Brain, tone: "violet" },
  MEDICAL_APPOINTMENT: { icon: Calendar, tone: "blue" },
  NON_ONCOLOGICAL_FOLLOW_UP: { icon: HeartPulse, tone: "green" },
  DIAGNOSTIC_STATUS: { icon: Stethoscope, tone: "violet" },
  ALERT: { icon: AlertTriangle, tone: "red" },
}

export function FollowUpOutcomes({
  outcomes,
  diagnoses,
  treatments,
  onViewDiagnosis,
  onViewTreatment,
}: {
  outcomes: PatientTimelineOutcome[]
  diagnoses?: PatientDiagnosis[]
  treatments?: PatientTreatment[]
  onViewDiagnosis?: (diagnosis: PatientDiagnosis) => void
  onViewTreatment?: (treatment: PatientTreatment) => void
}) {
  const { data: cancers = [] } = useCatalog("cancer_diagnosis")
  return (
    <div className="space-y-2">
      {outcomes.map((o) => {
        const diagnosis = o.type === "DIAGNOSIS" ? diagnoses?.find((d) => d.id === o.recordId) : undefined
        const treatment = o.type === "TREATMENT" ? treatments?.find((t) => t.id === o.recordId) : undefined
        const onOpen = diagnosis && onViewDiagnosis ? () => onViewDiagnosis(diagnosis) : treatment && onViewTreatment ? () => onViewTreatment(treatment) : undefined
        const { icon, tone } = OUTCOMES[o.type]
        return (
          <Item
            key={`${o.type}-${o.recordId}`}
            leading={<ToneIcon icon={icon} tone={tone} />}
            title={o.label}
            meta={o.type === "DIAGNOSIS" ? catalogLabel(cancers, diagnosis?.diagnosis ?? o.summary) : o.summary}
            onOpen={onOpen}
            openLabel={`Ver detalle de ${o.label.toLowerCase()}`}
          />
        )
      })}
    </div>
  )
}
