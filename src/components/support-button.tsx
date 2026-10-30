import { useState } from "react"
import { MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ds/button"
import { useAuthStore } from "@/store/auth-store"
import { CreateTicketModal } from "@/pages/tickets/_components/create-ticket-modal"
import { useSupportTickets } from "@/pages/tickets/_hooks/use-support-tickets"

/** Botón de la barra superior para abrir un ticket de soporte. */
export function SupportButton() {
  const role = useAuthStore((s) => s.user?.role)
  const [open, setOpen] = useState(false)
  const canReport = role === "ADMIN" || role === "FOUNDATION" || role === "AGENT"
  const { data: tickets = [] } = useSupportTickets(canReport)
  const hasUpdates = tickets.some((t) => t.hasUpdates)

  if (!canReport) return null

  return (
    <>
      <Button
        icon={MessageSquarePlus}
        aria-label={hasUpdates ? "Reportar un problema (tienes tickets con novedades)" : "Reportar un problema"}
        title="Reportar un problema o pedir un cambio"
        onClick={() => setOpen(true)}
        className="font-ds relative focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        <span className="hidden sm:inline">Reportar</span>
        {hasUpdates && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-red-600 ring-2 ring-white" />}
      </Button>
      <CreateTicketModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
