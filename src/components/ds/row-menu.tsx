import type { LucideIcon } from "lucide-react"
import { MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { IconButton } from "./button"

export type RowMenuItem = {
  label: string
  icon?: LucideIcon
  /** Acción que no se puede deshacer, o que quita el registro de la lista. */
  destructive?: boolean
  onSelect: () => void
}

/**
 * Menú de una fila cuando hay más de dos acciones. Con una o dos, usa
 * `IconButton`s. El clic no abre la fila.
 */
export function RowMenu({ label = "Acciones", items }: { label?: string; items: RowMenuItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<IconButton icon={MoreHorizontal} label={label} onClick={(event) => event.stopPropagation()} />}
      />
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="font-ds min-w-44 rounded-[14px] bg-white p-1.5 text-zinc-900 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.25)] ring-1 ring-zinc-200"
      >
        {items.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem
              key={item.label}
              onClick={() => item.onSelect()}
              className={cn(
                "cursor-pointer rounded-[9px] px-2.5 py-2 text-[13px] font-medium text-zinc-800 focus:bg-zinc-100 focus:text-zinc-900",
                item.destructive && "text-red-700 focus:bg-red-50 focus:text-red-700",
              )}
            >
              {Icon && <Icon className="size-4" />}
              {item.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
