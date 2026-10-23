import { PERU_DEPARTMENTS } from "@/lib/peru-departments"

export { PERU_DEPARTMENTS }

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
