import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { historicalRecordsApi } from "@/api/historical-records"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function useDeleteHistoricalFollowUp(patientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (followUpId: string) =>
      historicalRecordsApi.deleteFollowUp(followUpId),
    onSuccess: async (_void, followUpId) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patient-timeline", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-profile", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-follow-ups", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-addresses", patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-social-notes", patientId],
        }),
      ])
      queryClient.removeQueries({ queryKey: ["follow-up", followUpId] })
      toast.success("Seguimiento histórico eliminado")
    },
    onError: (cause: Error) => {
      toast.error("No se pudo eliminar el seguimiento histórico", {
        description: cause.message,
      })
    },
  })
}

export function HistoricalFollowUpDeleteDialog({
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent showCloseButton={!isPending} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Trash2 className="text-destructive size-5" />
            ¿Eliminar este seguimiento?
          </DialogTitle>
          <DialogDescription>
            Se borrará el seguimiento y los datos clínicos cargados en él
            (diagnósticos, tratamientos, síntomas y el resto de la ficha). Esta
            acción no se puede deshacer. Los demás seguimientos del paciente no
            se modifican.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Conservar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Eliminar seguimiento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
