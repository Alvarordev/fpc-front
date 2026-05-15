import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarHeader } from "@/pages/voluntarios/_components/calendar-header";
import { useVolunteerProfile } from "@/hooks/use-volunteer-profile";
import { useMySlots, useDeleteSlot } from "../_hooks/use-disponibilidad";
import { DisponibilidadCalendar } from "./disponibilidad-calendar";
import { AddAvailabilitySheet } from "./add-availability-sheet";

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth();

export function DisponibilidadContent() {
  const { volunteerId, isLoading: loadingProfile } =
    useVolunteerProfile();

  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<
    string | undefined
  >(undefined);
  const [selectedWeekday, setSelectedWeekday] = useState<number | undefined>(undefined);
  const [anchorPosition, setAnchorPosition] = useState<
    { x: number; y: number; side: "left" | "right" } | undefined
  >(undefined);

  const { data: slots = [] } = useMySlots(volunteerId);
  const deleteSlot = useDeleteSlot(volunteerId ?? "");

  const isCurrentMonth =
    year === CURRENT_YEAR && month === CURRENT_MONTH;

  function prevMonth() {
    if (isCurrentMonth) return;
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function handleDayClick(date: Date, anchor: HTMLElement) {
    const rect = anchor.getBoundingClientRect();
    const dialogWidth = 360;
    const dialogHeight = 420;
    const gap = 8;
    const side =
      rect.right + dialogWidth + gap > window.innerWidth
        ? "left"
        : "right";
    const x =
      side === "right"
        ? rect.right + gap
        : Math.max(8, rect.left - dialogWidth - gap);
    const y = Math.max(
      8,
      Math.min(rect.top, window.innerHeight - dialogHeight - 8),
    );

    setAnchorPosition({ x, y, side });
    setSelectedDate(date.toISOString().slice(0, 10));
    setSelectedWeekday(date.getDay());
    setSheetOpen(true);
  }

  function handleAddClick() {
    setAnchorPosition(undefined);
    setSelectedDate(undefined);
    setSelectedWeekday(undefined);
    setSheetOpen(true);
  }

  function handleSlotDelete(slotId: string) {
    if (!volunteerId) return;
    deleteSlot.mutate(slotId);
  }

  const availableCount = slots.filter(
    (s) => s.status === "AVAILABLE",
  ).length;
  const reservedCount = slots.filter(
    (s) => s.status === "RESERVED",
  ).length;

  if (loadingProfile) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Cargando perfil...
        </p>
      </div>
    );
  }

  if (!volunteerId) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Tu cuenta no está vinculada a un perfil de voluntario.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Disponibilidad
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {availableCount} disponible
            {availableCount !== 1 ? "s" : ""}
            {reservedCount > 0 &&
              ` · ${reservedCount} reservado${reservedCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={handleAddClick}
        >
          <Plus className="size-4" />
          Agregar
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <CalendarHeader
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
      </div>

      <DisponibilidadCalendar
        year={year}
        month={month}
        slots={slots}
        onDayClick={handleDayClick}
        onSlotDelete={handleSlotDelete}
      />

      <AddAvailabilitySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        volunteerId={volunteerId}
        defaultDate={selectedDate}
        selectedWeekday={selectedWeekday}
        anchorPosition={anchorPosition}
      />
    </div>
  );
}
