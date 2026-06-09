import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock } from "lucide-react";
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
import { contactsApi, agentsApi, patientsApi, alertsApi, appointmentsApi } from "@/lib/api";
import { usePatient } from "../../_hooks/use-patient";
import { usePatientAppointments } from "../../_hooks/use-appointments";
import { ContactAside } from "./contact-aside";
import {
  PatientUpdateTabs,
  patientDetailsDefaults,
  diagnosisDefaults,
  treatmentDefaults,
  insuranceDefaults,
  serviceReferralDefaults,
  triToBool,
  type PatientDetailsFormValues,
  type DiagnosisFormValues,
  type TreatmentFormValues,
  type InsuranceFormValues,
  type ServiceReferralFormValues,
} from "./patient-update-tabs";
import { PsicoSessionDialog, type PsicoFormValues } from "./psico-session-dialog";
import { AlertDialog, type AlertFormValues } from "./alert-dialog";
import { ScheduleContactDialog } from "../../_components/schedule-contact-dialog";
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
  purpose: z.enum(["FIRST_CONTACT", "ENROLLMENT", "FOLLOW_UP", "PSYCHOONCOLOGY_REFERRAL", "OTHER"] as const),
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

function formatShortDate(fecha: string): string {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

function extractDate(datetime: string | null): string | null {
  if (!datetime) return null;
  return datetime.slice(0, 10);
}

function extractTime(datetime: string | null): string | null {
  if (!datetime) return null;
  return datetime.slice(11, 16);
}

export function ContactContent() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contactId") ?? undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const isScheduleMode = !contactId;

  const { data: patient, isLoading: loadingPatient } = usePatient(id!);

  // Existing psychooncology appointments — used to auto-compute sessionNumber
  const { data: existingAppointments = [] } = usePatientAppointments(id!);

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list(),
    staleTime: 60 * 1000,
  });

  const { data: existingContact, isLoading: loadingContact } = useQuery({
    queryKey: ["contact", contactId],
    queryFn: () => contactsApi.getById(contactId!),
    enabled: Boolean(contactId),
  });

  // Dialogs state
  const [psicoOpen, setPsicoOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [nextContactOpen, setNextContactOpen] = useState(false);
  const [psicoDraft, setPsicoDraft] = useState<PsicoFormValues | null>(null);
  const [alertDraft, setAlertDraft] = useState<AlertFormValues | null>(null);
  const [nextContactDraft, setNextContactDraft] = useState<ScheduleFormValues | null>(null);

  // Schedule form
  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { type: "CALL", purpose: "FOLLOW_UP", date: new Date().toISOString().slice(0, 10), time: "", notes: "" },
  });

  // Complete form
  const completeForm = useForm<CompleteFormValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: { status: "COMPLETED", date: new Date().toISOString().slice(0, 10), time: "", notes: "" },
  });

  // Patient sub-entity forms
  const detailsForm = useForm<PatientDetailsFormValues>({ defaultValues: patientDetailsDefaults });
  const diagnosisForm = useForm<DiagnosisFormValues>({ defaultValues: diagnosisDefaults });
  const treatmentForm = useForm<TreatmentFormValues>({ defaultValues: treatmentDefaults });
  const insuranceForm = useForm<InsuranceFormValues>({ defaultValues: insuranceDefaults });
  const serviceReferralForm = useForm<ServiceReferralFormValues>({ defaultValues: serviceReferralDefaults });

  // Pre-fill complete form with existing contact data
  useEffect(() => {
    if (existingContact && !isScheduleMode) {
      completeForm.reset({
        status: "COMPLETED",
        date: extractDate(existingContact.scheduledAt) ?? new Date().toISOString().slice(0, 10),
        time: extractTime(existingContact.scheduledAt) ?? "",
        notes: existingContact.notes ?? "",
      });
    }
  }, [existingContact, isScheduleMode, completeForm]);

  // Pre-fill only the details form with existing patient data (it's an UPDATE operation).
  // Diagnosis, treatment, and insurance forms are intentionally NOT pre-filled because
  // they trigger CREATE operations that would duplicate existing records.
  useEffect(() => {
    if (!patient) return;

    const d = patient.details;
    detailsForm.reset({
      currentAddress: d?.currentAddress ?? "",
      currentDistrict: d?.currentDistrict ?? "",
      currentDepartment: d?.currentDepartment ?? "",
      emergencyContactName: d?.emergencyContactName ?? "",
      emergencyContactPhone: d?.emergencyContactPhone ?? "",
      educationLevel: d?.educationLevel ?? "",
      nativeLanguage: d?.nativeLanguage ?? "",
      requiresTranslation: d?.requiresTranslation ?? false,
      zoneType: d?.zoneType ?? "",
      emergencyContactGender: d?.emergencyContactGender ?? "",
      evidenceOfDomesticViolence: d?.evidenceOfDomesticViolence === true ? "si" : d?.evidenceOfDomesticViolence === false ? "no" : "",
      usesWoodStove: d?.usesWoodStove === true ? "si" : d?.usesWoodStove === false ? "no" : "",
      isWorking: d?.isWorking === true ? "si" : d?.isWorking === false ? "no" : "",
      receivesFinancialSupport: d?.receivesFinancialSupport === true ? "si" : d?.receivesFinancialSupport === false ? "no" : "",
      referredToSocialWorker: d?.referredToSocialWorker === true ? "si" : d?.referredToSocialWorker === false ? "no" : "",
      hasConadisCard: d?.hasConadisCard === true ? "si" : d?.hasConadisCard === false ? "no" : "",
      knowsAboutFissal: d?.knowsAboutFissal === true ? "si" : d?.knowsAboutFissal === false ? "no" : "",
      isDeceased: d?.isDeceased === true ? "si" : d?.isDeceased === false ? "no" : "",
      programDropoutReason: d?.programDropoutReason ?? "",
      programDropoutDate: d?.programDropoutDate ?? "",
    });
  }, [patient, detailsForm]);

  // Mutations
  const createContactMutation = useMutation({
    mutationFn: (data: any) => contactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", id] });
      toast.success("Contacto agendado correctamente");
      navigate(`/pacientes/${id}`);
    },
    onError: (err: Error) => toast.error("Error al agendar", { description: err.message }),
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ cId, data }: { cId: string; data: any }) => contactsApi.update(cId, data),
    onError: (err: Error) => toast.error("Error al actualizar contacto", { description: err.message }),
  });

  const addDiagnosisMutation = useMutation({
    mutationFn: (data: any) => patientsApi.addDiagnosis(id!, data),
    onError: (err: Error) => toast.error("Error al guardar diagnóstico", { description: err.message }),
  });

  const addTreatmentMutation = useMutation({
    mutationFn: (data: any) => patientsApi.addTreatment(id!, data),
    onError: (err: Error) => toast.error("Error al guardar tratamiento", { description: err.message }),
  });

  const addInsuranceMutation = useMutation({
    mutationFn: (data: any) => patientsApi.addInsurance(id!, data),
    onError: (err: Error) => toast.error("Error al guardar seguro", { description: err.message }),
  });

  const addSisMutation = useMutation({
    mutationFn: (data: any) => patientsApi.addSis(id!, data),
    onError: (err: Error) => toast.error("Error al guardar SIS", { description: err.message }),
  });

  const updateDetailsMutation = useMutation({
    mutationFn: (data: any) => patientsApi.updateDetails(id!, data),
    onError: (err: Error) => toast.error("Error al actualizar datos", { description: err.message }),
  });

  const createAlertMutation = useMutation({
    mutationFn: (data: any) => alertsApi.create(data),
    onError: (err: Error) => toast.error("Error al crear alerta", { description: err.message }),
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: any) => appointmentsApi.create(data),
    onError: (err: any) => {
      console.error("[PsicoSession] API error:", err);
      console.error("[PsicoSession] Error status:", err?.status);
      console.error("[PsicoSession] Error body:", JSON.stringify(err?.body, null, 2));
      toast.error("Error al agendar sesión", { description: err.message });
    },
  });

  const createNextContactMutation = useMutation({
    mutationFn: (data: any) => contactsApi.create(data),
    onError: (err: Error) => toast.error("Error al agendar siguiente contacto", { description: err.message }),
  });

  const isLoading = loadingPatient || (!isScheduleMode && loadingContact);

  // --- Schedule submit ---
  async function onSchedule(values: ScheduleFormValues) {
    if (!user) return;

    let agentId: string | undefined;
    if (user.role === "AGENT") {
      const agent = agents.find((a) => a.userId === user.id);
      agentId = agent?.id;
    } else if (user.role === "ADMIN") {
      agentId = agents[0]?.id;
    }
    if (!agentId) {
      toast.error("No se encontró un agente asociado a tu cuenta");
      return;
    }

    await createContactMutation.mutateAsync({
      patientId: id!,
      agentId,
      type: values.type,
      status: "SCHEDULED",
      purpose: values.purpose,
      scheduledAt: `${values.date}T${values.time}:00`,
      notes: values.notes || undefined,
    });
  }

  // --- Complete submit ---
  async function onComplete(values: CompleteFormValues) {
    if (!contactId) return;

    // 1. Update contact
    const srValues = serviceReferralForm.getValues();
    const hasServiceReferral = Object.entries(srValues).some(
      ([k, v]) => k !== "susaludRegistrationNumber" && k !== "programSatisfaction" && k !== "wellbeingChanges"
        ? v === true
        : v !== "" && v !== false
    );
    await updateContactMutation.mutateAsync({
      cId: contactId,
      data: {
        status: values.status,
        completedAt: `${values.date}T${values.time}:00`,
        notes: values.notes || undefined,
        ...(hasServiceReferral && {
          serviceReferral: {
            referredToSocialWorker: srValues.referredToSocialWorker || undefined,
            referredToSusalud: srValues.referredToSusalud || undefined,
            susaludRegistrationNumber: srValues.susaludRegistrationNumber || undefined,
            receivedFoodGuide: srValues.receivedFoodGuide || undefined,
            participatesInGam: srValues.participatesInGam || undefined,
            programSatisfaction: srValues.programSatisfaction || undefined,
            wellbeingChanges: srValues.wellbeingChanges || undefined,
            knowsAboutFissal: srValues.knowsAboutFissal || undefined,
            referredToPaus: srValues.referredToPaus || undefined,
            referredToDae: srValues.referredToDae || undefined,
            referredToFissal: srValues.referredToFissal || undefined,
          },
        }),
      },
    });

    // 2. Patient details if any field was filled
    const detailValues = detailsForm.getValues();
    const hasDetailChanges = Object.values(detailValues).some(
      (v) => v !== "" && v !== false && v !== null && v !== undefined
    );
    if (hasDetailChanges) {
      await updateDetailsMutation.mutateAsync({
        currentAddress: detailValues.currentAddress || undefined,
        currentDistrict: detailValues.currentDistrict || undefined,
        currentDepartment: detailValues.currentDepartment || undefined,
        emergencyContactName: detailValues.emergencyContactName || undefined,
        emergencyContactPhone: detailValues.emergencyContactPhone || undefined,
        educationLevel: detailValues.educationLevel || undefined,
        nativeLanguage: detailValues.nativeLanguage || undefined,
        requiresTranslation: detailValues.requiresTranslation || undefined,
        zoneType: detailValues.zoneType || undefined,
        emergencyContactGender: detailValues.emergencyContactGender || undefined,
        evidenceOfDomesticViolence: triToBool(detailValues.evidenceOfDomesticViolence),
        usesWoodStove: triToBool(detailValues.usesWoodStove),
        isWorking: triToBool(detailValues.isWorking),
        receivesFinancialSupport: triToBool(detailValues.receivesFinancialSupport),
        referredToSocialWorker: triToBool(detailValues.referredToSocialWorker),
        hasConadisCard: triToBool(detailValues.hasConadisCard),
        knowsAboutFissal: triToBool(detailValues.knowsAboutFissal),
        isDeceased: triToBool(detailValues.isDeceased),
        programDropoutReason: detailValues.programDropoutReason || undefined,
        programDropoutDate: detailValues.programDropoutDate || undefined,
      });
    }

    // 3. Diagnosis
    let createdDiagnosisId: string | null = null;
    const diagValues = diagnosisForm.getValues();
    if (diagValues.diagnosis.trim()) {
      const result = await addDiagnosisMutation.mutateAsync({
        diagnosis: diagValues.diagnosis,
        cancerStage: diagValues.cancerStage,
        diagnosisDate: diagValues.diagnosisDate || undefined,
        healthCenterId: diagValues.healthCenterId || undefined,
        symptomLeadingToCheckup: diagValues.symptomLeadingToCheckup || undefined,
        waitTimeForDiagnosis: diagValues.waitTimeForDiagnosis || undefined,
        hasMedicalReport: diagValues.hasMedicalReport,
        isCurrent: true,
        contactId,
      });
      // Extract the ID from the returned Patient response — the new diagnosis is the last one
      const updatedPatient = result as any;
      const newDiags = updatedPatient?.diagnoses ?? [];
      if (newDiags.length > 0) {
        createdDiagnosisId = newDiags[newDiags.length - 1].id;
      }
    }

    // 4. Treatment
    const treatValues = treatmentForm.getValues();
    const treatDiagnosisId = treatValues.diagnosisId || createdDiagnosisId || undefined;
    if (treatValues.treatmentType.trim() && treatDiagnosisId) {
      await addTreatmentMutation.mutateAsync({
        diagnosisId: treatDiagnosisId,
        treatmentType: treatValues.treatmentType,
        treatmentFrequency: treatValues.treatmentFrequency || undefined,
        healthCenterId: treatValues.healthCenterId || undefined,
        startDate: treatValues.startDate || undefined,
        isCurrent: true,
        contactId,
      });
    }

    // 5. Insurance — only if agent explicitly selected an insurance type
    const insValues = insuranceForm.getValues();
    if (insValues.insuranceType) {
      await addInsuranceMutation.mutateAsync({
        insuranceType: insValues.insuranceType as any,
        epsProvider: insValues.insuranceType === "EPS" && insValues.epsProvider ? insValues.epsProvider : undefined,
        isCurrent: true,
        changeReason: insValues.changeReason || undefined,
        startDate: insValues.startDate || undefined,
        contactId,
      });
    }

    // 6. SIS (only if agent explicitly selected "NONE" as insurance)
    if (insValues.insuranceType === "NONE") {
      await addSisMutation.mutateAsync({
        canAffiliate: insValues.canAffiliate,
        expectedDate: insValues.expectedDate || undefined,
        contactId,
      });
    }

    // 7. Alert
    if (alertDraft) {
      let agentId: string | undefined;
      if (user?.role === "AGENT") {
        const agent = agents.find((a) => a.userId === user.id);
        agentId = agent?.id;
      } else if (user?.role === "ADMIN") {
        agentId = agents[0]?.id;
      }
      await createAlertMutation.mutateAsync({
        healthCenterId: alertDraft.healthCenterId,
        contactId,
        createdByAgentId: agentId,
        title: alertDraft.title,
        description: alertDraft.description,
      });
    }

    // 8. Psico session
    if (psicoDraft) {
      try {
        // sessionNumber = existing appointments count + 1 (or 1 if none)
        const nextSessionNumber = existingAppointments.length + 1;
        const scheduledAt = psicoDraft.slotDate && psicoDraft.slotStartTime
          ? `${psicoDraft.slotDate}T${psicoDraft.slotStartTime}`
          : new Date().toISOString();

        const payload = {
          patientId: id!,
          volunteerId: psicoDraft.volunteerId,
          contactId,
          availabilityId: psicoDraft.slotId,
          modality: psicoDraft.modality,
          scheduledAt,
          sessionNumber: nextSessionNumber,
          isAdditionalSession: nextSessionNumber > 4,
          patientEmail: null,
        };

        console.log("[PsicoSession] Sending payload:", JSON.stringify(payload, null, 2));
        console.log("[PsicoSession] Field types:", Object.entries(payload).map(([k, v]) => `${k}: ${typeof v} = ${v}`));

        await createSessionMutation.mutateAsync(payload);
        toast.success("Psicosesión agendada correctamente");
      } catch (err) {
        console.error("[PsicoSession] Mutation failed:", err);
        if (err instanceof Error) {
          console.error("[PsicoSession] Error name:", err.name);
          console.error("[PsicoSession] Error message:", err.message);
          console.error("[PsicoSession] Error stack:", err.stack);
        }
        // Error toast already shown by mutation's onError — don't block success flow
      }
    }

    // 9. Next contact (siguiente contacto)
    let createdNextContactId: string | null = null;
    if (nextContactDraft) {
      let agentId: string | undefined;
      if (user?.role === "AGENT") {
        const agent = agents.find((a) => a.userId === user.id);
        agentId = agent?.id;
      } else if (user?.role === "ADMIN") {
        agentId = agents[0]?.id;
      }
      if (agentId) {
        const result = await createNextContactMutation.mutateAsync({
          patientId: id!,
          agentId,
          type: nextContactDraft.type,
          status: "SCHEDULED",
          purpose: nextContactDraft.purpose,
          scheduledAt: `${nextContactDraft.date}T${nextContactDraft.time}:00`,
          notes: nextContactDraft.notes || undefined,
        });
        createdNextContactId = (result as any)?.id ?? null;
      }
    }

    // 10. Link current contact to next contact
    if (createdNextContactId) {
      await updateContactMutation.mutateAsync({
        cId: contactId,
        data: { scheduledNextContactId: createdNextContactId },
      });
    }

    // Success
    queryClient.invalidateQueries({ queryKey: ["contacts", id] });
    queryClient.invalidateQueries({ queryKey: ["patient", id] });
    queryClient.invalidateQueries({ queryKey: ["appointments", id] });
    toast.success("Contacto completado correctamente");
    navigate(`/pacientes/${id}`);
  }

  const allPending =
    createContactMutation.isPending ||
    updateContactMutation.isPending ||
    addDiagnosisMutation.isPending ||
    addTreatmentMutation.isPending ||
    addInsuranceMutation.isPending ||
    addSisMutation.isPending ||
    updateDetailsMutation.isPending ||
    createAlertMutation.isPending ||
    createSessionMutation.isPending ||
    createNextContactMutation.isPending;

  const form = isScheduleMode ? scheduleForm : completeForm;
  const onSubmitFn = isScheduleMode
    ? (form.handleSubmit(onSchedule as any) as any)
    : (form.handleSubmit(onComplete as any) as any);

  // --- Render ---

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

  if (!isScheduleMode && !loadingContact && !existingContact) {
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(`/pacientes/${id}`)}>
          <ArrowLeft className="size-3.5" />
          Volver al paciente
        </Button>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">Contacto no encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(`/pacientes/${id}`)}>
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

      {/* Scheduled contact info banner — completar mode */}
      {!isScheduleMode && existingContact && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <CalendarClock className="size-5 text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">
              Agendado para{" "}
              {formatShortDate(extractDate(existingContact.scheduledAt) ?? "")}
              {extractTime(existingContact.scheduledAt) ? ` a las ${extractTime(existingContact.scheduledAt)}` : ""}
            </p>
            {existingContact.notes && (
              <p className="text-xs text-amber-700/80 mt-0.5 line-clamp-1">{existingContact.notes}</p>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando contacto...</p>
        </div>
      ) : (
        <form onSubmit={onSubmitFn}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Main card */}
            <Card className="xl:col-span-2 border-border/60">
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
              <CardContent className="space-y-4">
                {isScheduleMode ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={scheduleForm.watch("type")}
                          onValueChange={(v) => scheduleForm.setValue("type", v as ContactType)}
                        >
                          <SelectTrigger>
                            {scheduleForm.watch("type") ? typeLabels[scheduleForm.watch("type")] : <SelectValue placeholder="Seleccionar tipo" />}
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(typeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Propósito</Label>
                        <Select
                          value={scheduleForm.watch("purpose")}
                          onValueChange={(v) => scheduleForm.setValue("purpose", v as ContactPurpose)}
                        >
                          <SelectTrigger>
                            {scheduleForm.watch("purpose") ? purposeLabels[scheduleForm.watch("purpose")] : <SelectValue placeholder="Seleccionar propósito" />}
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(purposeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
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
                      <Textarea {...scheduleForm.register("notes")} className="min-h-24 resize-none" placeholder="Observaciones sobre el agendamiento..." />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select
                          value={completeForm.watch("status")}
                          onValueChange={(v) => completeForm.setValue("status", v as CompleteFormValues["status"])}
                        >
                          <SelectTrigger>
                            {completeForm.watch("status")
                              ? ({ COMPLETED: "Completado", CANCELLED: "Cancelado", NO_ANSWER: "No contestó" })[completeForm.watch("status")]
                              : <SelectValue placeholder="Seleccionar estado" />}
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
                      <Textarea {...completeForm.register("notes")} className="min-h-24 resize-none" placeholder="Resumen de lo hablado, acuerdos y observaciones..." />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Aside */}
            <ContactAside
              isScheduleMode={isScheduleMode}
              isPending={allPending}
              onPsicoOpen={() => setPsicoOpen(true)}
              onAlertOpen={() => setAlertOpen(true)}
              onNextContactOpen={() => setNextContactOpen(true)}
              psicoDraft={!!psicoDraft}
              alertDraft={!!alertDraft}
              nextContactDraft={!!nextContactDraft}
              onClearNextContact={() => setNextContactDraft(null)}
              onCancel={() => navigate(`/pacientes/${id}`)}
            />
          </div>

          {/* Patient update tabs — only in completar mode */}
          {!isScheduleMode && (
            <Card className="mt-5 border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Actualización de la ficha del paciente</CardTitle>
                <CardDescription>Estos datos se guardan junto con el contacto.</CardDescription>
              </CardHeader>
              <CardContent>
                <PatientUpdateTabs
                  pacienteId={id!}
                  detailsForm={detailsForm as any}
                  diagnosisForm={diagnosisForm as any}
                  treatmentForm={treatmentForm as any}
                  insuranceForm={insuranceForm as any}
                  serviceReferralForm={serviceReferralForm as any}
                />
              </CardContent>
            </Card>
          )}
        </form>
      )}

      {/* Dialogs */}
      <ScheduleContactDialog
        open={nextContactOpen}
        onOpenChange={setNextContactOpen}
        onSubmit={async (values) => {
          setNextContactDraft(values);
          setNextContactOpen(false);
        }}
        isPending={false}
      />
      <PsicoSessionDialog
        open={psicoOpen}
        onOpenChange={setPsicoOpen}
        onSave={setPsicoDraft}
      />
      <AlertDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onSave={setAlertDraft}
      />
    </div>
  );
}
