import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { UserRound } from "lucide-react"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import { Card, Item } from "@/components/ds/card"
import { InlineAlert } from "@/components/ds/inline-alert"
import { patientTabUrl } from "@/pages/pacientes/[id]/_lib/patient-tabs"

export function NeedsReassignmentPanel() {
  const query = useQuery({
    queryKey: ["psychooncology-needs-reassignment"],
    queryFn: () => psychooncologyAppointmentsApi.needsReassignment(),
    staleTime: 30_000,
  })
  const sessions = query.data ?? []
  if (query.isLoading || query.isError || sessions.length === 0) return null

  return (
    <Card title="Sesiones por reasignar" icon={UserRound} tone="amber">
      <InlineAlert tone="warning">{sessions.length === 1 ? "1 sesión" : `${sessions.length} sesiones`} de voluntarios que ya no están activos.</InlineAlert>
      <div className="mt-3 space-y-2">
        {sessions.map((session) => (
          <Item
            key={session.id}
            title={`Sesión ${session.sessionNumber}`}
            meta={`${session.volunteerFullName}${session.scheduledOn ? ` · ${session.scheduledOn}` : ""}`}
            actions={
              <Link
                to={patientTabUrl(session.patientId, "psicooncologia")}
                className="relative z-10 text-[13px] font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2"
              >
                Reprogramar
              </Link>
            }
          />
        ))}
      </div>
    </Card>
  )
}
