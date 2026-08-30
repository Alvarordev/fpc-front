import { Building2, Stethoscope } from "lucide-react"
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select"
import { useHealthCenters } from "@/pages/hospitales/_hooks/use-health-centers"

export const COMMON_SPECIALTIES = [
  "Oncología Médica",
  "Radioterapia",
  "Mastología / Cirugía Oncológica",
  "Ginecología Oncológica",
  "Ecografía / Diagnóstico por Imágenes",
  "Quimioterapia",
  "Psicooncología",
  "Cuidados Paliativos",
  "Medicina General / Chequeo",
] as const

export interface MedicalAppointmentFieldsValue {
  specialty: string
  customSpecialty: string
  healthCenterId: string
  isFirstConsultation: boolean
}

interface MedicalAppointmentFieldsProps {
  value: MedicalAppointmentFieldsValue
  onChange: (value: MedicalAppointmentFieldsValue) => void
  specialtyReadOnly?: boolean
  disabled?: boolean
}

export function resolveSpecialty(value: MedicalAppointmentFieldsValue): string {
  return value.specialty === "OTRO"
    ? value.customSpecialty.trim()
    : value.specialty.trim()
}

export function MedicalAppointmentFields({
  value,
  onChange,
  specialtyReadOnly = false,
  disabled = false,
}: MedicalAppointmentFieldsProps) {
  const { data: healthCenters = [] } = useHealthCenters()
  const healthCenterOptions: SearchableOption[] = healthCenters.map((hc) => ({
    value: hc.id,
    label: hc.name,
    sublabel: hc.department,
  }))

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
          <Stethoscope className="text-muted-foreground size-3.5" />
          Especialidad médica <span className="text-destructive">*</span>
        </label>
        {specialtyReadOnly ? (
          <div className="bg-muted/30 text-muted-foreground w-full rounded-md border px-3 py-2 text-xs">
            {value.specialty}
          </div>
        ) : (
          <>
            <select
              value={value.specialty}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...value, specialty: event.target.value })
              }
              className="bg-background focus:ring-ring w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
            >
              <option value="">-- Selecciona especialidad --</option>
              {COMMON_SPECIALTIES.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
              <option value="OTRO">Otra especialidad...</option>
            </select>
            {value.specialty === "OTRO" && (
              <input
                type="text"
                disabled={disabled}
                placeholder="Especificá la especialidad médica"
                value={value.customSpecialty}
                onChange={(event) =>
                  onChange({ ...value, customSpecialty: event.target.value })
                }
                className="bg-background focus:ring-ring mt-1.5 w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
              />
            )}
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
          <Building2 className="text-muted-foreground size-3.5" />
          Establecimiento de salud
        </label>
        <SearchableSelect
          options={healthCenterOptions}
          value={value.healthCenterId}
          onChange={(healthCenterId) => onChange({ ...value, healthCenterId })}
          placeholder="Buscar hospital o clínica..."
          searchPlaceholder="Escribe el nombre del hospital..."
          disabled={disabled}
        />
      </div>

      <label className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          disabled={disabled || specialtyReadOnly}
          checked={value.isFirstConsultation}
          onChange={(event) =>
            onChange({
              ...value,
              isFirstConsultation: event.target.checked,
            })
          }
          className="size-4 cursor-pointer rounded border-gray-300"
        />
        <span className="text-foreground text-xs font-medium">
          Primera consulta oncológica
        </span>
      </label>
    </div>
  )
}
