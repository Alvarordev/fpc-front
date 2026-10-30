import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { Archive } from "lucide-react"
import { toast } from "sonner"
import {
  ALL_CATALOG_KINDS,
  CATALOG_KIND_LABELS,
  OPEN_CATALOG_KINDS,
  catalogsApi,
  type CatalogItem,
} from "@/api/catalogs"
import { CreateCatalogItemDialog } from "@/components/create-catalog-item-dialog"
import { AddButton, Button } from "@/components/ds/button"
import { DataTable } from "@/components/ds/data-table"
import { Modal } from "@/components/ds/modal"
import { catalogLabel, catalogQueryKey, useCatalog } from "@/hooks/use-catalog"
import { CATALOG_PARENT_KIND, CATALOG_PARENT_LABEL } from "@/lib/catalog-item-questions"
import { useAuthStore } from "@/store/auth-store"
import { catalogFiltersNarrow, matchesCatalogItem, readCatalogFilters, readCatalogKind } from "../_lib/catalog-filters"
import { catalogColumns } from "./catalog-columns"
import { CatalogMerges } from "./catalog-merges"
import { CatalogsFilters } from "./catalogs-filters"
import { EditCatalogItemDialog } from "./edit-catalog-item-dialog"
import { MergeCatalogItemDialog } from "./merge-catalog-item-dialog"

export function CatalogsContent() {
  const role = useAuthStore((state) => state.user?.role)
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const allowed = role === "AGENT" ? OPEN_CATALOG_KINDS : ALL_CATALOG_KINDS
  const kind = readCatalogKind(params, allowed)
  const filters = readCatalogFilters(params)
  const { data: items = [], isLoading } = useCatalog(kind, true)
  const parentKind = CATALOG_PARENT_KIND[kind]
  const { data: parents = [] } = useCatalog(parentKind ?? "entry_source", false)
  const canMerge = role === "ADMIN"
  const canSeeMerges = role === "ADMIN" || role === "FOUNDATION"
  const mergesQuery = useQuery({
    queryKey: ["catalog-merges"],
    queryFn: catalogsApi.listMerges,
    enabled: canSeeMerges,
    staleTime: 30_000,
  })
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | null>(null)
  const [merging, setMerging] = useState<CatalogItem | null>(null)
  const [deactivating, setDeactivating] = useState<CatalogItem | null>(null)

  const visible = useMemo(() => items.filter((item) => matchesCatalogItem(item, filters)), [items, filters])
  const narrowed = catalogFiltersNarrow(filters)
  const parentOptions = useMemo(
    () => (parentKind ? parents.map((item) => ({ value: item.code, label: item.label })) : undefined),
    [parentKind, parents],
  )
  const reactivate = useCallback(
    async (item: CatalogItem) => {
      try {
        await catalogsApi.update(item.id, { isActive: true })
        await queryClient.invalidateQueries({ queryKey: catalogQueryKey(kind) })
        toast.success("Opción reactivada", { description: item.label })
      } catch (error) {
        toast.error("No se pudo reactivar la opción", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    },
    [kind, queryClient],
  )
  const deactivate = useMutation({
    mutationFn: (item: CatalogItem) => catalogsApi.archive(item.id),
    onSuccess: async (_data, item) => {
      await queryClient.invalidateQueries({ queryKey: catalogQueryKey(kind) })
      toast.success("Opción desactivada", { description: `${item.label} deja de aparecer en los formularios.` })
      setDeactivating(null)
    },
    onError: (error: Error) => toast.error("No se pudo desactivar la opción", { description: error.message }),
  })
  const columns = useMemo(
    () =>
      catalogColumns({
        hierarchical: Boolean(parentKind),
        parentLabel: (code) => catalogLabel(parents, code),
        canMerge,
        onEdit: setEditing,
        onMerge: setMerging,
        onDeactivate: setDeactivating,
        onReactivate: (item) => void reactivate(item),
      }),
    [parentKind, parents, canMerge, reactivate],
  )

  return (
    <div className="font-ds space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Catálogos</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            {narrowed ? `${visible.length} de ${items.length}` : `${visible.length} opciones`}
            {role === "AGENT" ? " · solo los catálogos abiertos" : ""}
          </p>
        </div>
        <AddButton onClick={() => setCreating(true)}>Nuevo ítem</AddButton>
      </header>

      <CatalogsFilters allowed={allowed} items={items} />

      <DataTable
        data={visible}
        columns={columns}
        isLoading={isLoading}
        emptyTitle={narrowed ? "Ninguna opción coincide" : "Este catálogo no tiene opciones"}
        emptyBody={
          narrowed
            ? "Prueba con otro texto o quita un filtro de arriba."
            : "Agrega la primera para que aparezca en los formularios."
        }
        emptyAction={narrowed ? undefined : "Nuevo ítem"}
        onEmptyAction={narrowed ? undefined : () => setCreating(true)}
      />

      {canSeeMerges && <CatalogMerges query={mergesQuery} />}

      <CreateCatalogItemDialog kind={kind} open={creating} onOpenChange={setCreating} />
      <EditCatalogItemDialog
        item={editing}
        kindLabel={CATALOG_KIND_LABELS[kind]}
        parent={parentOptions ? { label: CATALOG_PARENT_LABEL[kind] ?? "Padre", options: parentOptions } : undefined}
        onClose={() => setEditing(null)}
      />
      <MergeCatalogItemDialog source={merging} items={items} kind={kind} onClose={() => setMerging(null)} />

      {deactivating && (
        <Modal
          open
          onClose={() => setDeactivating(null)}
          icon={Archive}
          title="Desactivar opción"
          description={deactivating.label}
          footer={
            <>
              <Button onClick={() => setDeactivating(null)} disabled={deactivate.isPending}>
                Volver
              </Button>
              <Button variant="dark" disabled={deactivate.isPending} onClick={() => deactivate.mutate(deactivating)}>
                {deactivate.isPending ? "Guardando…" : "Desactivar"}
              </Button>
            </>
          }
        >
          <p className="px-1 text-sm text-zinc-700">Deja de aparecer en los formularios. Los registros que ya la usan la conservan.</p>
        </Modal>
      )}
    </div>
  )
}
