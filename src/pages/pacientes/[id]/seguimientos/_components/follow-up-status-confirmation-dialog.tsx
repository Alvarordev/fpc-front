import { CheckCircle2, PhoneOff, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type FollowUpStatusAction = "COMPLETED" | "NO_ANSWER" | "CANCELLED"

const ACTION_DETAILS: Record<
  FollowUpStatusAction,
  {
    title: string
    description: string
    confirmLabel: string
    variant: "default" | "destructive"
    Icon: typeof CheckCircle2
  }
> = {
  COMPLETED: {
    title: "¿Completar seguimiento?",
    description:
      "Se guardarán las notas, los cambios de la ficha clínica y las acciones pendientes. Después de completar no podrás volver a editar esta ficha clínica desde este seguimiento.",
    confirmLabel: "Completar seguimiento",
    variant: "default",
    Icon: CheckCircle2,
  },
  NO_ANSWER: {
    title: "¿Marcar como no contestó?",
    description:
      "Se guardarán las notas del seguimiento, pero se descartarán los cambios clínicos y las acciones pendientes.",
    confirmLabel: "Marcar no contestó",
    variant: "destructive",
    Icon: PhoneOff,
  },
  CANCELLED: {
    title: "¿Cancelar seguimiento?",
    description:
      "Se guardarán las notas del seguimiento, pero se descartarán los cambios clínicos y las acciones pendientes.",
    confirmLabel: "Cancelar seguimiento",
    variant: "destructive",
    Icon: XCircle,
  },
}

export function FollowUpStatusConfirmationDialog({
  action,
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  action: FollowUpStatusAction | null
  open: boolean
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const details = action ? ACTION_DETAILS[action] : ACTION_DETAILS.COMPLETED
  const Icon = details.Icon

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Icon className="text-primary size-5" />
            {details.title}
          </DialogTitle>
          <DialogDescription>{details.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Volver
          </Button>
          <Button
            type="button"
            variant={details.variant}
            onClick={onConfirm}
            disabled={isPending || !action}
          >
            {isPending ? "Guardando..." : details.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
