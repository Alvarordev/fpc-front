import type { AvailabilitySlot } from "@/types";

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

/**
 * Splits a time range into 1-hour slots.
 *
 * Example: splitIntoHourSlots("13:00", "15:00")
 *   → [{ startTime: "13:00:00", endTime: "14:00:00" }, { startTime: "14:00:00", endTime: "15:00:00" }]
 *
 * The backend expects individual 1-hour slots — the frontend is responsible for splitting.
 */
export function splitIntoHourSlots(
  startTime: string,
  endTime: string,
): { startTime: string; endTime: string }[] {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const slots: { startTime: string; endTime: string }[] = [];
  let current = startMinutes;

  while (current + 60 <= endMinutes) {
    const h1 = Math.floor(current / 60);
    const m1 = current % 60;
    const h2 = Math.floor((current + 60) / 60);
    const m2 = (current + 60) % 60;
    slots.push({
      startTime: `${String(h1).padStart(2, "0")}:${String(m1).padStart(2, "0")}:00`,
      endTime: `${String(h2).padStart(2, "0")}:${String(m2).padStart(2, "0")}:00`,
    });
    current += 60;
  }

  return slots;
}

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
