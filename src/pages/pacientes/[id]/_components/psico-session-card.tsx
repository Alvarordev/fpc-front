import { useState } from "react";
import { BrainCircuit, PhoneCall, Video, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAvailableSlots, useReschedulePsicoSession } from "../_hooks/use-psico-sessions";
import type { PsychooncologyAppointment, AvailabilitySlot } from "@/types";

// ============================================================
// Helpers
// ============================================================

const TOTAL_DEFAULT_SESSIONS = 4;

const statusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No contestó",
};

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  NO_ANSWER: "bg-amber-50 text-amber-700 border-amber-200",
};

const modalityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CALL: PhoneCall,
  VIDEO_CALL: Video,
};

const modalityLabels: Record<string, string> = {
  CALL: "Llamada",
  VIDEO_CALL: "Videollamada",
};

function sessionLabel(num: number): string {
  if (num <= TOTAL_DEFAULT_SESSIONS) return `Sesión ${num}`;
  return `Extra ${num - TOTAL_DEFAULT_SESSIONS}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

/** Formats a slot as "lun 9 jun — 10:00 a 11:00" */
function formatSlotLabel(slot: { date: string; startTime: string; endTime: string }): string {
  const date = new Date(slot.date + "T12:00:00").toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const start = slot.startTime.slice(0, 5);
  const end = slot.endTime.slice(0, 5);
  return `${date} — ${start} a ${end}`;
}

// ============================================================
// SessionEditForm — inline form to reschedule a session
// ============================================================

interface SessionEditFormProps {
  session: PsychooncologyAppointment;
  pacienteId: string;
  onDone: () => void;
}

function SessionEditForm({ session, pacienteId, onDone }: SessionEditFormProps) {
  const { data: slotsData = [] } = useAvailableSlots(session.volunteerId);
  const rescheduleMutation = useReschedulePsicoSession(pacienteId);

  // Available slots for this volunteer only
  const availableSlots = slotsData.filter(
    (s) => s.volunteerId === session.volunteerId,
  );

  // Build synthetic current slot from session data (since it's RESERVED and
  // won't appear in available slots)
  const currentSlot: AvailabilitySlot = {
    id: session.availabilityId,
    volunteerId: session.volunteerId,
    date: session.scheduledAt.slice(0, 10),
    startTime: session.scheduledAt.slice(11, 16),
    endTime: session.scheduledAt.slice(11, 16), // best-effort; actual end from slot stored as scheduledAt
    status: "RESERVED",
  };

  // Merge: current slot + available slots, no duplicates, sorted by date
  const allSlotIds = new Set<string>();
  const merged: (AvailabilitySlot & { isCurrent?: boolean })[] = [];

  // Current slot first
  allSlotIds.add(currentSlot.id);
  merged.push({ ...currentSlot, isCurrent: true });

  for (const s of availableSlots) {
    if (!allSlotIds.has(s.id)) {
      allSlotIds.add(s.id);
      merged.push(s);
    }
  }

  // Sort by date ascending
  merged.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const [selectedSlotId, setSelectedSlotId] = useState<string>(session.availabilityId);

  async function handleReschedule() {
    if (!selectedSlotId) return;
    await rescheduleMutation.mutateAsync({
      sessionId: session.id,
      newSlotId: selectedSlotId,
      oldSlotUuid: session.availabilityId,
      volunteerId: session.volunteerId,
    });
    onDone();
  }

  return (
    <div className="space-y-3 pt-2 border-t border-border/40">
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Cambiar horario</label>
        <Select value={selectedSlotId} onValueChange={(v) => v && setSelectedSlotId(v)}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {merged.map((slot) => (
              <SelectItem key={slot.id} value={slot.id}>
                {formatSlotLabel(slot)}{slot.isCurrent ? " (actual)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleReschedule}
          disabled={rescheduleMutation.isPending}
          className="text-xs h-8"
        >
          {rescheduleMutation.isPending ? "Reprogramando..." : "Cambiar horario"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDone}
          className="text-xs h-8"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// PsicoSessionCard — expandable session card
// ============================================================

interface PsicoSessionCardProps {
  session: PsychooncologyAppointment;
  volunteerName: string;
  canManage: boolean;
  onClick?: () => void;
}

export function PsicoSessionCard({
  session,
  volunteerName,
  canManage,
  onClick,
}: PsicoSessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ModalityIcon = modalityIcons[session.modality] ?? Calendar;
  const isCompleted = session.status === "COMPLETED";
  const showEditForm =
    canManage && session.status === "SCHEDULED" && isExpanded;

  function handleToggle() {
    setIsExpanded((prev) => !prev);
  }

  function handleCardClick() {
    // If the parent wants to handle click (e.g., open detail dialog),
    // call onClick; otherwise toggle expand
    if (onClick) {
      onClick();
    } else {
      handleToggle();
    }
  }

  return (
    <div
      className={cn(
        "min-w-60 max-w-70 shrink-0 rounded-xl border p-4 text-left transition-colors",
        "cursor-pointer hover:border-primary/30 hover:shadow-sm",
        isCompleted
          ? "border-emerald-200 bg-emerald-50/50"
          : session.status === "SCHEDULED"
            ? "border-blue-200 bg-blue-50/50"
            : "border-border/60",
      )}
    >
      {/* Header — always visible */}
      <div onClick={handleCardClick}>
        <div className="flex items-center justify-between">
          <BrainCircuit className="size-4 text-purple-600" />
          <Badge
            className={cn("border text-[10px] font-medium", statusStyles[session.status])}
          >
            {statusLabels[session.status]}
          </Badge>
        </div>

        <div className="mt-3">
          <p className="text-sm font-semibold">{sessionLabel(session.sessionNumber)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{volunteerName}</p>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground mt-3">
          <div className="flex items-center gap-1.5">
            <ModalityIcon className="size-3" />
            <span>{modalityLabels[session.modality] ?? session.modality}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3" />
            <span>{formatDate(session.scheduledAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{formatTime(session.scheduledAt)}</span>
          </div>
        </div>

        {session.topicAddressed && (
          <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2 mt-3">
            {session.topicAddressed}
          </p>
        )}

        {/* Expand indicator */}
        {canManage && session.status === "SCHEDULED" && (
          <div className="flex items-center justify-center mt-3 text-muted-foreground/60">
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </div>
        )}
      </div>

      {/* Expanded section */}
      {isExpanded && (
        <>
          {showEditForm && (
            <SessionEditForm
              session={session}
              pacienteId={session.patientId}
              onDone={handleToggle}
            />
          )}
          {/* Show session details when expanded but not editing */}
          {!showEditForm && session.status !== "SCHEDULED" && (
            <div className="space-y-3 pt-2 border-t border-border/40">
              {session.topicAddressed && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Tema abordado
                  </p>
                  <p className="text-xs text-foreground/80 mt-1 whitespace-pre-wrap">
                    {session.topicAddressed}
                  </p>
                </div>
              )}
              {session.sessionDetails && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Detalles
                  </p>
                  <p className="text-xs text-foreground/80 mt-1 whitespace-pre-wrap">
                    {session.sessionDetails}
                  </p>
                </div>
              )}
              {session.recommendations && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Recomendaciones
                  </p>
                  <p className="text-xs text-foreground/80 mt-1 whitespace-pre-wrap">
                    {session.recommendations}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
