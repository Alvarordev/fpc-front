import {
  CATALOG_FORM_FIELD_LABELS,
  CATALOG_KIND_LABELS,
  OPEN_CATALOG_KINDS,
  type CatalogKind,
} from "@/api/catalogs"

const UNKNOWN_ENGLISH = /^Unknown ([a-z_]+) catalog value:\s*(.+)$/i
const UNKNOWN_SPANISH_KIND = /^«(.+)» no está en el catálogo ([a-z_]+)\b/i
const OTRO_ENGLISH =
  /^([a-z_]+) requires additional text when the value is OTRO$/i

function isCatalogKind(value: string): value is CatalogKind {
  return value in CATALOG_KIND_LABELS
}

export function catalogFormFieldLabel(kind: CatalogKind): string {
  return CATALOG_FORM_FIELD_LABELS[kind]
}

export function unknownCatalogValueMessage(
  kind: CatalogKind,
  value: string,
  options: { allowCreate?: boolean } = {},
): string {
  const field = catalogFormFieldLabel(kind)
  const quoted = `«${value.trim()}»`
  const canCreate =
    options.allowCreate ??
    OPEN_CATALOG_KINDS.includes(kind as (typeof OPEN_CATALOG_KINDS)[number])
  const action = canCreate
    ? "Si falta, agregala con + en esa misma selección o desde Catálogos."
    : "Si falta, un administrador debe agregarla en Catálogos."
  return `${quoted} no está en el catálogo de ${field}. Verificá esa selección. ${action}`
}

function humanizeCatalogFragment(fragment: string): string {
  const trimmed = fragment.trim()
  if (!trimmed) return fragment

  const unknownEnglish = trimmed.match(UNKNOWN_ENGLISH)
  if (unknownEnglish && isCatalogKind(unknownEnglish[1])) {
    return unknownCatalogValueMessage(unknownEnglish[1], unknownEnglish[2])
  }

  const unknownSpanish = trimmed.match(UNKNOWN_SPANISH_KIND)
  if (unknownSpanish && isCatalogKind(unknownSpanish[2])) {
    return unknownCatalogValueMessage(unknownSpanish[2], unknownSpanish[1])
  }

  const otroEnglish = trimmed.match(OTRO_ENGLISH)
  if (otroEnglish && isCatalogKind(otroEnglish[1])) {
    return `El catálogo de ${catalogFormFieldLabel(otroEnglish[1])} pide un detalle adicional cuando la opción es OTRO.`
  }

  return fragment
}

export function humanizeCatalogApiMessage(message: string): string {
  return message
    .split(/(?<=\.)\s+/)
    .map(humanizeCatalogFragment)
    .join(" ")
}
