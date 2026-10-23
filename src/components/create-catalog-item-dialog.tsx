import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CATALOG_KIND_LABELS,
  catalogsApi,
  type CatalogItem,
  type CatalogKind,
} from "@/api/catalogs"
import {
  catalogQueryKey,
  catalogSelectItems,
} from "@/hooks/use-catalog"
import {
  isReservedCatalogCode,
  slugifyCatalogCode,
} from "@/lib/catalog-code"

const schema = z
  .object({
    label: z.string().min(1, "Requerido"),
    code: z.string().min(1, "Requerido"),
    sortOrder: z.string().min(1, "Requerido"),
  })
  .superRefine((values, context) => {
    if (isReservedCatalogCode(values.code)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["code"],
        message: "El código OTRO está reservado",
      })
    }
    if (!/^\d+$/.test(values.sortOrder)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sortOrder"],
        message: "Debe ser un número",
      })
    }
  })

type FormValues = z.infer<typeof schema>

const PARENT_KIND_BY_KIND: Partial<Record<CatalogKind, CatalogKind>> = {
  entry_sub_source: "entry_source",
}

interface CreateCatalogItemDialogProps {
  kind: CatalogKind
  parentCode?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (item: CatalogItem) => void
}

export function CreateCatalogItemDialog({
  kind,
  parentCode: lockedParentCode,
  open,
  onOpenChange,
  onCreated,
}: CreateCatalogItemDialogProps) {
  const queryClient = useQueryClient()
  const [codeTouched, setCodeTouched] = useState(false)
  const [selectedParentCode, setSelectedParentCode] = useState("")
  const parentKind = PARENT_KIND_BY_KIND[kind]
  const needsParentPicker = Boolean(parentKind) && !lockedParentCode
  const { data: parentItems = [] } = useQuery({
    queryKey: [...catalogQueryKey(parentKind ?? "entry_source"), false],
    queryFn: () => catalogsApi.list({ kind: parentKind ?? "entry_source" }),
    enabled: Boolean(parentKind) && open,
    staleTime: 5 * 60_000,
  })
  const parentSelectItems = catalogSelectItems(parentItems)
  const resolvedParentCode = lockedParentCode || selectedParentCode || undefined
  const createMutation = useMutation({
    mutationFn: catalogsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogQueryKey(kind) })
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { label: "", code: "", sortOrder: "900" },
  })

  const label = watch("label")

  useEffect(() => {
    if (!open) return
    setCodeTouched(false)
    setSelectedParentCode("")
    reset({ label: "", code: "", sortOrder: "900" })
  }, [open, reset])

  useEffect(() => {
    if (!codeTouched) {
      setValue("code", slugifyCatalogCode(label), { shouldValidate: false })
    }
  }, [label, codeTouched, setValue])

  function handleClose() {
    onOpenChange(false)
  }

  async function onSubmit(values: FormValues) {
    if (parentKind && !resolvedParentCode) {
      toast.error("Seleccioná la fuente de ingreso padre")
      return
    }
    try {
      const created = await createMutation.mutateAsync({
        kind,
        label: values.label.trim(),
        code: values.code.trim(),
        sortOrder: Number(values.sortOrder) || 900,
        ...(resolvedParentCode ? { parentCode: resolvedParentCode } : {}),
      })
      onCreated?.(created)
      toast.success(`"${created.label}" creado`)
      handleClose()
    } catch (err) {
      toast.error("Error al crear el ítem", {
        description: err instanceof Error ? err.message : "Error inesperado",
      })
    }
  }

  const kindLabel = CATALOG_KIND_LABELS[kind]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo ítem de catálogo</DialogTitle>
          <DialogDescription>
            Agregá una opción a {kindLabel}. Quedará disponible en todos los
            formularios.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.stopPropagation()
            void handleSubmit(onSubmit)(event)
          }}
          className="space-y-4 py-2"
        >
          {needsParentPicker && (
            <div className="space-y-2">
              <Label>Fuente de ingreso</Label>
              <Select
                items={parentSelectItems}
                value={selectedParentCode}
                onValueChange={(value) => setSelectedParentCode(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar fuente..." />
                </SelectTrigger>
                <SelectContent>
                  {parentSelectItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Etiqueta</Label>
            <Input
              autoFocus
              placeholder="Ej: Genética oncológica"
              {...register("label")}
            />
            {errors.label && (
              <p className="text-destructive text-xs">{errors.label.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Código</Label>
            <Input
              {...register("code", {
                onChange: () => setCodeTouched(true),
              })}
            />
            {errors.code && (
              <p className="text-destructive text-xs">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Orden en listas</Label>
            <Input type="number" min={0} {...register("sortOrder")} />
            <p className="text-muted-foreground text-xs">
              Posición en desplegables y en esta tabla. Menor número = más arriba.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
