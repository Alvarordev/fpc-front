import { CATALOG_KIND_LABELS, catalogsApi, type CatalogKind } from "@/api/catalogs"

export function CatalogMerges({
  query,
}: {
  query: {
    data?: Awaited<ReturnType<typeof catalogsApi.listMerges>>
    isLoading: boolean
    isError: boolean
  }
}) {
  const merges = query.data ?? []
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-zinc-700">Fusiones</h2>
      {query.isLoading ? (
        <p className="text-[13px] text-zinc-500">Cargando el historial…</p>
      ) : query.isError ? (
        <p className="text-[13px] text-zinc-500">No se pudo cargar el historial. Recarga la página para intentarlo de nuevo.</p>
      ) : merges.length === 0 ? (
        <p className="text-[13px] text-zinc-500">Todavía no hay fusiones.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-[20px] bg-white ring-1 ring-zinc-200">
          {merges.map((merge) => {
            const affected = Object.values(merge.affectedRows).reduce((sum, count) => sum + count, 0)
            const kindLabel = CATALOG_KIND_LABELS[merge.kind as CatalogKind] ?? merge.kind
            return (
              <li key={merge.id} className="px-4 py-3">
                <p className="text-sm font-medium text-zinc-900">
                  {kindLabel}
                  <span className="font-normal text-zinc-500">
                    {" "}
                    · {merge.sourceCode} pasó a {merge.targetCode}
                  </span>
                </p>
                <p className="mt-0.5 text-[13px] text-zinc-500">
                  {new Date(merge.createdAt).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
                  {" · "}
                  {affected === 1 ? "1 registro reasignado" : `${affected} registros reasignados`}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
