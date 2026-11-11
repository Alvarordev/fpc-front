import { catalogLabel, useCatalog } from "@/hooks/use-catalog"

/**
 * Etiquetas de parentesco desde el catálogo `companion_relationship`, incluidos
 * los ítems inactivos para que los vínculos antiguos se sigan leyendo bien.
 * Los selects usan `CatalogSelect`: el backend solo acepta códigos del
 * catálogo, así que la UI legacy ya no ofrece "Otro" con texto libre.
 */
export function useRelationshipItems() {
  const { data = [] } = useCatalog("companion_relationship", true)
  return {
    labelOf: (code: string | null | undefined) => catalogLabel(data, code),
  }
}
