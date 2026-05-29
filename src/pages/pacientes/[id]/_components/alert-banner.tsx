import { useState } from "react";
import { TriangleAlert, ChevronLeft, ChevronRight } from "lucide-react";
import type { Alert } from "@/types";

interface AlertBannerProps {
  alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (alerts.length === 0) return null;

  const alert = alerts[currentIndex]!;
  const hasMultiple = alerts.length > 1;

  const goToPrev = () =>
    setCurrentIndex((prev) => (prev === 0 ? alerts.length - 1 : prev - 1));

  const goToNext = () =>
    setCurrentIndex((prev) => (prev === alerts.length - 1 ? 0 : prev + 1));

  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <TriangleAlert className="size-5 text-red-600 shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-900">
          {alert.title}
          {alert.healthCenterName && (
            <span className="font-normal text-red-700/80">
              {" "}— {alert.healthCenterName}
            </span>
          )}
        </p>
        {alert.description && (
          <p className="text-xs text-red-700/80 mt-0.5 line-clamp-2">
            {alert.description}
          </p>
        )}
        {hasMultiple && (
          <p className="text-[11px] text-red-600/70 mt-1">
            Alerta {currentIndex + 1} de {alerts.length}
          </p>
        )}
      </div>

      {hasMultiple && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={goToPrev}
            className="flex size-7 items-center justify-center rounded-md text-red-600 hover:bg-red-100 transition-colors"
            aria-label="Alerta anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="flex size-7 items-center justify-center rounded-md text-red-600 hover:bg-red-100 transition-colors"
            aria-label="Alerta siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
