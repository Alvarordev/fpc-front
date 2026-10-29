import { useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Dato que se copia al hacer clic: teléfonos y correos. Sin fondo al pasar el
// cursor: solo el puntero de clic y el ícono de copiar, que no ocupa espacio
// hasta que se muestra. Al copiar cambia a un check y sale un aviso.

export function CopyValue({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
      toast.success(`${label} copiado`, { description: value, duration: 1800 })
    } catch {
      toast.error(`No se pudo copiar el ${label.toLowerCase()}`, { description: "Selecciónalo y cópialo manualmente." })
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copiar ${label.toLowerCase()}`}
      aria-label={`Copiar ${label.toLowerCase()}: ${value}`}
      className={cn(
        "group/copy inline-flex max-w-full cursor-pointer items-center rounded-sm text-left focus-visible:ring-2 focus-visible:ring-zinc-900/15 focus-visible:outline-none",
        className,
      )}
    >
      <span className="truncate">{value}</span>
      <span
        className={cn(
          "relative h-3.5 shrink-0 overflow-hidden transition-[width,margin] duration-150 motion-reduce:transition-none",
          copied ? "ml-1.5 w-3.5" : "ml-0 w-0 group-hover/copy:ml-1.5 group-hover/copy:w-3.5 group-focus-visible/copy:ml-1.5 group-focus-visible/copy:w-3.5",
        )}
      >
        <Copy
          className={cn(
            "absolute inset-0 size-3.5 text-zinc-400 transition-[opacity,transform] duration-150 motion-reduce:transition-none",
            copied ? "scale-50 opacity-0" : "opacity-0 group-hover/copy:opacity-100 group-focus-visible/copy:opacity-100",
          )}
        />
        <Check
          className={cn(
            "absolute inset-0 size-3.5 text-emerald-600 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
            copied ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
          strokeWidth={2.5}
        />
      </span>
    </button>
  )
}
