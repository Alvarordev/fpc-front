import { compact, fromDuration, text, toDuration } from "@/pages/pacientes/[id]/seguimientos/_components/ficha/answers"
import type { Values } from "@/components/ds/questions"
import type {
  CompanionDraft,
  EnrollmentDraft,
} from "../../../_store/enrollment-store"
import type {
  EducationLevel,
  EnrollmentAddressRequest,
  EpsProvider,
  InsuranceType,
  PeruDepartment,
} from "@/types"
import { CATALOG_OTHER_CODE } from "../../../_utils/address-housing"
import { choosePrimary, NEW_PERSON, primaryValue } from "../../../_utils/contacts"

function yn(value: boolean | null | undefined) {
  return value === true ? "yes" : value === false ? "no" : null
}

function permanent(draft: EnrollmentDraft): EnrollmentAddressRequest {
  return { ...(draft.addresses[0] ?? {}), type: "PERMANENT", isPrimary: true }
}

function temporary(draft: EnrollmentDraft): EnrollmentAddressRequest {
  return { ...(draft.addresses[1] ?? {}), type: "TEMPORARY", isPrimary: false }
}

export function pacienteValues(draft: EnrollmentDraft, extra: { historical: boolean; minor: boolean; callerReady: boolean }): Values {
  const pd = draft.patientData
  const details = draft.details
  const address = draft.addresses[0]
  const temp = draft.addresses[1]
  const insurance = draft.insurance
  const meta = draft.enrollmentMetadata
  const born = details.bornInPeru === true ? "yes" : details.bornInPeru === false ? "no" : details.birthCountry ? "no" : details.birthDepartment ? "yes" : null
  return compact({
    fullName: pd.fullName,
    birthDate: pd.birthDate,
    gender: pd.gender,
    primaryPhone: pd.primaryPhone,
    secondaryPhone: pd.secondaryPhone,
    email: pd.email,
    whatsapp: pd.hasWhatsapp === true ? "yes" : pd.hasWhatsapp === false ? "no" : null,
    bornInPeru: born,
    birthDepartment: details.birthDepartment,
    birthCountry: details.birthCountry,
    zoneType: details.zoneType,
    address: address?.address,
    district: address?.district,
    province: address?.province,
    department: address?.department,
    locationShare: address?.locationShareStatus,
    locationUrl: address?.locationUrl,
    travel: fromDuration(details.travelTimeToHospital),
    dniMatch: yn(address?.dniMatchesAddress),
    hasTemp: draft.addresses.length > 1 ? "yes" : "no",
    tempHousing: temp?.housingType,
    tempHousingOther: temp?.housingTypeOther,
    tempShelter: temp?.shelterName,
    tempAddress: temp?.address,
    tempDistrict: temp?.district,
    tempProvince: temp?.province,
    tempDepartment: temp?.department,
    tempLocationShare: temp?.locationShareStatus,
    tempLocationUrl: temp?.locationUrl,
    tempTravel: fromDuration(temp?.travelTimeToHospital),
    tempCost: temp?.averageLodgingCost === undefined ? null : String(temp.averageLodgingCost),
    tempCostPeriod: temp?.averageLodgingCostPeriod,
    education: details.educationLevel,
    language: details.nativeLanguage,
    translation: details.requiresTranslation === true ? "yes" : details.requiresTranslation === false ? "no" : null,
    working: yn(details.isWorking),
    hasInsurance: insurance.insuranceType !== "NONE" ? "yes" : "no",
    insuranceType: insurance.insuranceType !== "NONE" ? insurance.insuranceType : null,
    eps: insurance.epsProvider,
    entry: meta.programEntryPoint,
    entrySub: meta.programEntrySubSource,
    primarySource: primaryValue(draft, extra.minor, extra.callerReady),
    secondaryEnabled: draft.secondaryContactEnabled ? "yes" : "no",
    historical: extra.historical ? "yes" : "no",
    minor: extra.minor ? "yes" : "no",
  })
}

function cost(value: string | null) {
  if (!value?.trim()) return undefined
  const amount = Number(value.replace(",", "."))
  return Number.isFinite(amount) ? amount : undefined
}

