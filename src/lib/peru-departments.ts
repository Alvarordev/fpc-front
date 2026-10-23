export const PERU_DEPARTMENTS = [
  { code: "01", value: "AMAZONAS", label: "Amazonas" },
  { code: "02", value: "ANCASH", label: "Áncash" },
  { code: "03", value: "APURIMAC", label: "Apurímac" },
  { code: "04", value: "AREQUIPA", label: "Arequipa" },
  { code: "05", value: "AYACUCHO", label: "Ayacucho" },
  { code: "06", value: "CAJAMARCA", label: "Cajamarca" },
  { code: "07", value: "CALLAO", label: "Callao" },
  { code: "08", value: "CUSCO", label: "Cusco" },
  { code: "09", value: "HUANCAVELICA", label: "Huancavelica" },
  { code: "10", value: "HUANUCO", label: "Huánuco" },
  { code: "11", value: "ICA", label: "Ica" },
  { code: "12", value: "JUNIN", label: "Junín" },
  { code: "13", value: "LA_LIBERTAD", label: "La Libertad" },
  { code: "14", value: "LAMBAYEQUE", label: "Lambayeque" },
  { code: "15", value: "LIMA", label: "Lima" },
  { code: "16", value: "LORETO", label: "Loreto" },
  { code: "17", value: "MADRE_DE_DIOS", label: "Madre de Dios" },
  { code: "18", value: "MOQUEGUA", label: "Moquegua" },
  { code: "19", value: "PASCO", label: "Pasco" },
  { code: "20", value: "PIURA", label: "Piura" },
  { code: "21", value: "PUNO", label: "Puno" },
  { code: "22", value: "SAN_MARTIN", label: "San Martín" },
  { code: "23", value: "TACNA", label: "Tacna" },
  { code: "24", value: "TUMBES", label: "Tumbes" },
  { code: "25", value: "UCAYALI", label: "Ucayali" },
] as const

export type PeruDepartment = (typeof PERU_DEPARTMENTS)[number]
export type PeruDepartmentCode = PeruDepartment["code"]
export type PeruDepartmentValue = PeruDepartment["value"]

export const PERU_DEPARTMENT_BY_CODE = new Map<string, PeruDepartment>(
  PERU_DEPARTMENTS.map((department) => [department.code, department]),
)

export const PERU_DEPARTMENT_BY_VALUE = new Map<string, PeruDepartment>(
  PERU_DEPARTMENTS.map((department) => [department.value, department]),
)

export const PERU_DEPARTMENTS_GEOJSON_URL = "/peru-departamentos.geojson"

export function departmentFromValue(
  value: string | null | undefined,
): PeruDepartment | undefined {
  if (!value) return undefined
  return PERU_DEPARTMENT_BY_VALUE.get(value)
}

export function departmentCodeFromValue(
  value: string | null | undefined,
): string | null {
  return departmentFromValue(value)?.code ?? null
}

export function departmentLabelFromValue(
  value: string | null | undefined,
): string | null {
  return departmentFromValue(value)?.label ?? null
}

export function departmentLabelFromCode(
  code: string | null | undefined,
): string | null {
  if (!code) return null
  return PERU_DEPARTMENT_BY_CODE.get(code)?.label ?? null
}
