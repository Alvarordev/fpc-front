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
import type { ContactType, ContactPurpose } from "@/types";

const schema = z.object({
  type: z.enum(["CALL", "WHATSAPP", "VIDEO_CALL", "EMAIL", "IN_PERSON"] as const),
  purpose: z.enum([
    "FIRST_CONTACT",
    "ENROLLMENT",
    "FOLLOW_UP",
    "PSYCHOONCOLOGY_REFERRAL",
    "OTHER",
  ] as const),
  date: z.string().min(1, "Fecha requerida"),
  time: z.string().min(1, "Hora requerida"),
  notes: z.string().optional(),
});

export type ScheduleFormValues = z.infer<typeof schema>;

const typeLabels: Record<ContactType, string> = {
  CALL: "Llamada",
  WHATSAPP: "WhatsApp",
  VIDEO_CALL: "Videollamada",
  EMAIL: "Email",
  IN_PERSON: "Presencial",
};

const purposeLabels: Record<ContactPurpose, string> = {
  FIRST_CONTACT: "Primer contacto",
  ENROLLMENT: "Enrolamiento",
  FOLLOW_UP: "Seguimiento",
  PSYCHOONCOLOGY_REFERRAL: "Derivación a psicooncología",
  OTHER: "Otro",
};

interface ScheduleContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ScheduleFormValues) => Promise<void>;
  isPending: boolean;
}

export function ScheduleContactDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: ScheduleContactDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "CALL",
      purpose: "FOLLOW_UP",
      date: new Date().toISOString().slice(0, 10),
      time: "",
      notes: "",
    },
  });

  const selectedType = watch("type");
  const selectedPurpose = watch("purpose");

  function handleClose() {
    onOpenChange(false);
    reset();
  }

  async function submit(values: ScheduleFormValues) {
    await onSubmit(values);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar contacto</DialogTitle>
          <DialogDescription>
            Programá un nuevo contacto de seguimiento para este paciente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => setValue("type", v as ContactType)}
              >
                <SelectTrigger className="w-full">
                  {selectedType ? typeLabels[selectedType] : <SelectValue placeholder="Seleccionar tipo" />}
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Propósito</Label>
              <Select
                value={selectedPurpose}
                onValueChange={(v) => setValue("purpose", v as ContactPurpose)}
              >
                <SelectTrigger className="w-full">
                  {selectedPurpose ? purposeLabels[selectedPurpose] : <SelectValue placeholder="Seleccionar propósito" />}
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(purposeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" {...register("time")} />
              {errors.time && (
                <p className="text-xs text-destructive">
                  {errors.time.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              {...register("notes")}
              className="min-h-20 resize-none"
              placeholder="Observaciones sobre el agendamiento..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Agendando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
