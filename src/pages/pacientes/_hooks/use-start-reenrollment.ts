import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { followUpsApi } from "@/api/follow-ups"

/**
 * Reenrolar a un paciente inactivo: crea un seguimiento de reenrolamiento para
 * ahora y lleva a su pantalla, donde se registran el motivo y los datos. Es el
 * único camino para reactivar (el backend ya no tiene reactivación directa).
 * Admin y fundación indican el agente responsable; el agente se asigna solo.
 */
export function useStartReenrollment(patientId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (agentId?: string) =>
      followUpsApi.create({
        agentId,
        subjectPatientId: patientId,
        interlocutorId: patientId,
        type: "CALL",
        purpose: "REENROLLMENT",
        scheduledAt: new Date().toISOString(),
      }),
    onSuccess: async (followUp) => {
      await queryClient.invalidateQueries({ queryKey: ["patient-follow-ups", patientId] })
      navigate(`/pacientes/${patientId}/seguimientos/${followUp.id}`)
    },
    onError: (error: Error) => toast.error("No se pudo iniciar el reenrolamiento", { description: error.message }),
  })
}
