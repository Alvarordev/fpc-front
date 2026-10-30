import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import type { Volunteer } from "@/api/volunteers"
import { DataTable } from "@/components/ds/data-table"
import { SlidingTabs } from "@/components/ds/sliding-tabs"
import { VolunteerCommitmentBanner } from "@/components/volunteer-commitment-banner"
import { useAuthStore } from "@/store/auth-store"
import { matchesVolunteer, readVolunteerFilters, writeVolunteerFilters, type VolunteerTab } from "../_lib/volunteer-filters"
import { useVolunteerCalendar, useVolunteers } from "../_hooks/use-volunteers"
import { AvailabilityCalendar } from "./availability-calendar"
import { CalendarHeader } from "./calendar-header"
import { CalendarLegend } from "./calendar-legend"
import { NeedsReassignmentPanel } from "./needs-reassignment-panel"
import { SepaTeamTab } from "./sepa-team-tab"
import { VolunteerProfileDialog } from "./volunteer-profile-dialog"
import { volunteerColumns } from "./volunteers-columns"
import { VolunteersFilters } from "./volunteers-filters"

const NOW = new Date()

function weekRange(today = new Date()) {
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const start = new Date(today)
  start.setDate(today.getDate() + mondayOffset)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) }
}

export function VolunteersContent() {
  const role = useAuthStore((state) => state.user?.role)
  const [params, setParams] = useSearchParams()
  const filters = readVolunteerFilters(params)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [year, setYear] = useState(NOW.getFullYear())
  const [month, setMonth] = useState(NOW.getMonth())
  const monthRange = useMemo(
    () => ({
      from: new Date(year, month, 1).toISOString().slice(0, 10),
      to: new Date(year, month + 1, 0).toISOString().slice(0, 10),
    }),
    [year, month],
  )
  const week = useMemo(() => weekRange(), [])
  const { data: volunteers = [] } = useVolunteers()
  const monthCalendar = useVolunteerCalendar(monthRange.from, monthRange.to, true)
  const weekCalendar = useVolunteerCalendar(week.from, week.to, true)
  const visible = volunteers.filter((volunteer) => matchesVolunteer(volunteer, filters))
  const profile = volunteers.find((volunteer) => volunteer.id === profileId) ?? null
  const canEdit = role === "ADMIN" || role === "FOUNDATION"

  const slots = useMemo(
    () =>
      (monthCalendar.data?.volunteers ?? []).flatMap((volunteer) =>
        volunteer.availabilitySlots.map((slot) => ({ ...slot, volunteerId: volunteer.id })),
      ),
    [monthCalendar.data],
  )
  const patientNameByAvailabilityId = useMemo(() => {
    const result = new Map<string, string>()
    for (const volunteer of monthCalendar.data?.volunteers ?? []) {
      for (const appointment of volunteer.appointments) {
        if (appointment.status === "SCHEDULED") result.set(appointment.availabilityId, appointment.patientName)
      }
    }
    return result
  }, [monthCalendar.data])
  const patientsByVolunteer = useMemo(() => {
    const result: Record<string, number> = {}
    for (const volunteer of monthCalendar.data?.volunteers ?? []) {
      result[volunteer.id] = new Set(volunteer.appointments.map((item) => item.patientId)).size
    }
    return result
  }, [monthCalendar.data])
  const weekSlotsByVolunteer = useMemo(() => {
    const result: Record<string, number> = {}
    for (const volunteer of weekCalendar.data?.volunteers ?? []) {
      result[volunteer.id] = volunteer.availabilitySlots.filter((slot) => slot.status === "AVAILABLE").length
    }
    return result
  }, [weekCalendar.data])
  const columns = useMemo(
    () => volunteerColumns({ patientsByVolunteer, weekSlotsByVolunteer }),
    [patientsByVolunteer, weekSlotsByVolunteer],
  )
  const highlightedIds = filters.search.trim() || filters.status !== "active" ? visible.map((item) => item.id) : []

  function prevMonth() {
    if (month === 0) {
      setYear((value) => value - 1)
      setMonth(11)
    } else setMonth((value) => value - 1)
  }
  function nextMonth() {
    if (month === 11) {
      setYear((value) => value + 1)
      setMonth(0)
    } else setMonth((value) => value + 1)
  }

  return (
    <div className="font-ds space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Voluntarios</h1>
        <p className="mt-0.5 text-[13px] text-zinc-500">
          {visible.length === volunteers.length ? `${visible.length} voluntarios` : `${visible.length} de ${volunteers.length}`}
        </p>
      </header>

      <NeedsReassignmentPanel />
      <VolunteerCommitmentBanner volunteers={volunteers} />
      <VolunteersFilters volunteers={volunteers} />

      <SlidingTabs
        label="Secciones de voluntarios"
        value={filters.tab}
        onChange={(tab: VolunteerTab) => setParams(writeVolunteerFilters(params, { ...filters, tab }), { replace: true })}
        options={[
          { id: "calendario", label: "Calendario" },
          { id: "voluntarios", label: "Voluntarios" },
          { id: "sepa", label: "Equipo SEPA" },
        ]}
      />

      {filters.tab === "calendario" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CalendarHeader year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
            <CalendarLegend />
          </div>
          <AvailabilityCalendar
            year={year}
            month={month}
            slots={slots}
            volunteers={visible as Volunteer[]}
            highlightedIds={highlightedIds}
            patientNameByAvailabilityId={patientNameByAvailabilityId}
          />
        </div>
      )}

      {filters.tab === "voluntarios" && (
        <DataTable
          data={visible}
          columns={columns}
          isLoading={false}
          onRowClick={(volunteer) => setProfileId(volunteer.id)}
          emptyTitle="Ningún voluntario coincide"
          emptyBody="Prueba con otro nombre o cambia el estado."
        />
      )}

      {filters.tab === "sepa" && <SepaTeamTab />}

      {profile && (
        <VolunteerProfileDialog volunteer={profile} canEdit={canEdit} onClose={() => setProfileId(null)} />
      )}
    </div>
  )
}
