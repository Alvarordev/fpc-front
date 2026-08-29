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

export type IndicatorMap = Record<string, number>

const codeByDepartmentValue = new Map(
  PERU_DEPARTMENTS.map((department) => [
    normalizeDepartment(department.value),
    department.code,
  ]),
)

export function createDepartmentIndicatorMap(
  items: { label: string; count: number }[],
): IndicatorMap {
  const result: IndicatorMap = Object.fromEntries(
    PERU_DEPARTMENTS.map((department) => [department.code, 0]),
  )

  for (const item of items) {
    const code = codeByDepartmentValue.get(normalizeDepartment(item.label))
    if (code) result[code] += item.count
  }

  return result
}

function normalizeDepartment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}
