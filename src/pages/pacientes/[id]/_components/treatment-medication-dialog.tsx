import { useEffect } from "react"
import { useForm } from "react-hook-form"
import type { CreateTreatmentMedicationInput, PatientTreatment, TreatmentMedication } from "@/api/patients"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DurationInput } from "@/components/duration-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { toDurationInput, type DurationDraft, type DurationInput as DurationValue } from "@/types/duration"
import type { MedicationDoseUnit, MedicationRoute } from "@/types"

const DOSE_UNITS: Array<{ value: MedicationDoseUnit; label: string }> = [
  { value: "MG", label: "mg" }, { value: "G", label: "g" }, { value: "ML", label: "ml" },
  { value: "UI", label: "UI" }, { value: "TABLET", label: "Tableta" }, { value: "DROP", label: "Gota" }, { value: "OTHER", label: "Otro" },
]

const ROUTES: Array<{ value: MedicationRoute; label: string }> = [
  { value: "ORAL", label: "Oral" }, { value: "IV", label: "Intravenosa" }, { value: "IM", label: "Intramuscular" },
  { value: "SUBCUTANEOUS", label: "Subcutánea" }, { value: "TOPICAL", label: "Tópica" }, { value: "OTHER", label: "Otra" },
]

type MedicationFormValues = Omit<CreateTreatmentMedicationInput, "frequency"> & { frequency?: DurationDraft }
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
  const { register, handleSubmit, watch, setValue, reset } = useForm<MedicationFormValues>({
    defaultValues: { name: "", isActive: true, doseAmount: undefined, doseDescription: "", notes: "" },
  })

  useEffect(() => {
    if (!open) return
    reset(medication ? {
      name: medication.name,
      doseAmount: medication.doseAmount ?? undefined,
      doseUnit: medication.doseUnit ?? undefined,
      doseDescription: medication.doseDescription ?? "",
      route: medication.route ?? undefined,
      frequency: medication.frequency ? {
        valueMin: medication.frequency.valueMin,
        ...(medication.frequency.valueMax !== null ? { valueMax: medication.frequency.valueMax } : {}),
        unit: medication.frequency.unit,
      } : undefined,
      startDate: medication.startDate ?? undefined,
      endDate: medication.endDate ?? undefined,
      isActive: medication.isActive,
      notes: medication.notes ?? "",
    } : { name: "", isActive: true, doseAmount: undefined, doseDescription: "", notes: "" })
  }, [medication, open, reset])

  const isEditing = Boolean(medication)
  const doseUnit = watch("doseUnit")
  const route = watch("route")
  const frequency = watch("frequency")
  const isActive = watch("isActive")

  function submit(values: MedicationFormValues) {
    if (!values.name?.trim()) {
      toast.error("Indica el nombre del medicamento")
      return
    }
    const normalizedFrequency = toDurationInput(values.frequency)
    if (values.frequency && !normalizedFrequency) {
      toast.error("Completa correctamente la frecuencia del medicamento")
      return
    }
    onSubmit({
      ...values,
      name: values.name.trim(),
      doseAmount: values.doseAmount !== undefined && Number.isFinite(values.doseAmount) ? values.doseAmount : undefined,
      doseDescription: values.doseDescription?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      frequency: normalizedFrequency,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{isEditing ? "Editar medicamento" : "Nuevo medicamento"}</DialogTitle><DialogDescription>{treatment.treatmentType}. Registra la dosis, frecuencia y vigencia.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Nombre <span className="text-destructive">*</span></Label><Input {...register("name")} placeholder="Ej: Tamoxifeno" /></div>
            <div className="space-y-2"><Label>Descripción de dosis</Label><Input {...register("doseDescription")} placeholder="Ej: 2 tabletas" /></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Cantidad</Label><Input type="number" min={0} step="any" {...register("doseAmount", { valueAsNumber: true })} /></div><div className="space-y-2"><Label>Unidad</Label><Select items={DOSE_UNITS} value={doseUnit ?? ""} onValueChange={(value) => setValue("doseUnit", value as MedicationDoseUnit)}><SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger><SelectContent>{DOSE_UNITS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="space-y-2"><Label>Vía</Label><Select items={ROUTES} value={route ?? ""} onValueChange={(value) => setValue("route", value as MedicationRoute)}><SelectTrigger><SelectValue placeholder="Seleccionar vía" /></SelectTrigger><SelectContent>{ROUTES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DurationInput label="Frecuencia" units={["HOUR", "DAY", "WEEK", "MONTH"]} value={frequency} onChange={(value) => setValue("frequency", value)} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Fecha de inicio</Label><Input type="date" {...register("startDate")} /></div><div className="space-y-2"><Label>Fecha de fin</Label><Input type="date" {...register("endDate")} /></div></div>
          <div className="space-y-2"><Label>Notas</Label><Input {...register("notes")} placeholder="Indicaciones adicionales" /></div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={isActive} onCheckedChange={(value) => setValue("isActive", !!value)} />Medicamento activo</label>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancelar</Button><Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear medicamento"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
