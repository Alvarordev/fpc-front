import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

  const kindItems = useMemo(
    () =>
      ALL_CATALOG_KINDS.map((item) => ({
        value: item,
        label: CATALOG_KIND_LABELS[item],
      })),
    [],
  )

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

      <div className="space-y-4">
        <div className="max-w-sm space-y-1.5">
          <Label htmlFor="catalog-kind" className="text-muted-foreground text-xs">
            Catálogo
          </Label>
          <Select
            items={kindItems}
            value={kind}
            onValueChange={(value) =>
              setKind((value as CatalogKind | null) ?? kind)
            }
          >
            <SelectTrigger id="catalog-kind" className="w-full">
              <SelectValue placeholder="Seleccionar catálogo" />
            </SelectTrigger>
            <SelectContent>
              {kindItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          data={items}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No hay ítems en este catálogo"
        />
      </div>

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
