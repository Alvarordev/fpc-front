import { useQuery } from "@tanstack/react-query"
import { volunteersApi } from "@/api/volunteers"
import { volunteerCalendarApi } from "@/api/volunteer-calendar"

export function useVolunteers() {
  return useQuery({ queryKey: ["volunteers"], queryFn: volunteersApi.list, staleTime: 60_000 })
}

export function useVolunteerCalendar(from: string, to: string) {
  return useQuery({ queryKey: ["volunteer-calendar", from, to], queryFn: () => volunteerCalendarApi.list(from, to), staleTime: 30_000 })
}
