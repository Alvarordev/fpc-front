import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { followUpsApi } from "@/api/follow-ups"
import {
  patientsApi,
  type DeactivatePatientInput,
  type PatientDetailsResponse,
} from "@/api/patients"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthStore } from "@/store/auth-store"
import { PatientChangeLog } from "./patient-change-log"

const REASONS: { value: DeactivatePatientInput["reason"]; label: string }[] = [
  { value: "VOLUNTARY", label: "Retiro voluntario" },
  { value: "UNLOCATABLE", label: "No ubicable" },
  { value: "DECEASED", label: "Fallecido" },
  { value: "TRANSFERRED_OUT", label: "Transferido" },
]

const NO_FOLLOW_UP = "none"

export function PatientActivityActions({
  patient,
}: {
  patient: PatientDetailsResponse
}) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<DeactivatePatientInput["reason"]>("VOLUNTARY")
  const [deceasedAt, setDeceasedAt] = useState("")
  const [followUpId, setFollowUpId] = useState(NO_FOLLOW_UP)
  const canManage =
    patient.role === "PATIENT" &&
    (user?.role === "ADMIN" ||
      user?.role === "FOUNDATION" ||
      user?.role === "AGENT")
  const isInactive = patient.activityStatus === "INACTIVE"
  const followUpsQuery = useQuery({
    queryKey: ["patient-follow-ups", patient.id],
    queryFn: () => followUpsApi.list({ patientId: patient.id }),
    enabled: open && canManage,
  })
  const followUpItems = [
    { value: NO_FOLLOW_UP, label: "Sin seguimiento asociado" },
    ...(followUpsQuery.data ?? []).map((followUp) => ({
      value: followUp.id,
      label: `${new Date(followUp.scheduledAt ?? followUp.createdAt).toLocaleDateString("es-PE")} · ${followUp.status}`,
    })),
  ]

  const mutation = useMutation({
    mutationFn: async () => {
      const linked = followUpId === NO_FOLLOW_UP ? undefined : followUpId
      if (isInactive) {
        return patientsApi.reactivate(patient.id, linked ? { followUpId: linked } : {})
      }
      return patientsApi.deactivate(patient.id, {
        reason,
        ...(reason === "DECEASED" && deceasedAt ? { deceasedAt } : {}),
        ...(linked ? { followUpId: linked } : {}),
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["patient-profile", patient.id] }),
        queryClient.invalidateQueries({ queryKey: ["patients"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-change-log", patient.id] }),
      ])
      setOpen(false)
      toast.success(isInactive ? "Paciente reactivado" : "Paciente dado de baja")
    },
    onError: (error: Error) =>
      toast.error(isInactive ? "No se pudo reactivar" : "No se pudo dar de baja", {
        description: error.message,
      }),
  })

  if (!canManage) return null

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => setOpen(true)}
      >
        {isInactive ? "Reactivar" : "Dar de baja"}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !mutation.isPending && setOpen(next)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isInactive ? "Reactivar paciente" : "Dar de baja al paciente"}
            </DialogTitle>
            <DialogDescription>
              {isInactive
                ? "El paciente vuelve a la actividad. Puedes asociar el seguimiento en el que regresó."
                : "Elige el motivo. Si falleció, indica la fecha. El seguimiento es opcional."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!isInactive && reason === "DECEASED" && !deceasedAt) {
                toast.error("Indica la fecha de fallecimiento")
                return
              }
              mutation.mutate()
            }}
          >
            {!isInactive && (
              <div className="space-y-1.5">
                <Label>Motivo</Label>
                <Select
                  items={REASONS}
                  value={reason}
                  onValueChange={(value) =>
                    value && setReason(value as DeactivatePatientInput["reason"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!isInactive && reason === "DECEASED" && (
              <div className="space-y-1.5">
                <Label htmlFor="deceased-at">Fecha de fallecimiento</Label>
                <Input
                  id="deceased-at"
                  type="date"
                  value={deceasedAt}
                  onChange={(event) => setDeceasedAt(event.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Seguimiento</Label>
              <Select
                items={followUpItems}
                value={followUpId}
                onValueChange={(value) => value && setFollowUpId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {followUpItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <PatientChangeLog
              patientId={patient.id}
              title="Historial de bajas y reactivaciones"
              description="Sale del historial de cambios del estado de actividad. No hay un endpoint aparte."
              onlyActivityStatus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Volver
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Guardando..."
                  : isInactive
                    ? "Confirmar reactivación"
                    : "Confirmar baja"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
