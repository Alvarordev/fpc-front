import { useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ListPlus } from "lucide-react"
import { toast } from "sonner"
import { CATALOG_KIND_LABELS, catalogsApi, type CatalogItem, type CatalogKind } from "@/api/catalogs"
import { FormModal } from "@/components/ds/form-modal"
import { catalogQueryKey, catalogSelectItems } from "@/hooks/use-catalog"
import { isReservedCatalogCode, slugifyCatalogCode } from "@/lib/catalog-code"
import { catalogItemGroups } from "@/lib/catalog-item-questions"

const PARENT_KIND_BY_KIND: Partial<Record<CatalogKind, CatalogKind>> = {
  entry_sub_source: "entry_source",
}

const PARENT_LABEL: Partial<Record<CatalogKind, string>> = {
  entry_sub_source: "Fuente de ingreso",
}

interface CreateCatalogItemDialogProps {
  kind: CatalogKind
  parentCode?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (item: CatalogItem) => void
}

export function CreateCatalogItemDialog({ kind, parentCode: lockedParentCode, open, onOpenChange, onCreated }: CreateCatalogItemDialogProps) {
  const queryClient = useQueryClient()
  const codeTouched = useRef(false)
  useEffect(() => {
    if (open) codeTouched.current = false
  }, [open])
  const parentKind = PARENT_KIND_BY_KIND[kind]
  const { data: parentItems = [] } = useQuery({
    queryKey: [...catalogQueryKey(parentKind ?? "entry_source"), false],
    queryFn: () => catalogsApi.list({ kind: parentKind ?? "entry_source" }),
    enabled: Boolean(parentKind) && open && !lockedParentCode,
    staleTime: 5 * 60_000,
  })
  const createMutation = useMutation({
    mutationFn: catalogsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogQueryKey(kind) })
    },
  })

  if (!open) return null

  const parentOptions = catalogSelectItems(parentItems)
  const groups = catalogItemGroups(
    parentKind && !lockedParentCode ? { label: PARENT_LABEL[kind] ?? "Depende de", options: parentOptions } : undefined,
  )

  return (
    <FormModal
      icon={ListPlus}
      title="Nuevo ítem de catálogo"
      description={`Se agrega a ${CATALOG_KIND_LABELS[kind]} y queda disponible en los formularios.`}
      groups={groups}
      initial={{ label: "", code: "", sortOrder: "900", parent: lockedParentCode ?? "" }}
      submitLabel="Guardar"
      pending={createMutation.isPending}
      footnote="Queda disponible en todos los formularios"
      derive={(id, next) => {
        if (id === "code") codeTouched.current = true
        if (id === "label" && !codeTouched.current) return { ...next, code: slugifyCatalogCode(next.label ?? "") }
        return next
      }}
      onClose={() => onOpenChange(false)}
      onSubmit={(values) => {
        const code = values.code?.trim() ?? ""
        if (isReservedCatalogCode(code)) {
          toast.error("Ese código está reservado", { description: "Elige otro código. OTRO lo usa el sistema." })
          return
        }
        const parentCode = lockedParentCode || values.parent || undefined
        if (parentKind && !parentCode) {
          toast.error("Elige de qué depende", { description: "Esta opción necesita una fuente de ingreso." })
          return
        }
        createMutation.mutate(
          {
            kind,
            label: values.label!.trim(),
            code,
            sortOrder: Number(values.sortOrder) || 900,
            ...(parentCode ? { parentCode } : {}),
          },
          {
            onSuccess: (created) => {
              onCreated?.(created)
              toast.success(`"${created.label}" creado`)
              onOpenChange(false)
            },
            onError: (error: Error) => toast.error("No se pudo crear el ítem", { description: error.message }),
          },
        )
      }}
    />
  )
}
