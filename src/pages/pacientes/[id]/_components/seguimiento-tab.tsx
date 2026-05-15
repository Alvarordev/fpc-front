import { useNavigate } from "react-router-dom";
import { Phone, CalendarClock, PhoneCall, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useContacts } from "../_hooks/use-contacts";
import { usePatientAppointments } from "../_hooks/use-appointments";
import { buildTimeline } from "../_utils/timeline";
import { TimelineEventCard } from "./timeline-event-card";
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
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "ADMIN" || user?.role === "AGENT";

  const { data: contacts = [], isLoading: loadingContacts } =
    useContacts(pacienteId);
  const { data: appointments = [], isLoading: loadingPsico } =
    usePatientAppointments(pacienteId);

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

  function handleAgendar() {
    if (scheduledContacts.length > 0) {
      toast.error("Ya existe un contacto agendado", {
        description:
          "Completá o marcá como cancelado el contacto actual antes de agendar otro.",
      });
      return;
    }
    navigate(`/pacientes/${pacienteId}/contacto`);
  }

  function goToContact(contactId: string) {
    navigate(`/pacientes/${pacienteId}/contacto?contactId=${contactId}`);
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
            <button
              onClick={() => goToContact(nextScheduled.id)}
              className="flex items-center gap-2 text-sm group cursor-pointer"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-amber-50 group-hover:bg-amber-100 transition-colors">
                <CalendarClock className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground group-hover:text-amber-700 transition-colors">
                  {formatShortDate(
                    extractDate(nextScheduled.scheduledAt) ?? "",
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  próximo contacto — clic para completar
                </p>
              </div>
            </button>
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
            onClick={handleAgendar}
            disabled={isLoading}
          >
            <CalendarPlus className="size-4" />
            Agendar contacto
          </Button>
        )}
      </div>

      {/* Scheduled contact banner — clickeable para completar */}
      {nextScheduled && (
        <button
          onClick={() => goToContact(nextScheduled.id)}
          className="w-full flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 shrink-0">
            <CalendarClock className="size-4 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">
              Contacto agendado para{" "}
              {formatShortDate(extractDate(nextScheduled.scheduledAt) ?? "")}
            </p>
            <p className="text-xs text-amber-700/80">
              Clic acá para registrar el contacto cuando se concrete
            </p>
          </div>
          <CalendarPlus className="size-4 text-amber-600 shrink-0" />
        </button>
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
        <div className="space-y-3 pt-2">
          {timeline.map((event) => (
            <TimelineEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
