import { CatalogSelect } from "@/components/catalog-select"
import { HealthCenterCombobox } from "@/components/health-center-combobox"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
const alertSchema = z.object({
  healthCenterId: z.string().min(1, "Seleccioná un establecimiento"),
  title: z.string().min(3, "Título requerido"),
  description: z.string().min(5, "Detallá el problema reportado"),
  severity: z.enum(["HIGH", "MEDIUM", "LOW"], { message: "Selecciona la severidad" }),
  category: z.string().min(1, "Seleccioná una categoría"),
})

const SEVERITY_OPTIONS = [
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Media" },
  { value: "LOW", label: "Baja" },
] as const

export type CreateAlertFormValues = z.infer<typeof alertSchema>

interface CreateAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onSubmit: (values: CreateAlertFormValues) => Promise<void>
}

export function CreateAlertDialog({ open, onOpenChange, isPending, onSubmit }: CreateAlertDialogProps) {
  const form = useForm<CreateAlertFormValues>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      healthCenterId: "",
      title: "",
      description: "",
      severity: "HIGH",
      category: "",
    },
  })

  function handleClose() {
    onOpenChange(false)
    form.reset()
  }

  async function submit(values: CreateAlertFormValues) {
    await onSubmit(values)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reportar incidencia hospitalaria</DialogTitle>
          <DialogDescription>
            Se registrará ligada a este seguimiento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Establecimiento</Label>
            <Controller
              name="healthCenterId"
              control={form.control}
              render={({ field }) => (
                <HealthCenterCombobox
                      className="w-full"
                      value={field.value}
                      onValueChange={(v) => field.onChange(v ?? "")}
                      placeholder="Seleccionar establecimiento"
                    />
              )}
            />
            {form.formState.errors.healthCenterId && (
              <p className="text-destructive text-xs">{form.formState.errors.healthCenterId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Textarea
              {...form.register("title")}
              className="min-h-16 resize-none"
              placeholder="Título resumido de la alerta..."
            />
            {form.formState.errors.title && (
              <p className="text-destructive text-xs">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Detalle</Label>
            <Textarea
              {...form.register("description")}
              className="min-h-24 resize-none"
              placeholder="Describí el problema reportado..."
            />
            {form.formState.errors.description && (
              <p className="text-destructive text-xs">{form.formState.errors.description.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Controller
                name="severity"
                control={form.control}
                render={({ field }) => (
                  <Select items={SEVERITY_OPTIONS} value={field.value} onValueChange={(value) => field.onChange(value)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{SEVERITY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <CatalogSelect
                    kind="alert_category"
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    placeholder="Seleccionar categoría"
                  />
                )}
              />
              {form.formState.errors.category && (
                <p className="text-destructive text-xs">{form.formState.errors.category.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar alerta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
