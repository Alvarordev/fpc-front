import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { useUpdateHealthCenter } from "../_hooks/use-health-centers";
import { DEPARTMENTS } from "../_utils/departments";
import {
  CARE_CATEGORIES,
  CARE_LEVEL_LABELS,
  HEALTH_CENTER_INSTITUTIONS,
  HEALTH_CENTER_INSTITUTION_LABELS,
  type CareCategory,
  type CareLevel,
  type HealthCenterInstitution,
} from "@/lib/health-center-labels";
import type { HealthCenter, UpdateHealthCenterInput } from "@/api/health-centers";

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  department: z.string().min(1, "Requerido"),
  careCategory: z.string().min(1, "Requerido"),
  institution: z.string().optional(),
  renipressCode: z.string().optional(),
  ubigeoDistrictCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditHealthCenterDialogProps {
  center: HealthCenter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditHealthCenterDialog({
  center,
  open,
  onOpenChange,
}: EditHealthCenterDialogProps) {
  const updateMutation = useUpdateHealthCenter();

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
  });

  const department = watch("department");
  const careCategory = watch("careCategory");
  const institution = watch("institution");

  // Pre-fill the form when dialog opens with a center
  useEffect(() => {
    if (open && center) {
      reset({
        name: center.name,
        department: center.department,
        careCategory: center.careCategory ?? "",
        institution: center.institution ?? "",
        renipressCode: center.renipressCode ?? "",
        ubigeoDistrictCode: center.ubigeoDistrictCode ?? "",
      });
    }
  }, [open, center, reset]);

  function handleClose() {
    onOpenChange(false);
    reset();
  }

  async function onSubmit(values: FormValues) {
    if (!center) return;

    const name = values.name.toUpperCase();
    const department = values.department as UpdateHealthCenterInput["department"];

    try {
      await updateMutation.mutateAsync({
        id: center.id,
        data: {
          name,
          department,
          careCategory: values.careCategory as CareCategory,
          institution: (values.institution || null) as
            | HealthCenterInstitution
            | null,
          renipressCode: values.renipressCode?.trim() || null,
          ubigeoDistrictCode: values.ubigeoDistrictCode?.trim() || null,
        },
      });
      toast.success("Centro de salud actualizado");
      handleClose();
    } catch (err) {
      toast.error("Error al actualizar", {
        description: err instanceof Error ? err.message : "Error inesperado",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar centro de salud</DialogTitle>
          <DialogDescription>
            Modifica los datos del centro de salud.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nombre del establecimiento</Label>
            <Input
              autoFocus
              placeholder="Ej: HOSPITAL NACIONAL EDGARDO REBAGLIATI MARTINS"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
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
                      <MapPin className="size-3 text-muted-foreground" />
                      {dep.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && (
              <p className="text-xs text-destructive">
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
              <p className="text-xs text-destructive">
                {errors.careCategory.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nivel</Label>
            <Input
              readOnly
              value={
                center?.careLevel
                  ? (CARE_LEVEL_LABELS[center.careLevel as CareLevel] ??
                    center.careLevel)
                  : "Se calcula a partir de la categoría"
              }
            />
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
              disabled={!department || !careCategory || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
