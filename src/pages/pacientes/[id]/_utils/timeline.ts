import type { Contact, PsychooncologyAppointment } from "@/types";

export type TimelineEventType = "contacto" | "psico";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  fecha: string;
  hora?: string | null;
  title: string;
  description: string | null;
  status: string;
  meta?: {
    type?: string;
    purpose?: string;
    notes?: string | null;
    agentName?: string | null;
    modality?: string;
    sessionNumber?: number;
    volunteerName?: string;
  };
}

function extractDate(datetime: string | null): string | null {
  if (!datetime) return null;
  return datetime.slice(0, 10);
}

function extractTime(datetime: string | null): string | null {
  if (!datetime) return null;
  return datetime.slice(11, 16);
}

const contactPurposeLabels: Record<string, string> = {
  FIRST_CONTACT: "Primer contacto",
  ENROLLMENT: "Enrolamiento",
  FOLLOW_UP: "Seguimiento",
  PSYCHOONCOLOGY_REFERRAL: "Derivación a psicooncología",
  OTHER: "Otro",
};

export function buildTimeline(
  contacts: Contact[],
  appointments: PsychooncologyAppointment[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const c of contacts) {
    const isScheduled = c.status === "SCHEDULED";
    const date = isScheduled
      ? extractDate(c.scheduledAt) ?? extractDate(c.createdAt)
      : extractDate(c.completedAt) ?? extractDate(c.scheduledAt) ?? extractDate(c.createdAt);

    if (!date) continue;

    const purposeLabel = c.purpose ? contactPurposeLabels[c.purpose] ?? c.purpose : "";

    events.push({
      id: c.id,
      type: "contacto",
      fecha: date,
      hora: isScheduled ? extractTime(c.scheduledAt) : extractTime(c.completedAt),
      title: isScheduled ? "Contacto agendado" : `Contacto — ${purposeLabel}`,
      description: c.notes,
      status: c.status,
      meta: {
        type: c.type,
        purpose: c.purpose,
        notes: c.notes,
        agentName: c.agentName,
      },
    });
  }

  for (const a of appointments) {
    const date = extractDate(a.scheduledAt) ?? extractDate(a.createdAt);
    if (!date) continue;

    events.push({
      id: a.id,
      type: "psico",
      fecha: date,
      hora: extractTime(a.scheduledAt),
      title: `Sesión de psicooncología #${a.sessionNumber}`,
      description: a.topicAddressed ?? a.additionalObservations,
      status: a.status,
      meta: {
        modality: a.modality,
        sessionNumber: a.sessionNumber,
      },
    });
  }

  return events.sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.hora ?? "").localeCompare(a.hora ?? ""));
}
