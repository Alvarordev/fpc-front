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
import { HEALTH_CENTER_CATEGORIES } from "../_utils/categories";
import type { HealthCenter, UpdateHealthCenterInput } from "@/api/health-centers";

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  department: z.string().min(1, "Requerido"),
  category: z.string().min(1, "Requerido"),
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
    defaultValues: { name: "", department: "", category: "" },
  });

  const department = watch("department");
  const category = watch("category");

  // Pre-fill the form when dialog opens with a center
  useEffect(() => {
    if (open && center) {
      reset({
        name: center.name,
        department: center.department,
        category: center.category ?? "",
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
    const category = values.category as NonNullable<
      UpdateHealthCenterInput["category"]
    >;

    try {
      await updateMutation.mutateAsync({
        id: center.id,
        data: { name, department, category },
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
            Modificá los datos del centro de salud.
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
            <Label>Categoría</Label>
            <Select
              items={HEALTH_CENTER_CATEGORIES.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              value={category}
              onValueChange={(v) => setValue("category", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría..." />
              </SelectTrigger>
              <SelectContent>
                {HEALTH_CENTER_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!department || !category || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
