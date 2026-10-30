import { yes, type Group } from "@/components/ds/questions"
import { DEPARTMENTS } from "@/pages/hospitales/_utils/departments"
import { UNKNOWN_BIRTH_DEPARTMENT } from "@/types"
import {
  CATALOG_OTHER_CODE,
  HOUSING_LODGING_CODE,
  HOUSING_SHELTER_CODE,
  LOCATION_SHARED_CODE,
  LODGING_COST_PERIOD_OPTIONS,
  housingAsksAddress,
} from "../../../_utils/address-housing"

const GENDER = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "OTHER", label: "Otro" },
]

const departmentOptions = DEPARTMENTS.map((item) => ({ value: item.value, label: item.label }))

export const identityGroups: Group[] = [
  {
    // Sin título: la tarjeta "Identidad" ya lo dice.
    title: "",
    questions: [
      { id: "fullName", label: "Nombre completo", type: "text", required: true, wide: true, placeholder: "Tal como aparece en el DNI" },
      { id: "birthDate", label: "Fecha de nacimiento", type: "date", required: true },
      { id: "gender", label: "Género", type: "choice", options: GENDER },
    ],
  },
]

export function contactGroups(phoneRequired: boolean): Group[] {
  return [
    {
      title: "Teléfonos del paciente",
      description: phoneRequired
        ? "Se guardan en la ficha del paciente."
        : "Opcional. Se guardan en la ficha aunque el contacto principal sea otra persona.",
      questions: [
        { id: "primaryPhone", label: "Teléfono principal", type: "text", required: phoneRequired, placeholder: "987654321" },
        { id: "secondaryPhone", label: "Teléfono adicional o fijo", type: "text", placeholder: "01 555 1234" },
        { id: "whatsapp", label: "¿Tiene WhatsApp?", type: "yesno" },
      ],
    },
  ]
}

const asksStreet = (key: "tempHousing") => (v: Record<string, string | null>) => housingAsksAddress(v[key] ?? undefined)

export const residenceGroups: Group[] = [
  {
    title: "Procedencia",
    questions: [
      { id: "bornInPeru", label: "¿Nació en el Perú?", type: "yesno" },
      {
        id: "birthDepartment",
        label: "Departamento de nacimiento",
        type: "select",
        options: [...departmentOptions, { value: UNKNOWN_BIRTH_DEPARTMENT, label: "No menciona" }],
        showIf: (v) => v.bornInPeru === "yes",
      },
      { id: "birthCountry", label: "País de nacimiento", type: "select", catalog: "country", showIf: (v) => v.bornInPeru === "no" },
      { id: "zoneType", label: "Zonificación de residencia", type: "select", catalog: "zone_type" },
    ],
  },
  {
    title: "Dirección actual",
    questions: [
      { id: "address", label: "Dirección", type: "text", wide: true, placeholder: "Av. Principal 123" },
      { id: "district", label: "Distrito", type: "text", placeholder: "Miraflores" },
      { id: "province", label: "Provincia", type: "text", placeholder: "Lima" },
      { id: "department", label: "Departamento", type: "select", options: departmentOptions },
      { id: "locationShare", label: "¿Comparte la ubicación de su residencia?", type: "select", catalog: "location_share_status", wide: true },
      {
        id: "locationUrl",
        label: "Ubicación web de la residencia",
        type: "text",
        wide: true,
        placeholder: "https://maps.google.com/...",
        hint: "Pegue un enlace de Google Maps u otro mapa con protocolo http o https.",
        showIf: (v) => v.locationShare === LOCATION_SHARED_CODE || (!v.locationShare && Boolean(v.locationUrl)),
      },
      { id: "travel", label: "Tiempo de viaje al hospital", type: "duration", units: ["MINUTE", "HOUR", "DAY"] },
      { id: "dniMatch", label: "¿Dirección DNI coincide con actual?", type: "yesno" },
    ],
  },
  {
    title: "Vivienda provisional",
    description: "Si vive en otra ciudad durante parte del año, registre aquí esa segunda dirección.",
    questions: [
      { id: "hasTemp", label: "¿Cuenta con una vivienda provisional adicional?", type: "yesno", wide: true },
      { id: "tempHousing", label: "Esta vivienda provisional es", type: "select", catalog: "temporary_housing_type", showIf: yes("hasTemp") },
      { id: "tempHousingOther", label: "Especifique dónde se queda", type: "text", showIf: (v) => v.hasTemp === "yes" && v.tempHousing === CATALOG_OTHER_CODE },
      { id: "tempShelter", label: "Nombre del albergue", type: "text", placeholder: "Ej: Albergue Frieda Heller", showIf: (v) => v.hasTemp === "yes" && v.tempHousing === HOUSING_SHELTER_CODE },
      { id: "tempAddress", label: "Dirección", type: "text", placeholder: "Av. Principal 123", showIf: (v) => v.hasTemp === "yes" && asksStreet("tempHousing")(v) },
      { id: "tempDistrict", label: "Distrito", type: "text", showIf: (v) => v.hasTemp === "yes" && asksStreet("tempHousing")(v) },
      { id: "tempProvince", label: "Provincia", type: "text", showIf: (v) => v.hasTemp === "yes" && asksStreet("tempHousing")(v) },
      { id: "tempDepartment", label: "Departamento", type: "select", options: departmentOptions, showIf: (v) => v.hasTemp === "yes" && asksStreet("tempHousing")(v) },
      { id: "tempLocationShare", label: "¿Comparte la ubicación de esta vivienda?", type: "select", catalog: "location_share_status", showIf: (v) => v.hasTemp === "yes" && asksStreet("tempHousing")(v) },
      {
        id: "tempLocationUrl",
        label: "Ubicación web de la residencia",
        type: "text",
        placeholder: "https://maps.google.com/...",
        showIf: (v) => v.hasTemp === "yes" && asksStreet("tempHousing")(v) && (v.tempLocationShare === LOCATION_SHARED_CODE || (!v.tempLocationShare && Boolean(v.tempLocationUrl))),
      },
      { id: "tempTravel", label: "Tiempo de llegada al hospital", type: "duration", units: ["MINUTE", "HOUR"], showIf: (v) => v.hasTemp === "yes" && v.tempHousing === HOUSING_LODGING_CODE },
      { id: "tempCost", label: "Gasto promedio al alquilar (S/)", type: "text", placeholder: "0.00", showIf: (v) => v.hasTemp === "yes" && v.tempHousing === HOUSING_LODGING_CODE },
      {
        id: "tempCostPeriod",
        label: "El gasto es",
        type: "select",
        options: LODGING_COST_PERIOD_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
        showIf: (v) => v.hasTemp === "yes" && v.tempHousing === HOUSING_LODGING_CODE,
      },
    ],
  },
]

