import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { catalogsApi, type CatalogItem, type CatalogKind } from "@/api/catalogs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { catalogQueryKey } from "@/hooks/use-catalog"

export function MergeCatalogItemDialog({
  source,
  items,
  kind,
  open,
  onOpenChange,
}: {
  source: CatalogItem | null
  items: CatalogItem[]
  kind: CatalogKind
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [targetId, setTargetId] = useState("")
  const [confirming, setConfirming] = useState(false)
  const targets = items.filter((item) => item.id !== source?.id && item.isActive)
  const targetItems = targets.map((item) => ({
    value: item.id,
    label: `${item.label} (${item.code})`,
  }))
  const target = targets.find((item) => item.id === targetId) ?? null
  const mutation = useMutation({
    mutationFn: () => {
      if (!source || !targetId) throw new Error("Elegí el ítem que se conserva")
      return catalogsApi.mergeInto(source.id, targetId)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: catalogQueryKey(kind) }),
        queryClient.invalidateQueries({ queryKey: ["catalog-merges"] }),
      ])
      toast.success("Ítems fusionados", {
        description: source
          ? `Los registros que usaban «${source.label}» ahora usan el ítem destino. El origen quedó inactivo.`
          : undefined,
      })
      onOpenChange(false)
    },
    onError: (error: Error) =>
      toast.error("No se pudo fusionar", { description: error.message }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fusionar con…</DialogTitle>
          <DialogDescription>
            {source
              ? `«${source.label}» es el duplicado. Elegí el ítem que se conserva.`
              : "Elegí el ítem que se conserva."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merge-target">Ítem destino</Label>
            <Select
              items={targetItems}
              value={targetId}
              onValueChange={(value) => {
                setTargetId(value ?? "")
                setConfirming(false)
              }}
            >
              <SelectTrigger id="merge-target" className="w-full">
                <SelectValue placeholder="Seleccionar ítem" />
              </SelectTrigger>
              <SelectContent>
                {targetItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targets.length === 0 && (
              <p className="text-muted-foreground text-xs">
                No hay otro ítem activo en este catálogo.
              </p>
            )}
          </div>
          {source && target && (
            <p className="bg-muted/40 rounded-md border px-3 py-2 text-sm">
              Esta fusión reapunta todos los registros que usan «{source.label}»{" "}
              ({source.code}) hacia «{target.label}» ({target.code}). «
              {source.label}» queda inactivo.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              confirming ? setConfirming(false) : onOpenChange(false)
            }
            disabled={mutation.isPending}
          >
            {confirming ? "Volver" : "Cancelar"}
          </Button>
          {confirming ? (
            <Button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !target}
            >
              {mutation.isPending ? "Fusionando..." : "Confirmar fusión"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!target}
            >
              Fusionar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
