import { createContext, useContext } from "react"
import type { SearchOption } from "./search-select"

// De dónde salen las opciones de los catálogos ampliables. Cada pantalla lo
// provee (en la app, sobre useCatalog y la API de hospitales); `QuestionForm`
// lo usa para dibujar `CatalogPicker` con su botón de agregar.

export type CatalogSource = {
  /**
   * Hook: opciones del catálogo. `query` es lo escrito en el buscador (para
   * listas que se buscan en el servidor, como hospitales) y `selected` el valor
   * actual, que la fuente debe incluir para mostrar su etiqueta.
   */
  useOptions: (key: string, query: string, selected: string | null) => { options: SearchOption[]; loading?: boolean }
  /** Nombre en singular para el botón y el modal: "especialidad". */
  singular: (key: string) => string
  /** Listas largas con buscador: hospitales, diagnósticos, tratamientos, especialidades. */
  searchable: (key: string) => boolean
  /** Si el usuario puede agregar opciones a este catálogo (permisos del backend). */
  canAdd: (key: string) => boolean
  /** Abre el alta; `onCreated` recibe el valor nuevo para seleccionarlo. */
  requestAdd: (key: string, onCreated: (value: string) => void) => void
}

export const CatalogSourceContext = createContext<CatalogSource | null>(null)

export function useCatalogSource() {
  const source = useContext(CatalogSourceContext)
  if (!source) throw new Error("Las preguntas con catálogo necesitan un CatalogSourceContext")
  return source
}