export const profileGroups: Group[] = [
  {
    title: "Perfil socioeducativo",
    questions: [
      { id: "education", label: "Nivel educativo", type: "select", catalog: "education_level", wide: true },
      { id: "language", label: "Lengua nativa", type: "select", catalog: "native_language" },
      { id: "translation", label: "¿Requiere traducción?", type: "yesno" },
      { id: "working", label: "¿Actualmente trabaja?", type: "yesno" },
    ],
  },
  {
    title: "Seguro de salud",
    questions: [
      { id: "hasInsurance", label: "¿Actualmente cuenta con un seguro de salud?", type: "yesno", required: true, wide: true },
      { id: "eps", label: "Proveedor EPS", type: "select", catalog: "eps_provider", showIf: (v) => v.hasInsurance === "yes" && v.insuranceType === "EPS" },
    ],
  },
]

export function companionGroups(callerReady: boolean): Group[] {
  return [
    {
      title: "Contacto principal",
      questions: [
        {
          id: "primarySource",
          label: "¿Quién será el contacto principal?",
          type: "choice",
          required: true,
          wide: true,
          optionsFrom: (v) => [
            ...(v.minor === "yes" ? [] : [{ value: "PATIENT", label: "El paciente" }]),
            ...(callerReady ? [{ value: "CALLER", label: "La persona que llama" }] : []),
            { value: "NEW", label: "Registrar un acompañante" },
          ],
        },
      ],
    },
    {
      title: "Contacto secundario",
      questions: [
        { id: "secondaryEnabled", label: "¿Desea registrar un contacto secundario?", type: "yesno", wide: true },
        {
          id: "secondarySource",
          label: "Origen del contacto secundario",
          type: "choice",
          wide: true,
          showIf: yes("secondaryEnabled"),
          optionsFrom: (v) => [
            ...(callerReady && v.primarySource !== "CALLER" ? [{ value: "CALLER", label: "La persona que llama" }] : []),
            { value: "NEW", label: "Registrar un acompañante" },
          ],
        },
      ],
    },
  ]
}

export const personGroups: Group[] = [
  {
    title: "Acompañante",
    questions: [
      { id: "fullName", label: "Nombre completo", type: "text", required: true, placeholder: "Nombre y apellidos" },
      { id: "relationship", label: "Parentesco con el paciente", type: "select", catalog: "companion_relationship", required: true },
      { id: "primaryPhone", label: "Teléfono principal", type: "text", required: true, placeholder: "999 000 777" },
      { id: "secondaryPhone", label: "Teléfono adicional o fijo", type: "text", placeholder: "01 555 1234" },
      { id: "dni", label: "DNI", type: "text", placeholder: "74829304" },
      { id: "birthDate", label: "Fecha de nacimiento", type: "date" },
      { id: "gender", label: "Género", type: "choice", options: GENDER },
      { id: "whatsapp", label: "¿Tiene WhatsApp?", type: "yesno" },
    ],
  },
]

