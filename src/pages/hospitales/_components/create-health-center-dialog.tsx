import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { MapPin } from "lucide-react"
import { healthCentersApi } from "@/api/health-centers"
import type {
  CreateHealthCenterInput,
  HealthCenter,
} from "@/api/health-centers"
import { DEPARTMENTS } from "../_utils/departments"
import {
  CARE_CATEGORIES,
  HEALTH_CENTER_INSTITUTIONS,
  HEALTH_CENTER_INSTITUTION_LABELS,
  type CareCategory,
  type HealthCenterInstitution,
} from "@/lib/health-center-labels"

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  department: z.string().min(1, "Requerido"),
  careCategory: z.string().min(1, "Requerido"),
  institution: z.string().optional(),
  renipressCode: z.string().optional(),
  ubigeoDistrictCode: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface CreateHealthCenterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (healthCenter: HealthCenter) => void
}

export function CreateHealthCenterDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateHealthCenterDialogProps) {
  const queryClient = useQueryClient()
  const createMutation = useMutation({
    mutationFn: healthCentersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthCenters"] })
      queryClient.invalidateQueries({ queryKey: ["health-centers"] })
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
    defaultValues: {
      name: "",
      department: "",
      careCategory: "",
      institution: "",
      renipressCode: "",
      ubigeoDistrictCode: "",
    },
  })

  const department = watch("department")
  const careCategory = watch("careCategory")
  const institution = watch("institution")

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  async function onSubmit(values: FormValues) {
    const name = values.name.toUpperCase()
    try {
      const created = await createMutation.mutateAsync({
        name,
        department: values.department as CreateHealthCenterInput["department"],
        careCategory: values.careCategory as CareCategory,
        institution: (values.institution || undefined) as
          | HealthCenterInstitution
          | undefined,
        renipressCode: values.renipressCode?.trim() || undefined,
        ubigeoDistrictCode: values.ubigeoDistrictCode?.trim() || undefined,
      })
      onCreated?.(created)
      toast.success(`"${name}" creado`)
      handleClose()
    } catch (err) {
      toast.error("Error al crear el centro de salud", {
        description: err instanceof Error ? err.message : "Error inesperado",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo centro de salud</DialogTitle>
          <DialogDescription>
            Registrá un nuevo hospital o centro de salud en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.stopPropagation()
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <Label>Nombre del establecimiento</Label>
            <Input
              autoFocus
              placeholder="Ej: HOSPITAL NACIONAL EDGARDO REBAGLIATI MARTINS"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Departamento</Label>
            <Select
              items={DEPARTMENTS.map((department) => ({
                value: department.value,
                label: department.label,
              }))}
              value={department}
              onValueChange={(v) => setValue("department", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar departamento..." />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {DEPARTMENTS.map((dep) => (
                  <SelectItem key={dep.value} value={dep.value}>
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="text-muted-foreground size-3" />
                      {dep.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && (
              <p className="text-destructive text-xs">
                {errors.department.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categoría de atención</Label>
            <Select
              items={CARE_CATEGORIES.map((category) => ({
                value: category,
                label: category,
              }))}
              value={careCategory}
              onValueChange={(v) => setValue("careCategory", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría..." />
              </SelectTrigger>
              <SelectContent>
                {CARE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.careCategory && (
              <p className="text-destructive text-xs">
                {errors.careCategory.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Institución</Label>
            <Select
              items={HEALTH_CENTER_INSTITUTIONS.map((item) => ({
                value: item,
                label: HEALTH_CENTER_INSTITUTION_LABELS[item],
              }))}
              value={institution || null}
              onValueChange={(v) => setValue("institution", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar institución..." />
              </SelectTrigger>
              <SelectContent>
                {HEALTH_CENTER_INSTITUTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {HEALTH_CENTER_INSTITUTION_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Código RENIPRESS</Label>
              <Input {...register("renipressCode")} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label>Ubigeo del distrito</Label>
              <Input {...register("ubigeoDistrictCode")} placeholder="Opcional" />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!department || !careCategory || createMutation.isPending}
            >
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
