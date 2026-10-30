import type { components } from "@/api/schema"
import type { EnrollmentAddressRequest } from "@/types"
import { toDurationInput } from "@/types/duration"

export type LodgingCostPeriod = NonNullable<
  components["schemas"]["CreatePatientAddressDto"]["averageLodgingCostPeriod"]
>

export const LODGING_COST_PERIOD_OPTIONS: Array<{
  value: LodgingCostPeriod
  label: string
}> = [
  { value: "NIGHT", label: "Por noche" },
  { value: "MONTH", label: "Por mes" },
]

/** "S/ 45.00 por noche". */
export function formatLodgingCost(
  amount: number,
  period: LodgingCostPeriod | null | undefined,
): string {
  const suffix =
    period === "MONTH" ? " por mes" : period === "NIGHT" ? " por noche" : ""
  return `S/ ${amount.toFixed(2)}${suffix}`
}

/** A lodging cost is only comparable once its period is known. */
export function lodgingCostError(
  address: Pick<
    EnrollmentAddressRequest,
    "housingType" | "averageLodgingCost" | "averageLodgingCostPeriod"
  >,
): string | null {
  return address.housingType === HOUSING_LODGING_CODE &&
    address.averageLodgingCost !== undefined &&
    !address.averageLodgingCostPeriod
    ? "Indique si el gasto promedio del alojamiento es por noche o por mes"
    : null
}

/** Catalog code for the free-text "Otro" option. */
export const CATALOG_OTHER_CODE = "OTRO"

/** `location_share_status` answer that enables the web location field. */
export const LOCATION_SHARED_CODE = "SHARES"

/** `temporary_housing_type` answers. */
export const HOUSING_SHELTER_CODE = "SHELTER"
export const HOUSING_LODGING_CODE = "LODGING"

/** Provisional housings whose street address is asked (own, relative, shelter). */
export function housingAsksAddress(housingType: string | undefined) {
  return (
    !housingType ||
    housingType === "OWN" ||
    housingType === "RELATIVE" ||
    housingType === HOUSING_SHELTER_CODE
  )
}

/**
 * The web location is asked only once the patient agrees to share it; older
 * drafts without an answer keep showing the link they already have.
 */
export function asksLocationUrl(
  address: Pick<
    EnrollmentAddressRequest,
    "locationShareStatus" | "locationUrl"
  >,
) {
  return address.locationShareStatus
    ? address.locationShareStatus === LOCATION_SHARED_CODE
    : Boolean(address.locationUrl)
}

/**
 * Location and housing answers to send for an address, dropping the ones
 * that don't apply to the chosen housing type. `asksAddress` tells whether
 * the street address fields apply at all.
 */
export function housingPayloadFields(address: EnrollmentAddressRequest) {
  const text = (value: string | undefined) => value?.trim() || undefined
  const isTemporary = address.type === "TEMPORARY"
  const housingType = isTemporary ? text(address.housingType) : undefined
  const asksAddress = !isTemporary || housingAsksAddress(housingType)
  const isLodging = housingType === HOUSING_LODGING_CODE
  const costError = lodgingCostError({ ...address, housingType })
  if (costError) throw new Error(costError)
  const travelTimeToHospital = isLodging
    ? toDurationInput(address.travelTimeToHospital)
    : undefined
  if (
    isLodging &&
    address.travelTimeToHospital?.valueMin !== undefined &&
    !travelTimeToHospital
  )
    throw new Error("Completa correctamente el tiempo de llegada al hospital")

  return {
    asksAddress,
    fields: {
      locationShareStatus: asksAddress
        ? text(address.locationShareStatus)
        : undefined,
      locationShareStatusOther:
        asksAddress && address.locationShareStatus === CATALOG_OTHER_CODE
          ? text(address.locationShareStatusOther)
          : undefined,
      locationUrl:
        asksAddress && asksLocationUrl(address)
          ? text(address.locationUrl)
          : undefined,
      housingType,
      housingTypeOther:
        housingType === CATALOG_OTHER_CODE
          ? text(address.housingTypeOther)
          : undefined,
      shelterName:
        housingType === HOUSING_SHELTER_CODE
          ? text(address.shelterName)
          : undefined,
      travelTimeToHospital,
      ...(isLodging && address.averageLodgingCost !== undefined
        ? {
            averageLodgingCost: address.averageLodgingCost,
            averageLodgingCostPeriod: address.averageLodgingCostPeriod,
          }
        : {}),
    },
  }
}
