import { Pill } from "lucide-react"
import { toast } from "sonner"
import type { CreateTreatmentMedicationInput, PatientTreatment, TreatmentMedication } from "@/api/patients"
import { FormModal } from "@/components/ds/form-modal"
import type { Group } from "@/components/ds/questions"
import { toDurationInput, type DurationInput as DurationValue } from "@/types/duration"
import type { MedicationDoseUnit, MedicationRoute } from "@/types"
import { compact, fromBool, fromDuration, fromNumber, text, toDuration } from "../seguimientos/_components/ficha/answers"

const DOSE_UNITS: Array<{ value: MedicationDoseUnit; label: string }> = [
  { value: "MG", label: "mg" }, { value: "G", label: "g" }, { value: "ML", label: "ml" },
  { value: "UI", label: "UI" }, { value: "TABLET", label: "Tableta" }, { value: "DROP", label: "Gota" }, { value: "OTHER", label: "Otro" },
]

const ROUTES: Array<{ value: MedicationRoute; label: string }> = [
  { value: "ORAL", label: "Oral" }, { value: "IV", label: "Intravenosa" }, { value: "IM", label: "Intramuscular" },
  { value: "SUBCUTANEOUS", label: "Subcutánea" }, { value: "TOPICAL", label: "Tópica" }, { value: "OTHER", label: "Otra" },
]

const groups: Group[] = [
  {
    title: "Medicamento",
    questions: [
      { id: "name", label: "Nombre", type: "text", required: true, placeholder: "Ej: Tamoxifeno" },
      { id: "doseDescription", label: "Descripción de la dosis", type: "text", placeholder: "Ej: 2 tabletas" },
      { id: "doseAmount", label: "Cantidad", type: "number" },
      { id: "doseUnit", label: "Unidad", type: "select", options: DOSE_UNITS },
      { id: "route", label: "Vía", type: "select", options: ROUTES },
      { id: "frequency", label: "Frecuencia", type: "duration", units: ["HOUR", "DAY", "WEEK", "MONTH"], hint: "Cada cuánto lo toma." },
    ],
  },
  {
    title: "Vigencia",
    questions: [
      { id: "startDate", label: "Fecha de inicio", type: "date" },
      { id: "endDate", label: "Fecha de fin", type: "date" },
      { id: "isActive", label: "¿Lo sigue tomando?", type: "yesno", required: true },
      { id: "notes", label: "Notas", type: "textarea", placeholder: "Indicaciones adicionales" },
    ],
  },
]

export type TreatmentMedicationInput = Omit<CreateTreatmentMedicationInput, "frequency"> & { frequency?: DurationValue }

interface TreatmentMedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  treatment: PatientTreatment
  medication?: TreatmentMedication | null
  isPending: boolean
  onSubmit: (values: TreatmentMedicationInput) => void
}

export function TreatmentMedicationDialog({ open, onOpenChange, treatment, medication, isPending, onSubmit }: TreatmentMedicationDialogProps) {
  if (!open) return null
  const m = medication
  return (
    <FormModal
      icon={Pill}
      title={m ? "Editar medicamento" : "Nuevo medicamento"}
      description={`${treatment.treatmentType}: dosis, frecuencia y vigencia`}
      groups={groups}
      initial={compact({
        name: m?.name,
        doseDescription: m?.doseDescription,
        doseAmount: fromNumber(m?.doseAmount),
        doseUnit: m?.doseUnit,
        route: m?.route,
        frequency: fromDuration(m?.frequency),
        startDate: m?.startDate,
        endDate: m?.endDate,
        isActive: fromBool(m ? m.isActive : true),
        notes: m?.notes,
      })}
      submitLabel={m ? "Guardar cambios" : "Agregar medicamento"}
      pending={isPending}
      onClose={() => onOpenChange(false)}
      onSubmit={(v) => {
        const frequency = toDurationInput(toDuration(v.frequency))
        if (v.frequency && !frequency) return toast.error("Completa la frecuencia: cantidad y unidad")
        const amount = v.doseAmount ? Number(v.doseAmount) : undefined
        onSubmit({
          name: v.name!.trim(),
          doseDescription: text(v.doseDescription),
          doseAmount: amount !== undefined && Number.isFinite(amount) ? amount : undefined,
          doseUnit: (v.doseUnit as MedicationDoseUnit) ?? undefined,
          route: (v.route as MedicationRoute) ?? undefined,
          frequency,
          startDate: v.startDate ?? undefined,
          endDate: v.endDate ?? undefined,
          isActive: v.isActive === "yes",
          notes: text(v.notes),
        })
      }}
    />
  )
}
