import { useQuery } from "@tanstack/react-query"
import { changeLogApi, type ChangeLogEntry } from "@/api/change-log"
import { Card } from "@/components/ds/card"
import {
  changeLogContextLabels,
  describeChangeLogEntry,
  isActivityStatusChange,
  isVisibleChangeLogEntry,
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
    onlyActivityStatus
      ? isActivityStatusChange(entry)
      : isVisibleChangeLogEntry(entry),
  )
  const groups = groupChanges(items)

  return (
    <Card title={title} description={description}>
      {query.isLoading ? (
        <p className="text-[13px] text-zinc-500">Cargando historial...</p>
      ) : query.isError ? (
        <p className="text-[13px] text-red-700">No se pudo cargar el historial. {query.error.message}</p>
      ) : groups.length === 0 ? (
        <p className="text-[13px] text-zinc-500">Todavía no hay cambios registrados.</p>
      ) : (
        <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const head = group[0]
            const when = new Date(head.changedAt).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })
            return (
              <li key={head.changeSetId} className="text-[13px]">
                <ul className="space-y-0.5 font-medium text-zinc-900">
                  {group.map((entry) => (
                    <li key={entry.id}>{describeChangeLogEntry(entry)}</li>
                  ))}
                </ul>
                <p className="mt-1 text-zinc-500">
                  {head.actorEmail ?? "Sistema"}, {when}, {changeLogContextLabels[head.context].toLowerCase()}
                </p>
              </li>
            )
          })}
        </ul>
      )}
      {query.data && query.data.total > query.data.items.length && (
        <p className="mt-4 text-xs text-zinc-500">
          Se muestran los primeros {query.data.items.length} de {query.data.total} cambios.
        </p>
      )}
    </Card>
  )
}
