export const RESERVED_CATALOG_CODE = "OTRO"

export function slugifyCatalogCode(label: string): string {
  return label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function isReservedCatalogCode(code: string): boolean {
  return code.trim().toUpperCase() === RESERVED_CATALOG_CODE
}
