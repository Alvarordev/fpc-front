import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import { patientTabUrl } from "@/pages/pacientes/[id]/_lib/patient-tabs"

export function NeedsReassignmentPanel() {
  const query = useQuery({
    queryKey: ["psychooncology-needs-reassignment"],
    queryFn: () => psychooncologyAppointmentsApi.needsReassignment(),
    staleTime: 30_000,
  })
  const sessions = query.data ?? []

  return (
    <section className="rounded-xl border p-4">
      <h2 className="text-sm font-semibold">Sesiones por reasignar</h2>
      <p className="text-muted-foreground mt-0.5 text-xs">
        Sesiones pendientes de voluntarios que ya no están activos.
      </p>
      {query.isLoading ? (
        <p className="text-muted-foreground mt-3 text-sm">Cargando sesiones...</p>
      ) : query.isError ? (
        <p className="text-destructive mt-3 text-sm">No se pudo cargar la lista.</p>
      ) : sessions.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">No hay sesiones por reasignar.</p>
      ) : (
        <ul className="mt-3 divide-y">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div>
                <p className="font-medium">Sesión {session.sessionNumber}</p>
                <p className="text-muted-foreground text-xs">
                  {session.volunteerFullName}
                  {session.scheduledOn ? ` · ${session.scheduledOn}` : ""}
                </p>
              </div>
              <Link
                to={patientTabUrl(session.patientId, "psicooncologia")}
                className="text-primary text-xs underline"
              >
                Reprogramar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
