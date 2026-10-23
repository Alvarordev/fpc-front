import { useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/store/auth-store"
import { VolunteerCommitmentBanner } from "@/components/volunteer-commitment-banner"
import { useVolunteers, useVolunteerCalendar } from "../_hooks/use-volunteers"
import { VolunteersToolbar } from "./volunteers-toolbar"
import { VolunteersTable } from "./volunteers-table"
import { getVolunteerColumns } from "./volunteers-columns"
import { AvailabilityCalendar } from "./availability-calendar"
import { CalendarHeader } from "./calendar-header"
import { CalendarLegend } from "./calendar-legend"
import { VolunteerProfileDialog } from "./volunteer-profile-dialog"

const NOW = new Date()

export function VolunteersContent() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role

  const [volunteerId, setVolunteerId] = useState("all")
  const [profileVolunteerId, setProfileVolunteerId] = useState<string | null>(
    null,
  )
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null)
  const [year, setYear] = useState(NOW.getFullYear())
  const [month, setMonth] = useState(NOW.getMonth())

  const range = useMemo(
    () => ({
      from: new Date(year, month, 1).toISOString().slice(0, 10),
      to: new Date(year, month + 1, 0).toISOString().slice(0, 10),
    }),
    [year, month],
  )
  const { data: volunteers = [] } = useVolunteers()
  const { data: calendar } = useVolunteerCalendar(range.from, range.to, true)
  const visibleVolunteers = volunteers
  const profileVolunteer =
    visibleVolunteers.find(
      (volunteer) => volunteer.id === profileVolunteerId,
    ) ?? null
  const slots = useMemo(
    () =>
      (calendar?.volunteers ?? []).flatMap((volunteer) =>
        volunteer.availabilitySlots.map((slot) => ({
          ...slot,
          volunteerId: volunteer.id,
        })),
      ),
    [calendar],
  )

  const patientNameByAvailabilityId = useMemo(() => {
    const result = new Map<string, string>()
    for (const volunteer of calendar?.volunteers ?? []) {
      for (const appointment of volunteer.appointments) {
        if (appointment.status === "SCHEDULED")
          result.set(appointment.availabilityId, appointment.patientName)
      }
    }
    return result
  }, [calendar])

  const filtered = visibleVolunteers.filter((v) => {
    const matchesVolunteer = volunteerId === "all" || v.id === volunteerId
    const matchesActive = activeFilter === null || v.isActive === activeFilter
    return matchesVolunteer && matchesActive
  })

  const highlightedIds =
    volunteerId !== "all" || activeFilter !== null
      ? filtered.map((v) => v.id)
      : []

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Voluntarios
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {visibleVolunteers.length} voluntario
          {visibleVolunteers.length === 1 ? "" : "s"} registrado
          {visibleVolunteers.length === 1 ? "" : "s"}
        </p>
      </div>

      <VolunteerCommitmentBanner volunteers={volunteers} />

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
            onVolunteerClick={(volunteer) =>
              setProfileVolunteerId(volunteer.id)
            }
          />
        </TabsContent>
      </Tabs>

      {profileVolunteer && (
        <VolunteerProfileDialog
          key={profileVolunteer.id}
          volunteer={profileVolunteer}
          canEdit={role === "ADMIN"}
          open
          onOpenChange={(open) => {
            if (!open) setProfileVolunteerId(null)
          }}
        />
      )}
    </div>
  )
}
