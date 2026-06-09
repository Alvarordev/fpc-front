import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { usePatientAppointments, useVolunteers } from "../_hooks/use-appointments";
import { PsicoSessionCard } from "./psico-session-card";
import { PsicoSessionDetailDialog } from "./psico-session-detail-dialog";
import type { PsychooncologyAppointment } from "@/types";

const TOTAL_DEFAULT_SESSIONS = 4;

function sessionLabel(num: number): string {
  if (num <= TOTAL_DEFAULT_SESSIONS) return `Sesión ${num}`;
  return `Extra ${num - TOTAL_DEFAULT_SESSIONS}`;
}

interface PsicoTabProps {
  pacienteId: string;
}

export function PsicoTab({ pacienteId }: PsicoTabProps) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const canManage = role === "ADMIN" || role === "AGENT";

  const { data: appointments = [], isLoading } = usePatientAppointments(pacienteId);
  const { data: volunteers = [] } = useVolunteers();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PsychooncologyAppointment | null>(null);

  const sorted = [...appointments].sort((a, b) => a.sessionNumber - b.sessionNumber);

  const totalSlots = Math.max(TOTAL_DEFAULT_SESSIONS, sorted.length);
  const placeholderSlots = Array.from(
    { length: Math.max(0, totalSlots - sorted.length) },
    (_, i) => sorted.length + i + 1,
  );

  function getVolunteerName(volunteerId: string): string {
    const v = volunteers.find((vol) => vol.id === volunteerId);
    return v ? `${v.firstName} ${v.lastName}` : "Voluntario";
  }

  function openDetail(appointment: PsychooncologyAppointment) {
    setSelectedAppointment(appointment);
    setDetailOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Sesiones de psicooncología
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sorted.length} de {totalSlots} sesiones agendadas
          </p>
          {sorted.length > 0 && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              Hacé clic en las tarjetas para ver más detalles
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">Cargando sesiones...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <p className="text-sm font-medium text-foreground">
            Sin sesiones agendadas
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Las sesiones de psicooncología se agendan desde un contacto.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-4 min-w-max">
            {sorted.map((a) => (
              <PsicoSessionCard
                key={a.id}
                session={a}
                volunteerName={getVolunteerName(a.volunteerId)}
                canManage={canManage}
                // SCHEDULED + canManage: expand inline (edit form)
                // Everything else: open detail dialog on click
                onClick={
                  canManage && a.status === "SCHEDULED"
                    ? undefined
                    : () => openDetail(a)
                }
              />
            ))}

            {placeholderSlots.map((num) => (
              <div
                key={`placeholder-${num}`}
                className={cn(
                  "min-w-60 max-w-70 shrink-0 rounded-xl border-2 border-dashed border-border/50",
                  "flex flex-col items-center justify-center gap-1.5 py-8 px-4 text-center",
                )}
              >
                <p className="text-xs font-semibold text-muted-foreground/70">
                  {sessionLabel(num)}
                </p>
                <p className="text-xs text-muted-foreground/50">Pendiente</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <PsicoSessionDetailDialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        volunteerName={
          selectedAppointment
            ? getVolunteerName(selectedAppointment.volunteerId)
            : ""
        }
      />
    </div>
  );
}
