import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PatientHealthSubcategoryBadge } from "./patient-health-subcategory-badge"
import {
  patientHealthPhaseLabels,
  patientHealthSubcategoriesByPhase,
  patientHealthSubcategoryOptions,
  type PatientHealthSubcategoryOption,
} from "@/lib/patient-health-subcategory"
import type { PatientHealthPhase } from "@/api/patients"

const PHASE_ORDER: PatientHealthPhase[] = [
  "SIGNS_AND_SYMPTOMS",
  "CANCER_DIAGNOSIS",
  "ANNUAL_CHECKUP",
]

interface PatientHealthSubcategoryProtocolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PatientHealthSubcategoryProtocolDialog({
  open,
  onOpenChange,
}: PatientHealthSubcategoryProtocolDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Subcategorías por fase de salud</DialogTitle>
          <DialogDescription>
            Protocolo de acompañamiento y frecuencia sugerida para cada
            subcategoría. La frecuencia puede ajustarse según la situación
            particular del paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {PHASE_ORDER.map((phase) => {
            const options = patientHealthSubcategoriesByPhase[phase]
              .map((value) =>
                patientHealthSubcategoryOptions.find(
                  (option) => option.value === value,
                ),
              )
              .filter(
                (option): option is PatientHealthSubcategoryOption =>
                  option !== undefined,
              )

            return (
              <section key={phase} className="space-y-3">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-semibold">
                    {patientHealthPhaseLabels[phase]}
                  </h3>
                </div>
                <div className="space-y-3">
                  {options.map((option) => (
                    <ProtocolSubcategory key={option.value} option={option} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProtocolSubcategory({
  option,
}: {
  option: PatientHealthSubcategoryOption
}) {
  return (
    <article className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PatientHealthSubcategoryBadge subcategory={option.value} />
        <Badge variant="outline" className="font-normal">
          {option.frequency}
        </Badge>
      </div>
      <ProtocolList title="Protocolo estándar" items={option.standard} />
      {option.personalized.length > 0 && (
        <ProtocolList title="Personalizado" items={option.personalized} />
      )}
    </article>
  )
}

function ProtocolList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        {title}
      </h4>
      <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs leading-relaxed">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
