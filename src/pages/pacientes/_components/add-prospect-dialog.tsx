import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ENTRY_POINTS = [
  "Llamada directa",
  "Referido por paciente",
  "Referido por Voluntario",
  "Redes Sociales de FPC",
  "Campaña prevención",
  "Centro de salud/hospital",
  "Otro",
] as const;

const schema = z.object({
  fullName: z.string().min(1, "Nombre requerido"),
  phone: z.string().min(1, "Celular requerido"),
  dni: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  diagnosisNote: z.string().optional(),
  entryChannel: z.string().optional(),
  customEntryChannel: z.string().optional(),
  isOncological: z.boolean(),
  scheduledDate: z.string().min(1, "Fecha requerida"),
  scheduledTime: z.string().min(1, "Hora requerida"),
  additionalNotes: z.string().optional(),
});

export type AddProspectFormValues = z.infer<typeof schema>;

interface AddProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AddProspectFormValues) => Promise<void>;
  isPending: boolean;
}

const fl = "text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70";
const ic = "bg-card border";

export function AddProspectDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: AddProspectDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddProspectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      phone: "",
      dni: "",
      email: "",
      diagnosisNote: "",
      entryChannel: "",
      customEntryChannel: "",
      isOncological: false,
      scheduledDate: "",
      scheduledTime: "",
      additionalNotes: "",
    },
  });

  const isOncological = watch("isOncological");

  // Canal de ingreso — local state for conditional "Otro" input
  const [entryPoint, setEntryPoint] = useState("");
  const [customEntryPoint, setCustomEntryPoint] = useState("");

  function handleClose() {
    onOpenChange(false);
    reset();
    setEntryPoint("");
    setCustomEntryPoint("");
  }

  async function submit(data: AddProspectFormValues) {
    await onSubmit(data);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar prospecto</DialogTitle>
          <DialogDescription>
            Registrá un nuevo paciente como prospecto y agendá un primer
            contacto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-6 py-2">
          {/* --- Datos del paciente --- */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Datos del paciente
            </p>

            <div className="flex flex-col gap-2">
              <Label className={fl}>
                Nombre completo <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Tal como aparece en el DNI"
                className={ic}
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Celular <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="987654321"
                  className={ic}
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>DNI</Label>
                <Input
                  placeholder="74829304"
                  className={ic}
                  {...register("dni")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className={fl}>Correo electrónico</Label>
              <Input
                type="email"
                placeholder="paciente@correo.com"
                className={ic}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label className={fl}>Canal de ingreso</Label>
              <Select
                value={entryPoint}
                onValueChange={(v) => {
                  if (!v) return;
                  setEntryPoint(v);
                  setCustomEntryPoint("");
                  if (v === "Otro") {
                    setValue("entryChannel", v);
                    setValue("customEntryChannel", "");
                  } else {
                    setValue("entryChannel", v);
                    setValue("customEntryChannel", "");
                  }
                }}
              >
                <SelectTrigger className="w-full bg-card border">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {ENTRY_POINTS.map((ep) => (
                    <SelectItem key={ep} value={ep}>
                      {ep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {entryPoint === "Otro" && (
              <div className="flex flex-col gap-2">
                <Label className={fl}>Especificar canal</Label>
                <Input
                  placeholder="Describa el punto de ingreso"
                  className={ic}
                  value={customEntryPoint}
                  onChange={(e) => {
                    setCustomEntryPoint(e.target.value);
                    setValue("customEntryChannel", e.target.value);
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label className={fl}>
                ¿Es paciente oncológico?
              </Label>
              <Select
                value={isOncological ? "Sí" : "No"}
                onValueChange={(v) => setValue("isOncological", v === "Sí")}
              >
                <SelectTrigger className="w-full bg-card border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sí">Sí</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className={fl}>Diagnóstico / Nota</Label>
              <Textarea
                placeholder="Diagnóstico presuntivo, observaciones relevantes..."
                className="min-h-20 resize-none bg-card border"
                {...register("diagnosisNote")}
              />
            </div>
          </div>

          {/* --- Agendamiento del primer contacto --- */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Agendamiento del primer contacto
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Fecha agendada <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  className={ic}
                  {...register("scheduledDate")}
                />
                {errors.scheduledDate && (
                  <p className="text-xs text-destructive">
                    {errors.scheduledDate.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Hora agendada <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="time"
                  className={ic}
                  {...register("scheduledTime")}
                />
                {errors.scheduledTime && (
                  <p className="text-xs text-destructive">
                    {errors.scheduledTime.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className={fl}>Notas adicionales</Label>
              <Textarea
                placeholder="Observaciones sobre el agendamiento..."
                className="min-h-20 resize-none bg-card border"
                {...register("additionalNotes")}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear prospecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
