import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
  catalogsApi,
  type CatalogItem,
  type CatalogKind,
} from "@/api/catalogs"
import { catalogQueryKey } from "@/hooks/use-catalog"

const schema = z.object({
  label: z.string().min(1, "Requerido"),
  sortOrder: z.string().min(1, "Requerido"),
  isActive: z.enum(["true", "false"]),
})

type FormValues = z.infer<typeof schema>

interface EditCatalogItemDialogProps {
  item: CatalogItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCatalogItemDialog({
  item,
  open,
  onOpenChange,
}: EditCatalogItemDialogProps) {
  const queryClient = useQueryClient()
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Parameters<typeof catalogsApi.update>[1]
    }) => catalogsApi.update(id, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({
        queryKey: catalogQueryKey(updated.kind as CatalogKind),
      })
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
    defaultValues: { label: "", sortOrder: "0", isActive: "true" },
  })

  const isActive = watch("isActive")

  useEffect(() => {
    if (open && item) {
      reset({
        label: item.label,
        sortOrder: String(item.sortOrder),
        isActive: item.isActive ? "true" : "false",
      })
    }
  }, [open, item, reset])

  function handleClose() {
    onOpenChange(false)
  }

  async function onSubmit(values: FormValues) {
    if (!item) return
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        data: {
          label: values.label.trim(),
          sortOrder: Number(values.sortOrder) || 0,
          isActive: values.isActive === "true",
        },
      })
      toast.success("Ítem actualizado")
      handleClose()
    } catch (err) {
      toast.error("Error al actualizar", {
        description: err instanceof Error ? err.message : "Error inesperado",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar ítem</DialogTitle>
          <DialogDescription>
            El código no se puede cambiar. Código: {item?.code}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.stopPropagation()
            void handleSubmit(onSubmit)(event)
          }}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <Label>Etiqueta</Label>
            <Input {...register("label")} />
            {errors.label && (
              <p className="text-destructive text-xs">{errors.label.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Orden en listas</Label>
            <Input type="number" min={0} {...register("sortOrder")} />
            <p className="text-muted-foreground text-xs">
              Posición en desplegables y en esta tabla. Menor número = más arriba.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              items={[
                { value: "true", label: "Activo" },
                { value: "false", label: "Archivado" },
              ]}
              value={isActive}
              onValueChange={(value) =>
                setValue("isActive", (value as "true" | "false") ?? "true")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
