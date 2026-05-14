import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/auth-store";
import { useVolunteers, useAllSlots } from "../_hooks/use-volunteers";
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

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [year, setYear] = useState(NOW.getFullYear());
  const [month, setMonth] = useState(NOW.getMonth());

  const { data: volunteers = [] } = useVolunteers();
  const { data: slots = [] } = useAllSlots();

  const filtered = volunteers.filter((v) => {
    const fullName = `${v.firstName} ${v.lastName}`.toLowerCase();
    const matchesSearch =
      !search ||
      fullName.includes(search.toLowerCase()) ||
      v.specialty.toLowerCase().includes(search.toLowerCase());
    const matchesActive =
      activeFilter === null || v.isActive === activeFilter;
    return matchesSearch && matchesActive;
  });

  const highlightedIds =
    search || activeFilter !== null ? filtered.map((v) => v.id) : [];

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
        search={search}
        onSearchChange={setSearch}
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
