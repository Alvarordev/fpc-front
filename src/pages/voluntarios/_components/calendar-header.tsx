import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/calendar-helpers";

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export function CalendarHeader({
  year,
  month,
  onPrev,
  onNext,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-sm font-semibold text-foreground capitalize min-w-36 text-center">
        {formatMonthYear(year, month)}
      </span>
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onNext}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
