import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { catalogsApi, type CatalogItem, type CatalogKind } from "@/api/catalogs"
import { CopyValue } from "@/components/ds/copy-value"
import { FormModal } from "@/components/ds/form-modal"
import type { Option, Values } from "@/components/ds/questions"
import { catalogQueryKey } from "@/hooks/use-catalog"
import { catalogItemEditGroups } from "@/lib/catalog-item-questions"

export function EditCatalogItemDialog({
  item,
  kindLabel,
  parent,
  onClose,
}: {
  item: CatalogItem | null
  kindLabel: string
  parent?: { label: string; options: Option[] }
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const update = useMutation({
    mutationFn: (values: Values) => {
      if (!item) throw new Error("No hay un ítem para editar")
      return catalogsApi.update(item.id, {
        label: values.label?.trim() ?? "",
        sortOrder: values.sortOrder ? Number(values.sortOrder) : 0,
        ...(parent ? { parentCode: values.parent } : {}),
      })
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: catalogQueryKey(updated.kind as CatalogKind) })
    },
  })
  if (!item) return null

  return (
    <FormModal
      key={item.id}
      icon={Pencil}
      title="Editar opción"
      description={kindLabel}
      groups={catalogItemEditGroups(parent)}
      initial={{
        label: item.label,
        sortOrder: String(item.sortOrder),
        parent: item.parentCode,
      }}
      submitLabel="Guardar cambios"
      pending={update.isPending}
      onClose={onClose}
      onSubmit={(values) => {
        update.mutate(values, {
          onSuccess: (updated) => {
            toast.success("Opción actualizada", { description: updated.label })
            onClose()
          },
          onError: (error: Error) => toast.error("No se pudo guardar la opción", { description: error.message }),
        })
      }}
    >
      <p className="px-1 text-[13px] text-zinc-500">
        Código <CopyValue value={item.code} label="Código" className="font-medium text-zinc-800" />. No se puede cambiar.
      </p>
    </FormModal>
  )
}
