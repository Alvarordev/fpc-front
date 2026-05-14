import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { patientsApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useEnrollmentStore, TOTAL_STEPS } from "../_store/enrollment-store";
import { EnrollmentStepper } from "./enrollment-stepper";
import { Step1Inicio } from "./steps/step-1-inicio";
import { Step2Paciente } from "./steps/step-2-paciente";
import { Step3Demograficos } from "./steps/step-3-demograficos";
import { Step4Seguro } from "./steps/step-4-seguro";
import { Step5Diagnostico } from "./steps/step-5-diagnostico";
import { Step6Cierre } from "./steps/step-6-cierre";
import { toast } from "sonner";
import type { FullEnrollmentRequest } from "@/types";

function CurrentStep({ step }: { step: number }) {
  switch (step) {
    case 1: return <Step1Inicio />;
    case 2: return <Step2Paciente />;
    case 3: return <Step3Demograficos />;
    case 4: return <Step4Seguro />;
    case 5: return <Step5Diagnostico />;
    case 6: return <Step6Cierre />;
    default: return <Step1Inicio />;
  }
}

export function EnrollmentShell() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { currentStep, draft, nextStep, prevStep, setSubmitting, isSubmitting, reset } =
    useEnrollmentStore();

  const isLastStep = currentStep === TOTAL_STEPS;

  const enrollMutation = useMutation({
    mutationFn: (data: FullEnrollmentRequest) => patientsApi.enroll(data),
    onSuccess: () => {
      toast.success("Paciente enrolado correctamente");
      reset();
      navigate("/pacientes");
    },
    onError: (err: Error) => {
      toast.error("Error al enrolar", { description: err.message });
      setSubmitting(false);
    },
  });

  async function handleSubmit() {
    setSubmitting(true);

    const payload: FullEnrollmentRequest = {
      patientId: draft.patientId,
      patientData: draft.patientData.fullName ? draft.patientData : undefined,
      details: draft.details,
      insurance: draft.insurance.insuranceType ? draft.insurance : undefined,
      symptomReport: draft.symptomReport.hasDiscomfort !== undefined ? draft.symptomReport : null,
      diagnosis: draft.diagnosis.diagnosis ? draft.diagnosis : undefined,
      treatment: draft.treatment.treatmentType ? draft.treatment : undefined,
      medicalAppointments: draft.medicalAppointments.length > 0 ? draft.medicalAppointments : null,
      sisAffiliation: draft.sisAffiliation.canAffiliate !== undefined ? draft.sisAffiliation : null,
      companions: draft.companions.length > 0 ? draft.companions : null,
      enrollmentMetadata: {
        ...draft.enrollmentMetadata,
        agentId: user?.id,
        startTime: new Date().toISOString(),
        affiliationType: "PATIENT",
      },
    };

    await enrollMutation.mutateAsync(payload);
  }

  const isPending = isSubmitting || enrollMutation.isPending;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-center border-b border-border/50 bg-background px-6 py-4">
        <EnrollmentStepper currentStep={currentStep} />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-10">
            <CurrentStep step={currentStep} />

            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={currentStep === 1 ? () => navigate("/pacientes") : prevStep}
              >
                <ArrowLeft className="size-3.5 mr-1" />
                {currentStep === 1 ? "Cancelar" : "Anterior"}
              </Button>

              {isLastStep ? (
                <Button size="sm" onClick={handleSubmit} disabled={isPending}>
                  <Check className="size-3.5 mr-1" />
                  {isPending ? "Enrolando..." : "Completar enrolamiento"}
                </Button>
              ) : (
                <Button size="sm" onClick={nextStep}>
                  Siguiente
                  <ArrowRight className="size-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
