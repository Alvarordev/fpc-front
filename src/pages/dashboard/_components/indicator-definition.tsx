import type { ReactNode } from "react"
import { CircleHelp } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function IndicatorDefinition({
  definition,
  children,
}: {
  definition?: string | null
  children: ReactNode
}) {
  if (!definition) return <>{children}</>
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      {children}
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label="¿Cómo se calcula?"
          className="text-muted-foreground hover:text-foreground inline-flex size-4 shrink-0 items-center justify-center"
        >
          <CircleHelp className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-left text-xs leading-relaxed">
          {definition}
        </TooltipContent>
      </Tooltip>
    </span>
  )
}
