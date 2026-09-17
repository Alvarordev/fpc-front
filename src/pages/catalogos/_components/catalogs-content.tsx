import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateCatalogItemDialog } from "@/components/create-catalog-item-dialog"
import { EditCatalogItemDialog } from "./edit-catalog-item-dialog"
import { catalogColumns } from "./catalog-columns"
import {
  ALL_CATALOG_KINDS,
  CATALOG_KIND_LABELS,
  catalogsApi,
  type CatalogItem,
  type CatalogKind,
} from "@/api/catalogs"
import { useCatalog, catalogQueryKey } from "@/hooks/use-catalog"

export function CatalogsContent() {
  const [kind, setKind] = useState<CatalogKind>("cancer_diagnosis")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | null>(null)
  const queryClient = useQueryClient()
  const { data: items = [], isLoading } = useCatalog(kind, true)

  const archiveMutation = useMutation({
    mutationFn: (id: string) => catalogsApi.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogQueryKey(kind) })
    },
  })
  const reactivateMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      catalogsApi.update(id, { isActive: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogQueryKey(kind) })
    },
  })

  const columns = useMemo(
    () =>
      catalogColumns({
        onEdit: setEditing,
        onArchive: async (item) => {
          try {
            await archiveMutation.mutateAsync(item.id)
            toast.success(`"${item.label}" archivado`)
          } catch (err) {
            toast.error("No se pudo archivar", {
              description:
                err instanceof Error ? err.message : "Error inesperado",
            })
          }
        },
        onReactivate: async (item) => {
          try {
            await reactivateMutation.mutateAsync({ id: item.id })
            toast.success(`"${item.label}" reactivado`)
          } catch (err) {
            toast.error("No se pudo reactivar", {
              description:
                err instanceof Error ? err.message : "Error inesperado",
            })
          }
        },
      }),
    [archiveMutation, reactivateMutation],
  )

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Catálogos
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Opciones de formularios clínicos. Los hospitales se gestionan en{" "}
            <Link to="/hospitales" className="text-primary underline">
              Hospitales
            </Link>
            .
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          Nuevo ítem
        </Button>
      </div>

      <Tabs
        value={kind}
        onValueChange={(value) => setKind((value as CatalogKind) ?? kind)}
      >
        <TabsList variant="line" className="h-auto w-full flex-wrap justify-start">
          {ALL_CATALOG_KINDS.map((item) => (
            <TabsTrigger key={item} value={item} className="text-xs">
              {CATALOG_KIND_LABELS[item]}
            </TabsTrigger>
          ))}
        </TabsList>
        {ALL_CATALOG_KINDS.map((item) => (
          <TabsContent key={item} value={item}>
            <DataTable
              data={kind === item ? items : []}
              columns={columns}
              isLoading={kind === item && isLoading}
              emptyMessage="No hay ítems en este catálogo"
            />
          </TabsContent>
        ))}
      </Tabs>

      <CreateCatalogItemDialog
        kind={kind}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditCatalogItemDialog
        item={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      />
    </div>
  )
}
