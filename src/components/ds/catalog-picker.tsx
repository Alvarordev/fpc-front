import { Plus } from "lucide-react"
import { SelectField } from "./form"
import { SearchSelect, type SearchOption } from "./search-select"

/**
 * Selector de un catálogo editable (o de hospitales) con el botón para agregar
 * una opción nueva al lado. Toda lista que el usuario puede ampliar va con este
 * componente: así nunca queda bloqueado por una opción que falta.
 */
export function CatalogPicker({
  id,
  value,
  onChange,
  options,
  searchable,
  addLabel,
  onAdd,
  placeholder,
  disabled,
}: {
  id?: string
  value: string | null
  onChange: (value: string) => void
  options: SearchOption[]
  /** Listas largas: hospitales, diagnósticos, tratamientos, especialidades. */
  searchable?: boolean
  /** Ej. "Agregar especialidad". Se usa como etiqueta accesible y tooltip. */
  addLabel: string
  onAdd: () => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1">
        {searchable ? (
          <SearchSelect id={id} value={value} onChange={onChange} options={options} placeholder={placeholder} disabled={disabled} searchPlaceholder={`Buscar en ${options.length} opciones`} />
        ) : (
          <SelectField id={id} value={value} onChange={onChange} options={options} placeholder={placeholder} disabled={disabled} />
        )}
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        aria-label={addLabel}
        title={addLabel}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-white text-zinc-600 ring-1 ring-zinc-200 transition-[background-color,color,transform] hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.95] disabled:pointer-events-none disabled:opacity-50"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
