import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, CalendarClock, PhoneCall, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { contactsApi } from "@/lib/api";
import { useContacts } from "../_hooks/use-contacts";
import { usePatientAppointments } from "../_hooks/use-appointments";
import { buildTimeline } from "../_utils/timeline";
import { TimelineEventCard } from "./timeline-event-card";
import { ScheduleContactDialog, type ScheduleFormValues } from "./schedule-contact-dialog";
import { toast } from "sonner";

function formatShortDate(fecha: string): string {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function extractDate(datetime: string | null): string | null {
  if (!datetime) return null;
  return datetime.slice(0, 10);
}

interface SeguimientoTabProps {
  pacienteId: string;
}

export function SeguimientoTab({ pacienteId }: SeguimientoTabProps) {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "ADMIN" || user?.role === "AGENT";
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: contacts = [], isLoading: loadingContacts } =
    useContacts(pacienteId);
  const { data: appointments = [], isLoading: loadingPsico } =
    usePatientAppointments(pacienteId);

  const createMutation = useMutation({
    mutationFn: (data: {
      patientId: string;
      agentId: string;
      type: string;
      status: string;
      purpose: string;
      scheduledAt: string;
      notes?: string;
    }) => contactsApi.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", pacienteId] });
      toast.success("Contacto agendado correctamente");
    },
    onError: (err: Error) => {
      toast.error("Error al agendar contacto", {
        description: err.message,
      });
    },
  });

  const isLoading = loadingContacts || loadingPsico;

  const completedContacts = contacts.filter((c) => c.status !== "SCHEDULED");
  const scheduledContacts = contacts.filter((c) => c.status === "SCHEDULED");
  const timeline = buildTimeline(contacts, appointments);

  const sortedCompleted = [...completedContacts].sort(
    (a, b) =>
      (b.completedAt ?? b.createdAt).localeCompare(
        a.completedAt ?? a.createdAt,
      ),
  );
  const lastContact = sortedCompleted[0];

  const nextScheduled = [...scheduledContacts].sort(
    (a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""),
  )[0];

  async function handleSchedule(values: ScheduleFormValues) {
    if (!user) return;
    const scheduledAt = `${values.date}T${values.time}:00`;
    await createMutation.mutateAsync({
      patientId: pacienteId,
      agentId: user.id,
      type: values.type,
      status: "SCHEDULED",
      purpose: values.purpose,
      scheduledAt,
      notes: values.notes || undefined,
    });
  }

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-50">
              <Phone className="size-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {completedContacts.length}
              </p>
              <p className="text-xs text-muted-foreground">
                contactos registrados
              </p>
            </div>
          </div>

          {lastContact && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <PhoneCall className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {formatShortDate(
                    extractDate(lastContact.completedAt) ??
                      extractDate(lastContact.createdAt) ??
                      "",
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  último contacto
                </p>
              </div>
            </div>
          )}

          {nextScheduled ? (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex size-8 items-center justify-center rounded-full bg-amber-50">
                <CalendarClock className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {formatShortDate(
                    extractDate(nextScheduled.scheduledAt) ?? "",
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  próximo contacto
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <CalendarClock className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  Sin programar
                </p>
                <p className="text-xs text-muted-foreground">
                  próximo contacto
                </p>
              </div>
            </div>
          )}
        </div>

        {canManage && (
          <Button
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => setDialogOpen(true)}
            disabled={isLoading}
          >
            <CalendarPlus className="size-4" />
            Agendar contacto
          </Button>
        )}
      </div>

      {/* Scheduled contact banner */}
      {nextScheduled && (
        <div className="w-full flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
          <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 shrink-0">
            <CalendarClock className="size-4 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">
              Contacto agendado para{" "}
              {formatShortDate(extractDate(nextScheduled.scheduledAt) ?? "")}
            </p>
            <p className="text-xs text-amber-700/80">
              Completá el contacto cuando se concrete
            </p>
          </div>
          <CalendarPlus className="size-4 text-amber-600 shrink-0" />
        </div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">
            Cargando historial...
          </p>
        </div>
      ) : timeline.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <p className="text-sm font-medium text-foreground">
            Sin historial de seguimiento
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Los contactos y sesiones de psicooncología aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="pt-2">
          {timeline.map((event, i) => (
            <TimelineEventCard
              key={event.id}
              event={event}
              isLast={i === timeline.length - 1}
            />
          ))}
        </div>
      )}

      <ScheduleContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSchedule}
        isPending={createMutation.isPending}
      />
    </div>
  );
}
