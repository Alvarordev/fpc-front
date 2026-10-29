import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { TextArea } from "./form"

/**
 * Panel fijo al pie con un texto que se escribe mientras se trabaja en el resto
 * de la pantalla (la nota de un seguimiento) y una columna de controles.
 * `asideTop` queda a la altura del borde superior del texto y `asideBottom` a la
 * del inferior, también cuando el texto crece al enfocarlo. Alt + tecla
 * (`shortcut`) lleva el foco al texto.
 */
export function ComposerDock({
  label,
  value,
  onChange,
  placeholder,
  shortcut = "n",
  asideTop,
  asideBottom,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  shortcut?: string
  asideTop?: React.ReactNode
  asideBottom?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const id = `composer-${shortcut}`

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === shortcut) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shortcut])

  const expanded = focused || value.length > 120
  return (
    <div className="sticky bottom-4 z-20">
      <div className="grid gap-x-3 gap-y-1.5 rounded-[20px] bg-white p-3 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.3)] ring-1 ring-zinc-200 md:grid-cols-[minmax(0,1fr)_460px] md:grid-rows-[auto_1fr]">
        <div className="flex items-baseline gap-2 px-1 md:col-start-1">
          <label htmlFor={id} className="text-sm font-semibold">
            {label}
          </label>
          <span className="text-xs text-zinc-400">Alt + {shortcut.toUpperCase()}</span>
        </div>
        <TextArea
          id={id}
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn("resize-none transition-[min-height] duration-200 ease-out motion-reduce:transition-none md:col-start-1 md:row-start-2", expanded ? "min-h-36" : "min-h-[84px]")}
        />
        <div className="flex flex-col justify-between gap-2 md:col-start-2 md:row-start-2">
          {asideTop}
          {asideBottom}
        </div>
      </div>
    </div>
  )
}
