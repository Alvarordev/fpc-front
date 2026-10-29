import { useRef, useState } from "react"
import { Combobox } from "@base-ui/react/combobox"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

// Select con buscador dentro, para listas largas (hospitales, diagnósticos,
// tratamientos, especialidades). La búsqueda ignora tildes y mayúsculas y
// también mira el texto secundario (p. ej. el distrito de un hospital). La
// primera coincidencia queda resaltada: escribir y pulsar Enter basta.

export type SearchOption = { value: string; label: string; sublabel?: string }

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

export function SearchSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Seleccionar",
  searchPlaceholder = "Buscar",
  emptyMessage = "No hay coincidencias",
  disabled,
}: {
  id?: string
  value: string | null
  onChange: (value: string) => void
  options: SearchOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
}) {
  const selected = options.find((o) => o.value === value) ?? null
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const popupRef = useRef<HTMLDivElement>(null)
  const matches = (item: SearchOption, q: string) => {
    const term = normalize(q.trim())
    return !term || normalize(`${item.label} ${item.sublabel ?? ""}`).includes(term)
  }

  /** Enter sin opción resaltada elige la primera coincidencia. */
  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || popupRef.current?.querySelector("[data-highlighted]")) return
    const first = options.find((o) => matches(o, query))
    if (!first) return
    event.preventDefault()
    onChange(first.value)
    setOpen(false)
  }

  return (
    <Combobox.Root
      items={options}
      value={selected}
      onValueChange={(item) => item && onChange((item as SearchOption).value)}
      itemToStringLabel={(item: SearchOption) => item.label}
      isItemEqualToValue={(a: SearchOption, b: SearchOption) => a.value === b.value}
      filter={(item: SearchOption, q) => matches(item, q)}
      open={open}
      onOpenChange={setOpen}
      onInputValueChange={setQuery}
      disabled={disabled}
    >
      <Combobox.Trigger
        id={id}
        className="flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] bg-white px-3 text-left text-sm text-zinc-900 ring-1 ring-zinc-200 transition-[box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-50 data-[popup-open]:ring-2 data-[popup-open]:ring-zinc-900/20"
      >
        <span className={cn("truncate", !selected && "text-zinc-400")}>{selected ? selected.label : placeholder}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-zinc-400" />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} align="start" className="z-50">
          <Combobox.Popup ref={popupRef} className="font-ds w-[var(--anchor-width)] min-w-64 origin-[var(--transform-origin)] overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_-12px_rgb(0_0_0/0.25)] ring-1 ring-zinc-200 transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <div className="flex items-center gap-2 border-b border-zinc-100 px-3">
              <Search className="size-4 shrink-0 text-zinc-400" />
              <Combobox.Input placeholder={searchPlaceholder} onKeyDown={onInputKeyDown} className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-zinc-400" />
            </div>
            <Combobox.Empty className="px-3 py-6 text-center text-[13px] text-zinc-500 empty:hidden">{emptyMessage}</Combobox.Empty>
            <Combobox.List className="max-h-64 overflow-y-auto p-1.5 empty:hidden">
              {(item: SearchOption) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className="flex cursor-pointer items-center gap-2 rounded-[9px] px-2.5 py-2 text-sm outline-none select-none data-[highlighted]:bg-zinc-100"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.label}</span>
                    {item.sublabel && <span className="block truncate text-xs text-zinc-500">{item.sublabel}</span>}
                  </span>
                  <Combobox.ItemIndicator>
                    <Check className="size-4 text-zinc-900" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
