import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreateCatalogItemDialog } from "@/components/create-catalog-item-dialog"
import { EditCatalogItemDialog } from "./edit-catalog-item-dialog"
import { MergeCatalogItemDialog } from "./merge-catalog-item-dialog"
import { catalogColumns } from "./catalog-columns"
import {
  ALL_CATALOG_KINDS,
  CATALOG_KIND_LABELS,
  OPEN_CATALOG_KINDS,
  catalogsApi,
  type CatalogItem,
  type CatalogKind,
} from "@/api/catalogs"
import { useCatalog, catalogQueryKey } from "@/hooks/use-catalog"
import { useAuthStore } from "@/store/auth-store"

export function CatalogsContent() {
  const role = useAuthStore((state) => state.user?.role)
  const [kind, setKind] = useState<CatalogKind>("cancer_diagnosis")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | null>(null)
  const [merging, setMerging] = useState<CatalogItem | null>(null)
  const queryClient = useQueryClient()
  const allowedKinds: readonly CatalogKind[] =
    role === "AGENT" ? OPEN_CATALOG_KINDS : ALL_CATALOG_KINDS
  const selectedKind = allowedKinds.includes(kind) ? kind : allowedKinds[0]
  const { data: items = [], isLoading } = useCatalog(selectedKind, true)
  const canMerge = role === "ADMIN"
  const canSeeMerges = role === "ADMIN" || role === "FOUNDATION"
  const mergesQuery = useQuery({
    queryKey: ["catalog-merges"],
    queryFn: catalogsApi.listMerges,
    enabled: canSeeMerges,
    staleTime: 30_000,
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => catalogsApi.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogQueryKey(selectedKind) })
    },
  })
  const reactivateMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      catalogsApi.update(id, { isActive: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogQueryKey(selectedKind) })
    },
  })

  const kindItems = useMemo(
    () =>
      allowedKinds.map((item) => ({
        value: item,
        label: CATALOG_KIND_LABELS[item],
      })),
    [allowedKinds],
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
        onMerge: canMerge ? setMerging : undefined,
      }),
    [archiveMutation, reactivateMutation, canMerge],
  )

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Catálogos
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Opciones de formularios clínicos.
            {role === "AGENT" && " Como agente solo puedes editar los catálogos abiertos."}{" "}
            Los hospitales se gestionan en{" "}
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
            value={selectedKind}
            onValueChange={(value) =>
              setKind((value as CatalogKind | null) ?? selectedKind)
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

      {canSeeMerges && <CatalogMergeHistory query={mergesQuery} />}

      <CreateCatalogItemDialog
        kind={selectedKind}
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
      <MergeCatalogItemDialog
        key={merging?.id ?? "merge-closed"}
        source={merging}
        items={items}
        kind={selectedKind}
        open={Boolean(merging)}
        onOpenChange={(open) => {
          if (!open) setMerging(null)
        }}
      />
    </div>
  )
}

function CatalogMergeHistory({
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historial de fusiones</CardTitle>
        <CardDescription>
          Cada fusión deja inactivo el ítem de origen y reapunta los registros al destino.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando historial...</p>
        ) : query.isError ? (
          <p className="text-muted-foreground text-sm">
            No se pudo cargar el historial de fusiones.
          </p>
        ) : merges.length === 0 ? (
          <p className="text-muted-foreground text-sm">Todavía no hay fusiones.</p>
        ) : (
          <ul className="max-h-64 divide-y overflow-y-auto rounded-md border">
            {merges.map((merge) => {
              const affected = Object.values(merge.affectedRows).reduce(
                (sum, count) => sum + count,
                0,
              )
              const kindLabel =
                CATALOG_KIND_LABELS[merge.kind as CatalogKind] ?? merge.kind
              return (
                <li key={merge.id} className="space-y-1 px-3 py-2 text-sm">
                  <p>
                    <span className="font-medium">{kindLabel}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {merge.sourceCode} → {merge.targetCode}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(merge.createdAt).toLocaleString("es-PE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {" · "}
                    {affected} registro{affected === 1 ? "" : "s"} reasignado
                    {affected === 1 ? "" : "s"}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
