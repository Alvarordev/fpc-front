import { useQuery } from "@tanstack/react-query"
import { changeLogApi, type ChangeLogEntry } from "@/api/change-log"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  changeLogContextLabels,
  describeChangeLogEntry,
  isActivityStatusChange,
} from "@/lib/change-log-labels"
import { useAuthStore } from "@/store/auth-store"

function canSeeChangeLog(role: string | undefined) {
  return role === "ADMIN" || role === "FOUNDATION" || role === "AGENT"
}

function groupChanges(items: ChangeLogEntry[]) {
  const groups = new Map<string, ChangeLogEntry[]>()
  for (const item of items) {
    const current = groups.get(item.changeSetId) ?? []
    current.push(item)
    groups.set(item.changeSetId, current)
  }
  return [...groups.values()].sort((a, b) =>
    b[0].changedAt.localeCompare(a[0].changedAt),
  )
}

export function PatientChangeLog({
  patientId,
  followUpId,
  title = "Historial de cambios",
  description = "Quién cambió qué, y el valor anterior y el nuevo.",
  onlyActivityStatus = false,
}: {
  patientId: string
  followUpId?: string
  title?: string
  description?: string
  onlyActivityStatus?: boolean
}) {
  const role = useAuthStore((state) => state.user?.role)
  const query = useQuery({
    queryKey: ["patient-change-log", patientId, followUpId ?? null],
    queryFn: () =>
      changeLogApi.list(patientId, {
        followUpId,
        limit: 100,
        offset: 0,
      }),
    enabled: canSeeChangeLog(role) && Boolean(patientId),
  })

  if (!canSeeChangeLog(role)) return null

  const items = (query.data?.items ?? []).filter((entry) =>
    onlyActivityStatus ? isActivityStatusChange(entry) : true,
  )
  const groups = groupChanges(items)

  return (
    <Card className="ring-foreground/5 ring-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando historial...</p>
        ) : query.isError ? (
          <p className="text-destructive text-sm">
            No se pudo cargar el historial. {query.error.message}
          </p>
        ) : groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Todavía no hay cambios registrados.
          </p>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => {
              const head = group[0]
              const when = new Date(head.changedAt).toLocaleString("es-PE", {
                dateStyle: "medium",
                timeStyle: "short",
              })
              return (
                <li key={head.changeSetId} className="rounded-xl border p-3">
                  <p className="text-sm font-medium">
                    {head.actorEmail ?? "Sistema"} · {when}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {changeLogContextLabels[head.context]}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {group.map((entry) => (
                      <li key={entry.id} className="text-sm">
                        {describeChangeLogEntry(entry)}
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        )}
        {query.data && query.data.total > query.data.items.length && (
          <p className="text-muted-foreground text-xs">
            Se muestran los primeros {query.data.items.length} de{" "}
            {query.data.total} cambios.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
