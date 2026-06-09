import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/auth-store";
import { useVolunteers, useAllSlots, useAllAppointments, usePatients } from "../_hooks/use-volunteers";
import { VolunteersToolbar } from "./volunteers-toolbar";
import { VolunteersTable } from "./volunteers-table";
import { getVolunteerColumns } from "./volunteers-columns";
import { AvailabilityCalendar } from "./availability-calendar";
import { CalendarHeader } from "./calendar-header";
import { CalendarLegend } from "./calendar-legend";

const NOW = new Date();

export function VolunteersContent() {
  const role = useAuthStore((s) => s.user?.role);
  const isReadOnly = role === "VOLUNTEER";

  const [volunteerId, setVolunteerId] = useState("all");
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [year, setYear] = useState(NOW.getFullYear());
  const [month, setMonth] = useState(NOW.getMonth());

  const { data: volunteers = [] } = useVolunteers();
  const { data: slots = [] } = useAllSlots();
  const { data: appointments = [] } = useAllAppointments();
  const { data: patients = [] } = usePatients();

  const patientNameByAvailabilityId = useMemo(() => {
    const patientMap = new Map(patients.map((p) => [p.id, p.fullName]));
    const result = new Map<string, string>();
    for (const appt of appointments) {
      if (appt.status === "SCHEDULED") {
        const name = patientMap.get(appt.patientId);
        if (name) result.set(appt.availabilityId, name);
      }
    }
    return result;
  }, [appointments, patients]);

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
      </Tabs>
    </div>
  );
}