export function applyPaciente(draft: EnrollmentDraft, id: string, value: string | null): Partial<EnrollmentDraft> {
  const pd = draft.patientData
  const details = draft.details
  const meta = draft.enrollmentMetadata
  const insurance = draft.insurance
  const address = permanent(draft)
  const temp = temporary(draft)
  const setAddress = (partial: Partial<EnrollmentAddressRequest>) => ({ addresses: [{ ...address, ...partial }, ...draft.addresses.slice(1)] })
  const setTemp = (partial: Partial<EnrollmentAddressRequest>) => ({
    addresses: [address, { ...temp, ...partial, type: "TEMPORARY" as const, isPrimary: false }, ...draft.addresses.slice(2)],
  })

  switch (id) {
    case "fullName":
      return { patientData: { ...pd, fullName: value ?? "" } }
    case "birthDate":
      return { patientData: { ...pd, birthDate: value } }
    case "gender":
      return { patientData: { ...pd, gender: value } }
    case "primaryPhone":
      return { patientData: { ...pd, primaryPhone: value ?? "" } }
    case "secondaryPhone":
      return { patientData: { ...pd, secondaryPhone: value } }
    case "whatsapp":
      return { patientData: { ...pd, hasWhatsapp: value === "yes" } }
    case "email":
      return { patientData: { ...pd, email: value?.trim() || undefined } }
    case "bornInPeru": {
      const inPeru = value === "yes"
      return {
        details: {
          ...details,
          bornInPeru: value == null ? undefined : inPeru,
          birthDepartment: inPeru ? details.birthDepartment : undefined,
          birthCountry: inPeru ? undefined : details.birthCountry,
        },
      }
    }
    case "birthDepartment":
      return { details: { ...details, bornInPeru: true, birthCountry: undefined, birthDepartment: value || undefined } }
    case "birthCountry":
      return { details: { ...details, bornInPeru: false, birthDepartment: undefined, birthCountry: value || undefined } }
    case "zoneType":
      return { details: { ...details, zoneType: value || undefined } }
    case "address":
      return setAddress({ address: text(value) })
    case "district":
      return setAddress({ district: text(value) })
    case "province":
      return setAddress({ province: text(value) })
    case "department":
      return setAddress({ department: (value || undefined) as PeruDepartment | undefined })
    case "locationShare":
      return setAddress({ locationShareStatus: text(value) })
    case "locationUrl":
      return setAddress({ locationUrl: text(value) })
    case "travel":
      return { details: { ...details, travelTimeToHospital: toDuration(value) } }
    case "dniMatch":
      return setAddress({ dniMatchesAddress: value == null ? undefined : value === "yes" })
    case "hasTemp":
      if (value === "yes") return { addresses: [address, temp, ...draft.addresses.slice(2)] }
      return { addresses: draft.addresses.length > 1 ? [address, ...draft.addresses.slice(2)] : draft.addresses.length ? [address] : [] }
    case "tempHousing":
      return setTemp({ housingType: text(value), ...(value !== CATALOG_OTHER_CODE ? { housingTypeOther: undefined } : {}) })
    case "tempHousingOther":
      return setTemp({ housingTypeOther: text(value) })
    case "tempShelter":
      return setTemp({ shelterName: text(value) })
    case "tempAddress":
      return setTemp({ address: text(value) })
    case "tempDistrict":
      return setTemp({ district: text(value) })
    case "tempProvince":
      return setTemp({ province: text(value) })
    case "tempDepartment":
      return setTemp({ department: (value || undefined) as PeruDepartment | undefined })
    case "tempLocationShare":
      return setTemp({ locationShareStatus: text(value) })
    case "tempLocationUrl":
      return setTemp({ locationUrl: text(value) })
    case "tempTravel":
      return setTemp({ travelTimeToHospital: toDuration(value) })
    case "tempCost":
      return setTemp({ averageLodgingCost: cost(value) })
    case "tempCostPeriod":
      return setTemp({ averageLodgingCostPeriod: (value || undefined) as EnrollmentAddressRequest["averageLodgingCostPeriod"] })
    case "education":
      return { details: { ...details, educationLevel: (value as EducationLevel | null) ?? undefined } }
    case "language":
      return { details: { ...details, nativeLanguage: value || undefined } }
    case "translation":
      return { details: { ...details, requiresTranslation: value === "yes" } }
    case "working":
      return { details: { ...details, isWorking: value == null ? null : value === "yes" } }
    case "hasInsurance":
      if (value === "no") {
        return { insurance: { ...insurance, insuranceType: "NONE", epsProvider: undefined }, sisAffiliation: { canAffiliate: true } }
      }
      return { insurance: { ...insurance, insuranceType: insurance.insuranceType === "NONE" ? "SIS" : insurance.insuranceType } }
    case "insuranceType":
      return {
        insurance: {
          ...insurance,
          insuranceType: (value || "SIS") as InsuranceType,
          epsProvider: value === "EPS" ? insurance.epsProvider : undefined,
        },
      }
    case "eps":
      return { insurance: { ...insurance, epsProvider: (value as EpsProvider | null) ?? undefined } }
    case "entry":
      return { enrollmentMetadata: { ...meta, programEntryPoint: value || undefined, programEntrySubSource: undefined } }
    case "entrySub":
      return { enrollmentMetadata: { ...meta, programEntrySubSource: value || undefined } }
    case "primarySource":
      // "Otra persona" no cambia nada aquí: abre el alta del acompañante.
      return value === NEW_PERSON ? {} : choosePrimary(draft, value)
    case "secondaryEnabled":
      return { secondaryContactEnabled: value === "yes" }
    default:
      return {}
  }
}

export function companionValues(person: CompanionDraft): Values {
  return compact({
    fullName: person.fullName,
    relationship: person.relationship,
    primaryPhone: person.primaryPhone,
    secondaryPhone: person.secondaryPhone,
    dni: person.dni,
    birthDate: person.birthDate,
    gender: person.gender,
    whatsapp: person.hasWhatsapp === true ? "yes" : person.hasWhatsapp === false ? "no" : null,
  })
}

export function toCompanion(values: Values): CompanionDraft {
  return {
    fullName: values.fullName?.trim() ?? "",
    relationship: text(values.relationship),
    primaryPhone: values.primaryPhone?.trim() ?? "",
    secondaryPhone: text(values.secondaryPhone),
    dni: text(values.dni),
    birthDate: text(values.birthDate),
    gender: text(values.gender),
    hasWhatsapp: values.whatsapp === "yes",
  }
}
