import type { LucideIcon } from "lucide-react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

type ButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  /** outline: acción secundaria. dark: crear. brand: la acción urgente del momento. */
  variant?: "outline" | "dark" | "brand"
  size?: "sm" | "md"
  icon?: LucideIcon
  children: React.ReactNode
}

export function Button({ variant = "outline", size = "sm", icon: Icon, className, children, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] text-sm font-medium transition-[background-color,transform,opacity] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-8 px-3" : "h-9 px-3.5",
        variant === "outline" && "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50",
        variant === "dark" && "bg-zinc-900 text-white hover:bg-zinc-800",
        variant === "brand" && "bg-red-700 text-white hover:bg-red-800",
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="size-4" />}
      {children}
    </button>
  )
}

/** Botón de crear: oscuro con el ícono de agregar. */
export function AddButton(props: Omit<ButtonProps, "variant" | "icon">) {
  return <Button variant="dark" icon={Plus} {...props} />
}

export function IconButton({ icon: Icon, label, className, ...props }: Omit<React.ComponentProps<"button">, "children"> & { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-[10px] text-zinc-600 transition-[background-color,color] hover:bg-white hover:text-zinc-900 hover:ring-1 hover:ring-zinc-200",
        className,
      )}
      {...props}
    >
      <Icon className="size-4" />
    </button>
  )
}
