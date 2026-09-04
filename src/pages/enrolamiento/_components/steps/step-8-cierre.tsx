import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, ClipboardCheck } from "lucide-react"
import { agentsApi } from "@/api/agents"
import { enrollmentsApi } from "@/api/enrollments"
import { historicalRecordsApi } from "@/api/historical-records"
import { useAuthStore } from "@/store/auth-store"
import { useEnrollmentStore } from "../../_store/enrollment-store"
import { StepContainer, StepHeader, SectionHeader, StepNav } from "../shared"
import { toast } from "sonner"
import { buildEnrollmentPayload } from "./step-8-payload"

interface Step8CierreProps {
  historical?: boolean
  embedded?: boolean
}

export function Step8Cierre({
  historical = false,
  embedded = false,
}: Step8CierreProps) {
  const {
    draft,
    updateDraft,
    prevStep,
    isComplete,
    completeEnrollment,
    resetEnrollment,
    categoriaClinica,
    setHistoricalResult,
    historicalPatientId,
  } = useEnrollmentStore()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const meta = draft.enrollmentMetadata
  const now = new Date().toTimeString().slice(0, 5)

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list(),
    staleTime: 60 * 1000,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const agentId =
        user?.role === "AGENT"
          ? agents.find((agent) => agent.userId === user.id)?.id
          : meta.assignedAgentId
      if (!agentId)
        throw new Error("Seleccione un agente responsable antes de finalizar")
      if (
        (meta.affiliationType === "FAMILY" || meta.hasCaregiver === true) &&
        (!draft.companion.fullName.trim() ||
          !draft.companion.primaryPhone.trim() ||
          !draft.companion.relationship?.trim())
      ) {
        throw new Error(
          meta.hasCaregiver
            ? "Ingrese el nombre, teléfono y parentesco del cuidador"
            : "Ingrese el nombre, teléfono y parentesco del familiar o acompañante",
        )
      }
      if (historical) {
        const result = await historicalRecordsApi.createEnrollment(
          buildEnrollmentPayload({
            draft,
            agentId,
            categoriaClinica,
            historical: true,
            historicalEnrollmentDate: draft.historicalEnrollmentDate,
          }),
        )
        setHistoricalResult(result.patientId, result.followUpId)
        return result
      }
      await enrollmentsApi.create(
        buildEnrollmentPayload({ draft, agentId, categoriaClinica }),
      )
    },
    onSuccess: (result) => {
      completeEnrollment()
      toast.success(
        historical
          ? "Enrolamiento histórico guardado"
          : "Paciente enrolado correctamente",
      )
      if (historical && result && "patientId" in result) {
        navigate(`/carga-historica/pacientes/${result.patientId}`)
      }
    },
    onError: (err: Error) => {
      toast.error("Error al enrolar", { description: err.message })
    },
  })

  if (isComplete)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-emerald-500/10 ring-8 ring-emerald-500/5">
          <CheckCircle2 className="size-10 text-emerald-500" />
        </div>
        <p className="mb-1 text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
          Inscripción completada
        </p>
        <h2 className="mb-3 text-2xl font-bold">Registro exitoso</h2>
        <p className="text-muted-foreground mb-8 max-w-sm text-sm">
          El paciente ha sido registrado en el Programa SEPA.
        </p>
        <Button
          onClick={() => {
            const destination =
              historical && historicalPatientId
                ? `/carga-historica/pacientes/${historicalPatientId}`
                : historical
                  ? "/carga-historica"
                  : "/pacientes"
            resetEnrollment()
            navigate(destination)
          }}
          size="lg"
          className="px-8"
        >
          {historical ? "Nueva carga histórica" : "Ir a pacientes"}
        </Button>
      </div>
    )

  return (
    <StepContainer
      embedded={embedded}
      onSubmit={(e) => {
        e.preventDefault()
        mutation.mutate()
      }}
      className="flex flex-col gap-8"
    >
      <StepHeader
        step={8}
        title="Cierre de Llamada"
        description="Registre el cierre y la respuesta sobre la encuesta de satisfacción."
      />
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
        <p className="mb-3 text-[10px] font-bold tracking-widest text-emerald-700/80 uppercase">
          Resumen
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">
            Paciente
          </span>
          <span className="font-medium">
            {draft.patientData.fullName || "—"}
          </span>
          <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">
            DNI
          </span>
          <span className="font-medium">{draft.patientData.dni || "—"}</span>
          <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">
            Teléfono
          </span>
          <span className="font-medium">
            {draft.patientData.primaryPhone || "—"}
          </span>
          {categoriaClinica === "CANCER_DIAGNOSIS" &&
            typeof meta.currentlyAttendingConsultations === "boolean" && (
              <>
                <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">
                  Consultas médicas
                </span>
                <span className="font-medium">
                  {meta.currentlyAttendingConsultations ? "Sí" : "No"}
                </span>
                {!meta.currentlyAttendingConsultations && (
                  <>
                    <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">
                      Nota de no asistencia
                    </span>
                    <span className="font-medium">
                      {meta.notAttendingConsultationsNote || "—"}
                    </span>
                  </>
                )}
              </>
            )}
          {categoriaClinica === "CANCER_DIAGNOSIS" &&
            typeof meta.currentlyReceivingTreatment === "boolean" && (
              <>
                <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">
                  Tratamiento actual
                </span>
                <span className="font-medium">
                  {meta.currentlyReceivingTreatment ? "Sí" : "No"}
                </span>
                {!meta.currentlyReceivingTreatment && (
                  <>
                    <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">
                      Motivo sin tratamiento
                    </span>
                    <span className="font-medium">
                      {meta.notReceivingTreatmentReason || "—"}
                    </span>
                  </>
                )}
              </>
            )}
          <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">
            Seguro
          </span>
          <span className="font-medium">
            {draft.insurance.insuranceType || "—"}
          </span>
        </div>
      </div>
      <section className="flex flex-col gap-5">
        <SectionHeader icon={ClipboardCheck} title="Encuesta de Satisfacción" />
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground/70 text-[10px] font-bold tracking-[0.1em] uppercase">
            ¿El paciente acepta la encuesta?{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Select
            items={[
              { value: "Sí", label: "Sí, acepta" },
              { value: "No", label: "No desea" },
            ]}
            value={meta.surveyAccepted ? "Sí" : "No"}
            onValueChange={(v) =>
              updateDraft({
                enrollmentMetadata: { ...meta, surveyAccepted: v === "Sí" },
              })
            }
          >
            <SelectTrigger className="bg-card w-full border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sí">Sí, acepta</SelectItem>
              <SelectItem value="No">No desea</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>
      {user?.role !== "AGENT" && (
        <section className="flex flex-col gap-2">
          <Label className="text-muted-foreground/70 text-[10px] font-bold tracking-[0.1em] uppercase">
            Agente responsable <span className="text-destructive">*</span>
          </Label>
          <Select
            items={agents.map((agent) => ({
              value: agent.id,
              label: agent.fullName ?? agent.id,
            }))}
            value={meta.assignedAgentId ?? ""}
            onValueChange={(assignedAgentId) =>
              updateDraft({
                enrollmentMetadata: {
                  ...meta,
                  assignedAgentId: assignedAgentId ?? undefined,
                },
              })
            }
          >
            <SelectTrigger className="bg-card w-full border">
              <SelectValue placeholder="Seleccionar agente..." />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.fullName ?? agent.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}
      <section className="flex flex-col gap-5">
        <SectionHeader icon={Clock} title="Registro de Tiempo" />
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground/70 text-[10px] font-bold tracking-[0.1em] uppercase">
            {historical ? "Hora de fin (opcional)" : "Hora de fin"}
            {!historical && <span className="text-destructive"> *</span>}
          </Label>
          <Input
            type="time"
            value={
              historical
                ? (meta.endTime?.slice(0, 5) ?? "")
                : (meta.endTime?.slice(0, 5) ?? now)
            }
            onChange={(e) =>
              updateDraft({
                enrollmentMetadata: { ...meta, endTime: e.target.value },
              })
            }
            className="bg-card max-w-48 border"
          />
        </div>
      </section>
      {mutation.isError && (
        <div className="border-destructive/20 bg-destructive/5 rounded-xl border p-4">
          <p className="text-destructive text-sm">
            Error al guardar. Verificá la conexión.
          </p>
        </div>
      )}
      <StepNav
        currentStep={8}
        onPrev={embedded ? undefined : prevStep}
        onClick={embedded ? () => mutation.mutate() : undefined}
        isLast
        isLoading={mutation.isPending}
      />
    </StepContainer>
  )
}
