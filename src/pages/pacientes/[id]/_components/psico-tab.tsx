import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BrainCircuit, CalendarPlus, PhoneCall, Video } from "lucide-react"
import { toast } from "sonner"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import { volunteersApi } from "@/api/volunteers"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthStore } from "@/store/auth-store"
import { SchedulePsychooncologyDialog } from "./schedule-psychooncology-dialog"

interface PsicoTabProps {
  pacienteId: string
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No contestó",
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PsicoTab({ pacienteId }: PsicoTabProps) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const canSchedule = user?.role === "ADMIN" || user?.role === "FOUNDATION" || user?.role === "AGENT" || user?.role === "VOLUNTEER"
  const canManage = user?.role === "ADMIN" || user?.role === "FOUNDATION" || user?.role === "AGENT"
  const appointmentsQuery = useQuery({
    queryKey: ["psychooncology-appointments"],
    queryFn: () => psychooncologyAppointmentsApi.list(),
  })
  const volunteersQuery = useQuery({
    queryKey: ["volunteers"],
    queryFn: volunteersApi.list,
    staleTime: 300_000,
  })
  const createMutation = useMutation({
    mutationFn: psychooncologyAppointmentsApi.create,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["psychooncology-appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-timeline", pacienteId] }),
      ])
      toast.success("Cita de psicooncología agendada")
    },
    onError: (error: Error) => toast.error("No se pudo agendar la cita", { description: error.message }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "COMPLETED" | "NO_ANSWER" }) =>
      psychooncologyAppointmentsApi.update(id, { status }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["psychooncology-appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-timeline", pacienteId] }),
      ])
      toast.success("Cita actualizada")
    },
    onError: (error: Error) => toast.error("No se pudo actualizar la cita", { description: error.message }),
  })
  const cancelMutation = useMutation({
    mutationFn: psychooncologyAppointmentsApi.cancel,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["psychooncology-appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-timeline", pacienteId] }),
      ])
      toast.success("Cita cancelada")
    },
    onError: (error: Error) => toast.error("No se pudo cancelar la cita", { description: error.message }),
  })

  const appointments = (appointmentsQuery.data ?? [])
    .filter((appointment) => appointment.patientId === pacienteId)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const ownVolunteerId = user?.role === "VOLUNTEER"
    ? volunteersQuery.data?.find((volunteer) => volunteer.userId === user.id)?.id
    : undefined

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Sesiones de psicooncología</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{appointments.length} cita{appointments.length === 1 ? "" : "s"} registradas</p>
        </div>
        {canSchedule && (
          <Button size="sm" className="gap-1.5" onClick={() => setScheduleOpen(true)}>
            <CalendarPlus className="size-4" />Agendar cita
          </Button>
        )}
      </div>

      {appointmentsQuery.isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Cargando citas...</div>
      ) : appointments.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
          <BrainCircuit className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">Sin citas de psicooncología</p>
          <p className="text-xs text-muted-foreground">Podés crear una cita independiente o vincularla desde un seguimiento.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {appointments.map((appointment) => {
            const volunteer = volunteersQuery.data?.find((item) => item.id === appointment.volunteerId)
            const isScheduled = appointment.status === "SCHEDULED"
            const canMarkNoAnswer = user?.role === "VOLUNTEER" || canManage

            return (
              <Card key={appointment.id} size="sm">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {appointment.modality === "CALL" ? <PhoneCall className="size-4 text-purple-600" /> : <Video className="size-4 text-purple-600" />}
                      <div>
                        <p className="font-medium">Sesión {appointment.sessionNumber}</p>
                        <p className="text-xs text-muted-foreground">{volunteer ? `${volunteer.firstName} ${volunteer.lastName}` : "Psicooncólogo"}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{statusLabels[appointment.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(appointment.scheduledAt)}</p>
                  <p className="text-xs text-muted-foreground">{appointment.followUpId ? "Vinculada a un seguimiento" : "Cita independiente"}</p>
                  {isScheduled && (
                    <div className="flex flex-wrap gap-2">
                      {canManage && <Button size="sm" onClick={() => updateMutation.mutate({ id: appointment.id, status: "COMPLETED" })}>Completar</Button>}
                      {canMarkNoAnswer && <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: appointment.id, status: "NO_ANSWER" })}>No contestó</Button>}
                      {canManage && <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(appointment.id)}>Cancelar</Button>}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <SchedulePsychooncologyDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        patientId={pacienteId}
        ownVolunteerId={ownVolunteerId}
        isPending={createMutation.isPending}
        onSubmit={async (input) => {
          await createMutation.mutateAsync(input)
        }}
      />
    </div>
  )
}
