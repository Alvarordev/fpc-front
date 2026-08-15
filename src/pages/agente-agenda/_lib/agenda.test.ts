import { describe, expect, it } from "vitest"
import type { FollowUp } from "@/api/follow-ups"
import type { Reminder } from "@/api/reminders"
import {
  buildAgendaEvents,
  toDateKey,
  toIsoDateTime,
  toLocalDateTimeParts,
} from "./agenda"

const followUp = (overrides: Partial<FollowUp> = {}): FollowUp => ({
  id: "follow-up-1",
  subjectPatientId: "patient-1",
  subjectPatientName: "Ana Torres",
  interlocutorId: "patient-1",
  agentId: "agent-1",
  type: "CALL",
  status: "SCHEDULED",
  purpose: "FOLLOW_UP",
  scheduledAt: "2026-08-20T14:00:00.000Z",
  completedAt: null,
  notes: null,
  nextFollowUpId: null,
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
  ...overrides,
})

const reminder = (overrides: Partial<Reminder> = {}): Reminder => ({
  id: "reminder-1",
  subjectPatientId: "patient-2",
  createdFromFollowUpId: null,
  assignedAgentId: "agent-1",
  dueAt: "2026-08-19T10:00:00.000Z",
  description: "Confirmar resultado de laboratorio",
  status: "PENDING",
  completedAt: null,
  resultingFollowUpId: null,
  createdAt: "2026-08-01T12:00:00.000Z",
  ...overrides,
})

describe("agent agenda helpers", () => {
  it("groups scheduled items into colored event types and sorts them by date", () => {
    const events = buildAgendaEvents(
      [
        followUp(),
        followUp({ id: "follow-up-without-date", scheduledAt: null }),
      ],
      [reminder()],
      new Map([["patient-2", "Luis Perez"]]),
    )

    expect(events).toHaveLength(2)
    expect(events.map((event) => event.kind)).toEqual(["reminder", "follow-up"])
    expect(events[0]?.patientName).toBe("Luis Perez")
    expect(events[1]?.title).toBe("Llamada")
  })

  it("uses the local calendar date and converts edit values to ISO", () => {
    expect(toDateKey("2026-08-20T14:00:00")).toBe("2026-08-20")
    const parts = toLocalDateTimeParts("2026-08-20T14:00:00")
    expect(parts).toEqual({ date: "2026-08-20", time: "14:00" })
    expect(new Date(toIsoDateTime(parts.date, parts.time)).toISOString()).toBe(
      new Date("2026-08-20T14:00:00").toISOString(),
    )
  })
})
