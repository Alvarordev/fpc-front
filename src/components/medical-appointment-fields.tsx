import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreateHealthCenterDialog } from "@/pages/hospitales/_components/create-health-center-dialog"
import { Building2, Plus, Stethoscope } from "lucide-react"
import {
  SearchableSelect,
  type SearchableOption,
} from "@/components/ui/searchable-select"
import type { CatalogItem } from "@/api/catalogs"
import { CatalogSelect, CatalogValue } from "@/components/catalog-select"
import { catalogLabel } from "@/hooks/use-catalog"
import { useHealthCenters } from "@/pages/hospitales/_hooks/use-health-centers"

export interface MedicalAppointmentFieldsValue {
  specialty: string
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
  return value.specialty.trim()
}

export function resolveSpecialtyLabel(
  items: CatalogItem[],
  value: MedicalAppointmentFieldsValue,
): string {
  const code = value.specialty.trim()
  if (!code) return ""
  return catalogLabel(items, code)
}

export function MedicalAppointmentFields({
  value,
  onChange,
  specialtyReadOnly = false,
  disabled = false,
}: MedicalAppointmentFieldsProps) {
  const [createHealthCenterOpen, setCreateHealthCenterOpen] = useState(false)
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
            <CatalogValue kind="medical_specialty" code={value.specialty} />
          </div>
        ) : (
          <CatalogSelect
            kind="medical_specialty"
            value={value.specialty || null}
            disabled={disabled}
            placeholder="Seleccionar especialidad..."
            onValueChange={(code) =>
              onChange({ ...value, specialty: code ?? "" })
            }
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
          <Building2 className="text-muted-foreground size-3.5" />
          Establecimiento de salud
        </label>
        <div className="flex items-start gap-2">
          <SearchableSelect
            className="min-w-0 flex-1"
            options={healthCenterOptions}
            value={value.healthCenterId}
            onChange={(healthCenterId) =>
              onChange({ ...value, healthCenterId })
            }
            placeholder="Buscar hospital o clínica..."
            searchPlaceholder="Escribe el nombre del hospital..."
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={disabled}
            aria-label="Agregar establecimiento de salud"
            title="Agregar establecimiento de salud"
            onClick={() => setCreateHealthCenterOpen(true)}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      <CreateHealthCenterDialog
        open={createHealthCenterOpen}
        onOpenChange={setCreateHealthCenterOpen}
        onCreated={(center) =>
          onChange({ ...value, healthCenterId: center.id })
        }
      />

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
