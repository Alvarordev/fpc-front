import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuthStore } from "@/store/auth-store";
import { contactsApi } from "@/lib/api";
import { usePatient } from "../../_hooks/use-patient";
import { toast } from "sonner";
import type { ContactType, ContactPurpose } from "@/types";

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

const scheduleSchema = z.object({
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

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const completeSchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED", "NO_ANSWER"] as const),
  date: z.string().min(1, "Fecha requerida"),
  time: z.string().min(1, "Hora requerida"),
  notes: z.string().optional(),
});

type CompleteFormValues = z.infer<typeof completeSchema>;

export function ContactContent() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contactId") ?? undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const isScheduleMode = !contactId;

  const { data: patient, isLoading: loadingPatient } = usePatient(id!);

  // Schedule form
  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      type: "CALL",
      purpose: "FOLLOW_UP",
      date: new Date().toISOString().slice(0, 10),
      time: "",
      notes: "",
    },
  });

  // Complete form
  const completeForm = useForm<CompleteFormValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      status: "COMPLETED",
      date: new Date().toISOString().slice(0, 10),
      time: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      patientId: string;
      agentId: string;
      type: string;
      status: string;
      purpose: string;
      scheduledAt: string;
      notes?: string;
    }) => contactsApi.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", id] });
      toast.success("Contacto agendado correctamente");
      navigate(`/pacientes/${id}`);
    },
    onError: (err: Error) => {
      toast.error("Error al agendar", { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ cId, data }: { cId: string; data: any }) =>
      contactsApi.update(cId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", id] });
      toast.success("Contacto actualizado");
      navigate(`/pacientes/${id}`);
    },
    onError: (err: Error) => {
      toast.error("Error al actualizar", { description: err.message });
    },
  });

  if (loadingPatient) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">Paciente no encontrado.</p>
      </div>
    );
  }

  async function onSchedule(values: ScheduleFormValues) {
    if (!user) return;
    const scheduledAt = `${values.date}T${values.time}:00`;
    await createMutation.mutateAsync({
      patientId: id!,
      agentId: user.id,
      type: values.type,
      status: "SCHEDULED",
      purpose: values.purpose,
      scheduledAt,
      notes: values.notes || undefined,
    });
  }

  async function onComplete(values: CompleteFormValues) {
    if (!contactId) return;
    const completedAt = `${values.date}T${values.time}:00`;
    await updateMutation.mutateAsync({
      cId: contactId,
      data: {
        status: values.status,
        completedAt,
        notes: values.notes || undefined,
      },
    });
  }

  const allPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => navigate(`/pacientes/${id}`)}
      >
        <ArrowLeft className="size-3.5" />
        Volver al paciente
      </Button>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {isScheduleMode ? "Agendar contacto" : "Completar contacto"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isScheduleMode
            ? `Programá un nuevo contacto con ${patient.fullName}.`
            : `Registrá el resultado del contacto con ${patient.fullName}.`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isScheduleMode ? "Datos del agendamiento" : "Resultado del contacto"}
          </CardTitle>
          <CardDescription>
            {isScheduleMode
              ? "Indicá cuándo y cómo se realizará el contacto."
              : "Registrá el estado y las notas del contacto."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isScheduleMode ? (
            <form onSubmit={scheduleForm.handleSubmit(onSchedule)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={scheduleForm.watch("type")}
                    onValueChange={(v) =>
                      scheduleForm.setValue("type", v as ContactType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    value={scheduleForm.watch("purpose")}
                    onValueChange={(v) =>
                      scheduleForm.setValue("purpose", v as ContactPurpose)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(purposeLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" {...scheduleForm.register("date")} />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input type="time" {...scheduleForm.register("time")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  {...scheduleForm.register("notes")}
                  className="min-h-24 resize-none"
                  placeholder="Observaciones sobre el agendamiento..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/pacientes/${id}`)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={allPending}>
                  {allPending ? "Agendando..." : "Agendar contacto"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={completeForm.handleSubmit(onComplete)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={completeForm.watch("status")}
                    onValueChange={(v) =>
                      completeForm.setValue("status", v as CompleteFormValues["status"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETED">Completado</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      <SelectItem value="NO_ANSWER">No contestó</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" {...completeForm.register("date")} />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input type="time" {...completeForm.register("time")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  {...completeForm.register("notes")}
                  className="min-h-24 resize-none"
                  placeholder="Resumen de lo hablado, acuerdos y observaciones..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/pacientes/${id}`)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={allPending}>
                  {allPending ? "Guardando..." : "Guardar contacto"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
