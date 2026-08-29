import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/auth-store";
import { useVolunteers, useVolunteerCalendar } from "../_hooks/use-volunteers";
import { VolunteersToolbar } from "./volunteers-toolbar";
import { VolunteersTable } from "./volunteers-table";
import { getVolunteerColumns } from "./volunteers-columns";
import { AvailabilityCalendar } from "./availability-calendar";
import { CalendarHeader } from "./calendar-header";
import { CalendarLegend } from "./calendar-legend";
import { SepaTeamTab } from "./sepa-team-tab";

const NOW = new Date();

export function VolunteersContent() {
  const role = useAuthStore((s) => s.user?.role);
  const isReadOnly = role === "VOLUNTEER";

  const [volunteerId, setVolunteerId] = useState("all");
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [year, setYear] = useState(NOW.getFullYear());
  const [month, setMonth] = useState(NOW.getMonth());

  const range = useMemo(() => ({ from: new Date(year, month, 1).toISOString().slice(0, 10), to: new Date(year, month + 1, 0).toISOString().slice(0, 10) }), [year, month]);
  const { data: volunteers = [] } = useVolunteers();
  const { data: calendar } = useVolunteerCalendar(range.from, range.to);
  const slots = useMemo(() => (calendar?.volunteers ?? []).flatMap((volunteer) => volunteer.availabilitySlots.map((slot) => ({ ...slot, volunteerId: volunteer.id }))), [calendar]);

  const patientNameByAvailabilityId = useMemo(() => {
    const result = new Map<string, string>();
    for (const volunteer of calendar?.volunteers ?? []) {
      for (const appointment of volunteer.appointments) {
        if (appointment.status === "SCHEDULED") result.set(appointment.availabilityId, appointment.patientName);
      }
    }
    return result;
  }, [calendar]);

  const filtered = volunteers.filter((v) => {
    const matchesVolunteer = volunteerId === "all" || v.id === volunteerId;
    const matchesActive =
      activeFilter === null || v.isActive === activeFilter;
    return matchesVolunteer && matchesActive;
  });

  const highlightedIds =
    volunteerId !== "all" || activeFilter !== null
      ? filtered.map((v) => v.id)
      : [];

  function prevMonth() {
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Voluntarios
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {volunteers.length} voluntarios registrados
        </p>
        {isReadOnly && (
          <p className="text-xs text-muted-foreground mt-1">
            Vista de solo lectura.
          </p>
        )}
      </div>

      <VolunteersToolbar
        volunteerId={volunteerId}
        onVolunteerIdChange={setVolunteerId}
        volunteers={volunteers}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
      />

      <Tabs defaultValue="calendario">
        <TabsList className="mb-4">
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="voluntarios">Voluntarios</TabsTrigger>
          <TabsTrigger value="equipo-sepa">Equipo SEPA</TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="space-y-4">
          <div className="flex items-center justify-between">
            <CalendarHeader
              year={year}
              month={month}
              onPrev={prevMonth}
              onNext={nextMonth}
            />
            <CalendarLegend />
          </div>
          <AvailabilityCalendar
            year={year}
            month={month}
            slots={slots}
            volunteers={filtered}
            highlightedIds={highlightedIds}
            patientNameByAvailabilityId={patientNameByAvailabilityId}
          />
        </TabsContent>

        <TabsContent value="voluntarios">
          <VolunteersTable
            data={filtered}
            columns={getVolunteerColumns(slots)}
          />
        </TabsContent>

        <TabsContent value="equipo-sepa">
          <SepaTeamTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
