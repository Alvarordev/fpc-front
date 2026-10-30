import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ds/button"
import { formatMonthYear } from "@/lib/calendar-helpers"

export function CalendarHeader({
  year,
  month,
  onPrev,
  onNext,
}: {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={onPrev} aria-label="Mes anterior">
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-36 text-center text-sm font-semibold capitalize text-zinc-900">
        {formatMonthYear(year, month)}
      </span>
      <Button onClick={onNext} aria-label="Mes siguiente">
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
