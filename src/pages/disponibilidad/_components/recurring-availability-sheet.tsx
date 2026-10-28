import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { volunteersApi } from "@/api/volunteers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const WEEKDAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
]

function endOfMonth() {
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const month = String(last.getMonth() + 1).padStart(2, "0")
  const day = String(last.getDate()).padStart(2, "0")
  return `${last.getFullYear()}-${month}-${day}`
}

export function RecurringAvailabilitySheet({
  open,
  onOpenChange,
  volunteerId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  volunteerId: string
}) {
  const queryClient = useQueryClient()
  const [days, setDays] = useState<number[]>([1, 3])
  const [startTime, setStartTime] = useState("15:00")
  const [hours, setHours] = useState(2)
  const [endDate, setEndDate] = useState(endOfMonth)
  const createRecurring = useMutation({
    mutationFn: () =>
      volunteersApi.createRecurringAvailability(volunteerId, {
        daysOfWeek: days,
        startTime,
        hours,
        endDate,
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["myAvailability", volunteerId] })
      toast.success(
        `${result.created.length} bloque${result.created.length === 1 ? "" : "s"} de 1 hora creado${result.created.length === 1 ? "" : "s"}` +
          (result.skipped ? `. ${result.skipped} se omitieron porque ya existían.` : "."),
      )
      onOpenChange(false)
    },
    onError: (error: Error) =>
      toast.error("No se pudo crear la disponibilidad recurrente", {
        description: error.message,
      }),
  })

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Disponibilidad recurrente</SheetTitle>
          <SheetDescription>
            Los días elegidos se parten en bloques de 1 hora, desde la hora de inicio y hasta la fecha fin.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <div className="space-y-2">
            <Label>Días</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const selected = days.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={
                      selected
                        ? "rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        : "rounded-full border px-3 py-1 text-xs text-muted-foreground"
                    }
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="recurring-start">Hora de inicio</Label>
              <Input
                id="recurring-start"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recurring-hours">Cantidad de horas</Label>
              <Input
                id="recurring-hours"
                type="number"
                min={1}
                max={12}
                value={hours}
                onChange={(event) => setHours(Number(event.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recurring-end">Hasta</Label>
            <Input
              id="recurring-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>
        <SheetFooter>
          <Button
            type="button"
            disabled={days.length === 0 || !startTime || hours < 1 || !endDate || createRecurring.isPending}
            onClick={() => createRecurring.mutate()}
          >
            {createRecurring.isPending ? "Creando..." : "Crear bloques"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
