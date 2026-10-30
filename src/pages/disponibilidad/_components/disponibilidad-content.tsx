import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { volunteersApi } from "@/api/volunteers"
import { Button } from "@/components/ui/button"
import { VolunteerCommitmentBanner } from "@/components/volunteer-commitment-banner"
import { useVolunteerProfile } from "@/hooks/use-volunteer-profile"
import { CalendarHeader } from "@/pages/voluntarios/_components/calendar-header"
import { useMySlots, useDeleteSlot } from "../_hooks/use-disponibilidad"
import { AddAvailabilitySheet } from "./add-availability-sheet"
import { DisponibilidadCalendar } from "./disponibilidad-calendar"
import { DisponibilidadConsentNotice } from "./disponibilidad-consent-notice"
import { RecurringAvailabilitySheet } from "./recurring-availability-sheet"

const NOW = new Date()
const CURRENT_YEAR = NOW.getFullYear()
const CURRENT_MONTH = NOW.getMonth()

export function DisponibilidadContent() {
  const {
    volunteer,
    volunteerId,
    isLoading: loadingProfile,
  } = useVolunteerProfile()

  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [recurringOpen, setRecurringOpen] = useState(false)
  const [pendingRecurrenceId, setPendingRecurrenceId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined,
  )
  const [selectedWeekday, setSelectedWeekday] = useState<number | undefined>(
    undefined,
  )

  const { data: slots = [] } = useMySlots(volunteerId)
  const deleteSlot = useDeleteSlot(volunteerId ?? "")
  const deleteRecurrence = useMutation({
    mutationFn: (recurrenceId: string) =>
      volunteersApi.deleteRecurrence(volunteerId ?? "", recurrenceId),
    onSuccess: async (result) => {
      setPendingRecurrenceId(null)
      await queryClient.invalidateQueries({ queryKey: ["myAvailability", volunteerId] })
      toast.success(
        `Se quitaron ${result.removed} bloques libres. ${result.keptReserved} ocupados se conservaron.`,
      )
    },
    onError: (error: Error) =>
      toast.error("No se pudo quitar la recurrencia", { description: error.message }),
  })
  const recurrenceIds = [
    ...new Set(
      slots
        .filter((slot) => slot.status === "AVAILABLE" && slot.recurrenceId)
        .map((slot) => slot.recurrenceId as string),
    ),
  ]

  const isCurrentMonth = year === CURRENT_YEAR && month === CURRENT_MONTH

  function prevMonth() {
    if (isCurrentMonth) return
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

  function handleDayClick(date: Date) {
    setSelectedDate(date.toISOString().slice(0, 10))
    setSelectedWeekday(date.getDay())
    setSheetOpen(true)
  }

  function handleAddClick() {
    setSelectedDate(undefined)
    setSelectedWeekday(undefined)
    setSheetOpen(true)
  }

  function handleSlotDelete(slotId: string) {
    if (!volunteerId) return
    deleteSlot.mutate(slotId)
  }

  const availableCount = slots.filter((s) => s.status === "AVAILABLE").length
  const reservedCount = slots.filter((s) => s.status === "RESERVED").length

  if (loadingProfile) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-muted-foreground text-sm">Cargando perfil...</p>
      </div>
    )
  }

  if (!volunteerId) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Tu cuenta no está vinculada a un perfil de voluntario.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Disponibilidad
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {availableCount} disponible
            {availableCount !== 1 ? "s" : ""}
            {reservedCount > 0 &&
              ` · ${reservedCount} reservado${reservedCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => setRecurringOpen(true)}
          >
            Recurrente
          </Button>
          <Button size="sm" className="shrink-0 gap-1.5" onClick={handleAddClick}>
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>
      </div>

      <VolunteerCommitmentBanner
        volunteers={volunteer ? [volunteer] : []}
        title="Tu acta de compromiso está por vencer"
      />

      <DisponibilidadConsentNotice />

      <div className="flex items-center justify-between">
        <CalendarHeader
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
      </div>

      <DisponibilidadCalendar
        year={year}
        month={month}
        slots={slots}
        onDayClick={handleDayClick}
        onSlotDelete={handleSlotDelete}
      />

      {recurrenceIds.length > 0 && (
        <section className="rounded-xl border p-4">
          <h2 className="text-sm font-semibold">Recurrencias</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Quitar una serie borra solo los bloques libres futuros. Los bloques ocupados se conservan.
          </p>
          <ul className="mt-3 space-y-2">
            {recurrenceIds.map((recurrenceId) => (
              <li key={recurrenceId} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {slots.filter((slot) => slot.recurrenceId === recurrenceId && slot.status === "AVAILABLE").length}{" "}
                  bloques libres
                </span>
                {pendingRecurrenceId === recurrenceId ? (
                  <span className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={deleteRecurrence.isPending}
                      onClick={() => deleteRecurrence.mutate(recurrenceId)}
                    >
                      Confirmar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPendingRecurrenceId(null)}
                    >
                      Cancelar
                    </Button>
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingRecurrenceId(recurrenceId)}
                  >
                    Quitar serie
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <AddAvailabilitySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        volunteerId={volunteerId}
        defaultDate={selectedDate}
        selectedWeekday={selectedWeekday}
      />
      <RecurringAvailabilitySheet
        open={recurringOpen}
        onOpenChange={setRecurringOpen}
        volunteerId={volunteerId}
      />
    </div>
  )
}
