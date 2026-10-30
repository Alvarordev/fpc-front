import { ListChecks } from "lucide-react"
import { Modal } from "@/components/ds/modal"
import { Panel } from "@/components/ds/card"
import { MetaTag } from "@/components/ds/badge"
import { PatientHealthSubcategoryBadge } from "./patient-health-subcategory-badge"
import {
  patientHealthPhaseLabels,
  patientHealthSubcategoriesByPhase,
  patientHealthSubcategoryOptions,
  type PatientHealthSubcategoryOption,
} from "@/lib/patient-health-subcategory"
import type { PatientHealthPhase } from "@/api/patients"

const PHASE_ORDER: PatientHealthPhase[] = ["SIGNS_AND_SYMPTOMS", "CANCER_DIAGNOSIS", "ANNUAL_CHECKUP"]

export function PatientHealthSubcategoryProtocolDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      icon={ListChecks}
      title="Subcategorías por fase de salud"
      description="Protocolo de acompañamiento y frecuencia sugerida. La frecuencia puede ajustarse a la situación de cada paciente."
    >
      {PHASE_ORDER.map((phase) => {
        const options = patientHealthSubcategoriesByPhase[phase]
          .map((value) => patientHealthSubcategoryOptions.find((option) => option.value === value))
          .filter((option): option is PatientHealthSubcategoryOption => option !== undefined)

        return (
          <Panel key={phase} title={patientHealthPhaseLabels[phase]}>
            <div className="space-y-2.5">
              {options.map((option) => (
                <ProtocolSubcategory key={option.value} option={option} />
              ))}
            </div>
          </Panel>
        )
      })}
    </Modal>
  )
}

function ProtocolSubcategory({ option }: { option: PatientHealthSubcategoryOption }) {
  return (
    <article className="space-y-3 rounded-[14px] bg-zinc-50 p-3 ring-1 ring-zinc-200/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PatientHealthSubcategoryBadge subcategory={option.value} />
        <MetaTag>{option.frequency}</MetaTag>
      </div>
      <ProtocolList title="Protocolo estándar" items={option.standard} />
      {option.personalized.length > 0 && <ProtocolList title="Personalizado" items={option.personalized} />}
    </article>
  )
}

function ProtocolList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-1">
      <h4 className="text-[13px] font-medium text-zinc-700">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-zinc-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
