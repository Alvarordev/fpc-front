import { CheckCircle2, PhoneOff, XCircle, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { CheckList } from "@/components/ds/check-list"
import { Modal } from "@/components/ds/modal"

// Confirmación del cierre del seguimiento: qué se guarda al completar y qué se
// descarta al marcarlo como no contestó o cancelado.

export type FollowUpStatusAction = "COMPLETED" | "NO_ANSWER" | "CANCELLED"

const ACTIONS: Record<FollowUpStatusAction, { title: string; description: string; confirm: string; icon: LucideIcon }> = {
  COMPLETED: { title: "Completar seguimiento", description: "Se guardará todo lo registrado en este contacto:", confirm: "Completar", icon: CheckCircle2 },
  NO_ANSWER: { title: "Marcar como no contestó", description: "Se guardan la nota y los intentos. Los cambios de la ficha y las acciones en borrador se descartan.", confirm: "Marcar no contestó", icon: PhoneOff },
  CANCELLED: { title: "Cancelar seguimiento", description: "Se guarda la nota. Los cambios de la ficha y las acciones en borrador se descartan.", confirm: "Cancelar seguimiento", icon: XCircle },
}

export function FollowUpStatusConfirmationDialog({
  action,
  pending,
  isPending,
  onClose,
  onConfirm,
}: {
  action: FollowUpStatusAction | null
  /** Lo que se guardaría al completar, en frases cortas. */
  pending: string[]
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  if (!action) return null
  const a = ACTIONS[action]
  const completing = action === "COMPLETED"
  return (
    <Modal
      open
      onClose={() => !isPending && onClose()}
      icon={a.icon}
      title={a.title}
      description={a.description}
      footer={
        <>
          <Button onClick={onClose} disabled={isPending}>
            Volver
          </Button>
          <Button variant={completing ? "brand" : "dark"} onClick={onConfirm} disabled={isPending}>
            {isPending ? "Guardando…" : a.confirm}
          </Button>
        </>
      }
    >
      <Panel>
        {completing ? (
          <CheckList items={pending} empty="Solo se guardará el intento de contacto." />
        ) : (
          <p className="text-sm text-zinc-600">
            {pending.length ? `Se descartarán ${pending.length} ${pending.length === 1 ? "elemento" : "elementos"} en borrador.` : "No hay borradores que descartar."}
          </p>
        )}
      </Panel>
    </Modal>
  )
}
