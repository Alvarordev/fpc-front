import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { GitMerge } from "lucide-react"
import { toast } from "sonner"
import { catalogsApi, type CatalogItem, type CatalogKind } from "@/api/catalogs"
import { Button } from "@/components/ds/button"
import { Field } from "@/components/ds/form"
import { Modal } from "@/components/ds/modal"
import { SearchSelect } from "@/components/ds/search-select"
import { catalogQueryKey } from "@/hooks/use-catalog"

export function MergeCatalogItemDialog({
  source,
  items,
  kind,
  onClose,
}: {
  source: CatalogItem | null
  items: CatalogItem[]
  kind: CatalogKind
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [targetId, setTargetId] = useState<string | null>(null)
  const targets = items.filter((item) => item.id !== source?.id && item.isActive && !item.isSystem)
  const target = targets.find((item) => item.id === targetId) ?? null
  const merge = useMutation({
    mutationFn: () => {
      if (!source || !target) throw new Error("Elige la opción que se conserva")
      return catalogsApi.mergeInto(source.id, target.id)
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: catalogQueryKey(kind) }),
        queryClient.invalidateQueries({ queryKey: ["catalog-merges"] }),
      ])
      const moved = Object.values(result.affectedRows).reduce((sum, count) => sum + count, 0)
      toast.success("Opciones fusionadas", {
        description: moved === 1 ? "1 registro pasó a la opción que se conserva." : `${moved} registros pasaron a la opción que se conserva.`,
      })
      onClose()
    },
    onError: (error: Error) => toast.error("No se pudo fusionar", { description: error.message }),
  })
  if (!source) return null

  const kept = target?.label ?? "la opción que elijas"
  return (
    <Modal
      open
      onClose={() => !merge.isPending && onClose()}
      icon={GitMerge}
      title="Fusionar opción"
      description={source.label}
      footer={
        <>
          <Button onClick={onClose} disabled={merge.isPending}>
            Cancelar
          </Button>
          <Button variant="brand" disabled={!target || merge.isPending} onClick={() => merge.mutate()}>
            {merge.isPending ? "Guardando…" : "Fusionar"}
          </Button>
        </>
      }
    >
      <p className="px-1 text-sm text-zinc-700">
        Los registros que usan {source.label} pasan a usar {kept} y {source.label} queda inactivo. No se puede deshacer.
      </p>
      <Field label="Se conserva">
        {(id) => (
          <SearchSelect
            id={id}
            value={targetId}
            onChange={setTargetId}
            options={targets.map((item) => ({ value: item.id, label: item.label, sublabel: item.code }))}
            placeholder="Elegir opción"
            searchPlaceholder="Buscar por nombre"
            emptyMessage={targets.length === 0 ? "No hay otra opción activa" : "No hay coincidencias"}
          />
        )}
      </Field>
    </Modal>
  )
}
