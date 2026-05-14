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
import { useCreateHealthCenter } from "../_hooks/use-health-centers";
import type { PeruDepartment } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  department: z.string().min(1, "Requerido"),
});

type FormValues = z.infer<typeof schema>;

const DEPARTMENTS: { value: string; label: string }[] = [
  { value: "AMAZONAS", label: "Amazonas" },
  { value: "ANCASH", label: "Áncash" },
  { value: "APURIMAC", label: "Apurímac" },
  { value: "AREQUIPA", label: "Arequipa" },
  { value: "AYACUCHO", label: "Ayacucho" },
  { value: "CAJAMARCA", label: "Cajamarca" },
  { value: "CALLAO", label: "Callao" },
  { value: "CUSCO", label: "Cusco" },
  { value: "HUANCAVELICA", label: "Huancavelica" },
  { value: "HUANUCO", label: "Huánuco" },
  { value: "ICA", label: "Ica" },
  { value: "JUNIN", label: "Junín" },
  { value: "LA_LIBERTAD", label: "La Libertad" },
  { value: "LAMBAYEQUE", label: "Lambayeque" },
  { value: "LIMA", label: "Lima" },
  { value: "LORETO", label: "Loreto" },
  { value: "MADRE_DE_DIOS", label: "Madre de Dios" },
  { value: "MOQUEGUA", label: "Moquegua" },
  { value: "PASCO", label: "Pasco" },
  { value: "PIURA", label: "Piura" },
  { value: "PUNO", label: "Puno" },
  { value: "SAN_MARTIN", label: "San Martín" },
  { value: "TACNA", label: "Tacna" },
  { value: "TUMBES", label: "Tumbes" },
  { value: "UCAYALI", label: "Ucayali" },
];

interface CreateHealthCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateHealthCenterDialog({
  open,
  onOpenChange,
}: CreateHealthCenterDialogProps) {
  const createMutation = useCreateHealthCenter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", department: "" },
  });

  const department = watch("department");

  function handleClose() {
    onOpenChange(false);
    reset();
  }

  async function onSubmit(values: FormValues) {
    await createMutation.mutateAsync({
      name: values.name.toUpperCase(),
      department: values.department as PeruDepartment,
    });
    handleClose();
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

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!department || createMutation.isPending}
            >
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
