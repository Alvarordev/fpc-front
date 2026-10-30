import type { LucideIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { IconTile } from "./icon"

/**
 * Modal de detalle: cabecera blanca con ícono y etiquetas, cuerpo en lienzo gris
 * con `Panel`es y pie con acciones. Para ver o corregir un registro completo.
 */
export function Modal({
  open,
  onClose,
  icon,
  title,
  description,
  tags,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  icon?: LucideIcon
  title: string
  description?: string
  tags?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="font-ds flex max-h-[88dvh] flex-col gap-0 overflow-hidden rounded-[24px] bg-zinc-50 p-0 ring-1 ring-zinc-200 sm:max-w-2xl">
        <div className="flex items-start gap-3 bg-white p-5 pr-12 ring-1 ring-zinc-200/70">
          {icon && <IconTile icon={icon} />}
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg leading-snug font-semibold">{title}</DialogTitle>
            {description && <DialogDescription className="mt-0.5 text-[13px] text-zinc-500">{description}</DialogDescription>}
            {tags && <div className="mt-2 flex flex-wrap gap-1.5">{tags}</div>}
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 bg-white px-5 py-3.5 ring-1 ring-zinc-200/70">{footer}</div>}
      </DialogContent>
    </Dialog>
  )
}
