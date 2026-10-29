import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import { Button } from "@/components/ds/button"

export function UnmanagedNoShowsBanner({
  patientId,
  canManage,
}: {
  patientId: string
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["psychooncology-unmanaged-no-shows", patientId],
    queryFn: () => psychooncologyAppointmentsApi.unmanagedNoShows(patientId),
  })
  const markManaged = useMutation({
    mutationFn: (id: string) => psychooncologyAppointmentsApi.markNoShowManaged(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["psychooncology-unmanaged-no-shows", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["psychooncology-appointments", patientId],
        }),
      ])
      toast.success("Inasistencia marcada como gestionada")
    },
    onError: (error: Error) =>
      toast.error("No se pudo marcar la inasistencia", { description: error.message }),
  })

  if (!query.data?.hasUnmanagedNoShows) return null
  const ids = query.data.appointmentIds.flat()

  return (
    <div className="rounded-[20px] bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200/70">
      <p className="font-medium">
        {query.data.count} inasistencia{query.data.count === 1 ? "" : "s"} sin gestionar
      </p>
      <p className="mt-1 text-xs">
        Hay sesiones en las que la persona no se presentó y nadie hizo el seguimiento.
      </p>
      {canManage && (
        <div className="mt-2 flex flex-wrap gap-2">
          {ids.map((id) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant="outline"
              
              disabled={markManaged.isPending}
              onClick={() => markManaged.mutate(id)}
            >
              Marcar gestionada
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
