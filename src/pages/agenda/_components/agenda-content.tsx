import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVolunteerProfile } from "@/hooks/use-volunteer-profile";
import { useAgenda } from "../_hooks/use-agenda";
import { AgendaSessionCard } from "./agenda-session-card";
import { AgendaSessionResultSheet } from "./agenda-session-result-sheet";
import { AgendaSessionResultDialog } from "./agenda-session-result-dialog";
import type { PsychooncologyAppointment } from "@/types";

type Filter = "proximas" | "pasadas" | "todas";

const TODAY = new Date().toISOString().slice(0, 10);

function isTodayAppointment(iso: string): boolean {
  return iso.slice(0, 10) === TODAY;
}

function filterAppointments(
  appointments: PsychooncologyAppointment[],
  filter: Filter,
): PsychooncologyAppointment[] {
  return appointments
    .filter((a) => {
      const date = a.scheduledAt.slice(0, 10);
      if (filter === "proximas") return date >= TODAY;
      if (filter === "pasadas") return date < TODAY;
      return true;
    })
    .sort((a, b) => {
      if (filter === "pasadas")
        return b.scheduledAt.localeCompare(a.scheduledAt);
      return a.scheduledAt.localeCompare(b.scheduledAt);
    });
}

export function AgendaContent() {
  const { volunteerId, isLoading: loadingProfile } =
    useVolunteerProfile();
  const isMobile = useIsMobile();

  const [filter, setFilter] = useState<Filter>("proximas");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] =
    useState<PsychooncologyAppointment | null>(null);

  const {
    appointments,
    patients,
    isLoading: loadingAgenda,
  } = useAgenda(volunteerId);

  const todayAppointments = appointments.filter((a) =>
    isTodayAppointment(a.scheduledAt),
  );
  const filtered = filterAppointments(appointments, filter);

  function openResultSheet(appointment: PsychooncologyAppointment) {
    setActiveAppointment(appointment);
    setSheetOpen(true);
  }

  const activePatientName = activeAppointment
    ? patients.get(activeAppointment.patientId)?.fullName ??
      "Paciente desconocido"
    : "";

  const activePatientId = activeAppointment?.patientId ?? "";

  if (loadingProfile || loadingAgenda) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Cargando agenda...
        </p>
      </div>
    );
  }

  if (!volunteerId) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Tu cuenta no está vinculada a un perfil de voluntario.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Mi Agenda
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {appointments.length} sesiones en total
        </p>
      </div>

      {/* Today's sessions */}
      <div className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Hoy</h2>
        {todayAppointments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Sin sesiones hoy.
          </p>
        ) : (
          <div className="space-y-2">
            {todayAppointments.map((a) => (
              <AgendaSessionCard
                key={a.id}
                appointment={a}
                patientName={
                  patients.get(a.patientId)?.fullName ??
                  "Paciente desconocido"
                }
                isToday
                onComplete={openResultSheet}
              />
            ))}
          </div>
        )}
      </div>

      {/* All sessions with filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-sm font-semibold">
            Sesiones
          </h2>
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as Filter)}
          >
            <TabsList className="h-8">
              <TabsTrigger
                value="proximas"
                className="h-6 px-3 text-xs"
              >
                Próximas
              </TabsTrigger>
              <TabsTrigger
                value="pasadas"
                className="h-6 px-3 text-xs"
              >
                Pasadas
              </TabsTrigger>
              <TabsTrigger
                value="todas"
                className="h-6 px-3 text-xs"
              >
                Todas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay sesiones para mostrar.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => (
              <AgendaSessionCard
                key={a.id}
                appointment={a}
                patientName={
                  patients.get(a.patientId)?.fullName ??
                  "Paciente desconocido"
                }
                onComplete={openResultSheet}
              />
            ))}
          </div>
        )}
      </div>

      {isMobile ? (
        <AgendaSessionResultSheet
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) setActiveAppointment(null);
          }}
          appointment={activeAppointment}
          patientName={activePatientName}
          patientId={activePatientId}
          volunteerId={volunteerId}
        />
      ) : (
        <AgendaSessionResultDialog
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) setActiveAppointment(null);
          }}
          appointment={activeAppointment}
          patientName={activePatientName}
          patientId={activePatientId}
          volunteerId={volunteerId}
        />
      )}
    </div>
  );
}
