import { useState } from "react"
import { CatalogSelect } from "@/components/catalog-select"
import { DurationInput } from "@/components/duration-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { EnrollmentAddressRequest } from "@/types"
import {
  CATALOG_OTHER_CODE,
  LODGING_COST_PERIOD_OPTIONS,
  type LodgingCostPeriod,
} from "@/pages/enrolamiento/_utils/address-housing"

type AddressChange = (partial: Partial<EnrollmentAddressRequest>) => void

interface QuestionStyles {
  labelClassName?: string
  /** Applied to select triggers and inputs. */
  fieldClassName?: string
}

/** "¿Nos podría compartir la ubicación web de su vivienda?" with its "Otro". */
export function LocationShareQuestion({
  address,
  onChange,
  labelClassName,
  fieldClassName,
}: QuestionStyles & {
  address: Pick<
    EnrollmentAddressRequest,
    "locationShareStatus" | "locationShareStatusOther"
  >
  onChange: AddressChange
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className={labelClassName}>
        ¿Nos podría compartir la ubicación web de su vivienda?
      </Label>
      <CatalogSelect
        kind="location_share_status"
        allowCreate={false}
        value={address.locationShareStatus ?? null}
        onValueChange={(code) =>
          onChange({
            locationShareStatus: code ?? undefined,
            ...(code !== CATALOG_OTHER_CODE
              ? { locationShareStatusOther: undefined }
              : {}),
          })
        }
        placeholder="Seleccionar..."
        triggerClassName={fieldClassName}
      />
      {address.locationShareStatus === CATALOG_OTHER_CODE && (
        <Input
          placeholder="Especifique"
          className={fieldClassName}
          value={address.locationShareStatusOther ?? ""}
          onChange={(event) =>
            onChange({
              locationShareStatusOther: event.target.value || undefined,
            })
          }
        />
      )}
    </div>
  )
}

/** "Esta vivienda provisional es" with its "Otro". */
export function HousingTypeQuestion({
  address,
  onChange,
  labelClassName,
  fieldClassName,
}: QuestionStyles & {
  address: Pick<EnrollmentAddressRequest, "housingType" | "housingTypeOther">
  onChange: AddressChange
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className={labelClassName}>Esta vivienda provisional es</Label>
      <CatalogSelect
        kind="temporary_housing_type"
        allowCreate={false}
        value={address.housingType ?? null}
        onValueChange={(code) =>
          onChange({
            housingType: code ?? undefined,
            ...(code !== CATALOG_OTHER_CODE
              ? { housingTypeOther: undefined }
              : {}),
          })
        }
        placeholder="Seleccionar..."
        triggerClassName={fieldClassName}
      />
      {address.housingType === CATALOG_OTHER_CODE && (
        <Input
          placeholder="Especifique dónde se queda"
          className={fieldClassName}
          value={address.housingTypeOther ?? ""}
          onChange={(event) =>
            onChange({ housingTypeOther: event.target.value || undefined })
          }
        />
      )}
    </div>
  )
}

export function ShelterNameField({
  address,
  onChange,
  labelClassName,
  fieldClassName,
}: QuestionStyles & {
  address: Pick<EnrollmentAddressRequest, "shelterName">
  onChange: AddressChange
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className={labelClassName}>Nombre del albergue</Label>
      <Input
        placeholder="Ej: Albergue Frieda Heller"
        className={fieldClassName}
        value={address.shelterName ?? ""}
        onChange={(event) =>
          onChange({ shelterName: event.target.value || undefined })
        }
      />
    </div>
  )
}

/** Travel time to the hospital and average spend of a rented lodging. */
export function LodgingFields({
  address,
  onChange,
  labelClassName,
  fieldClassName,
}: QuestionStyles & {
  address: Pick<
    EnrollmentAddressRequest,
    "travelTimeToHospital" | "averageLodgingCost" | "averageLodgingCostPeriod"
  >
  onChange: AddressChange
}) {
  const [costText, setCostText] = useState(
    address.averageLodgingCost === undefined
      ? ""
      : String(address.averageLodgingCost),
  )
  const missingPeriod =
    address.averageLodgingCost !== undefined &&
    !address.averageLodgingCostPeriod

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <DurationInput
        label="Tiempo de llegada al hospital"
        labelClassName={labelClassName}
        units={["MINUTE", "HOUR"]}
        defaultUnit="MINUTE"
        singleValue
        value={address.travelTimeToHospital}
        onChange={(travelTimeToHospital) => onChange({ travelTimeToHospital })}
      />
      {/* Same label markup as DurationInput so both columns line up. */}
      <div className="space-y-2">
        <p className={cn("text-sm font-medium", labelClassName)}>
          Gasto promedio al alquilar
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,auto)] gap-2">
          <div className="relative">
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
              S/
            </span>
            <Input
              inputMode="decimal"
              placeholder="0.00"
              aria-label="Gasto promedio en soles"
              className={cn("pl-8 tabular-nums", fieldClassName)}
              value={costText}
              onChange={(event) => {
                const text = event.target.value
                const amount = Number(text.replace(",", "."))
                setCostText(text)
                onChange({
                  averageLodgingCost:
                    text.trim() && Number.isFinite(amount) && amount >= 0
                      ? amount
                      : undefined,
                })
              }}
            />
          </div>
          <Select
            items={LODGING_COST_PERIOD_OPTIONS}
            value={address.averageLodgingCostPeriod ?? ""}
            onValueChange={(value) =>
              onChange({
                averageLodgingCostPeriod:
                  (value as LodgingCostPeriod) || undefined,
              })
            }
          >
            <SelectTrigger
              aria-label="Período del gasto"
              aria-invalid={missingPeriod}
              className={fieldClassName}
            >
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {LODGING_COST_PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {missingPeriod && (
          <p className="text-muted-foreground text-xs">
            Indique si el gasto es por noche o por mes.
          </p>
        )}
      </div>
    </div>
  )
}
