export function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const endPad = (7 - ((lastDay.getDay() + 1) % 7)) % 7;
  const days: Date[] = [];
  for (let i = startPad; i > 0; i--) days.push(new Date(year, month, 1 - i));
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  for (let i = 1; i <= endPad; i++) days.push(new Date(year, month + 1, i));
  return days;
}

import type { AvailabilitySlot } from "@/types";

export function groupSlotsByDay(
  slots: AvailabilitySlot[],
  year: number,
  month: number,
): Map<string, AvailabilitySlot[]> {
  const map = new Map<string, AvailabilitySlot[]>();
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  for (const slot of slots) {
    if (!slot.date.startsWith(prefix)) continue;
    const existing = map.get(slot.date) ?? [];
    existing.push(slot);
    map.set(slot.date, existing);
  }
  for (const [, arr] of map) {
    arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return map;
}

export function formatTimeRange(inicio: string, fin: string): string {
  return `${inicio.slice(0, 5)}–${fin.slice(0, 5)}`;
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });
}

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
