import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { enrollmentsApi } from "@/api/enrollments"
import { historicalRecordsApi } from "@/api/historical-records"
import { Button } from "@/components/ds/button"
import { Card } from "@/components/ds/card"
import { InlineAlert } from "@/components/ds/inline-alert"
import { QuestionForm } from "@/components/ds/question-form"
import { useAuthStore } from "@/store/auth-store"
import { useEnrollmentStore, type EnrollmentDraft } from "../../../_store/enrollment-store"
import { StepContainer, StepNav } from "../../shared"
import { buildEnrollmentPayload, contactPerson } from "../step-8-payload"
import { useStepGate } from "../use-step-gate"
import { applyCierre, cierreValues } from "./adapter"
import { cierreGroups, validateCierre } from "./config"
import { CierreSummary } from "./summary"
import { sectionIcon, withIcons } from "../../../_utils/section-icons"
import { patientsApi } from "@/api/patients"
import { unlinkedPeople } from "../../../_utils/contacts"

/**
 * La API solo da de alta acompañantes nuevos como contacto. Los que no se
 * marcaron como contacto se registran aquí, ya enrolado el paciente.
 */
async function registerUnlinked(patientId: string, draft: EnrollmentDraft) {
  const people = unlinkedPeople(draft)
  const results = await Promise.allSettled(
    people.map((person) => patientsApi.createCompanion(patientId, { ...contactPerson(person), isPrimaryContact: false, isCaregiver: false })),
  )
  const failed = results.filter((result) => result.status === "rejected").length
  if (failed) toast.warning(failed === 1 ? "No se pudo registrar un acompañante" : `No se pudieron registrar ${failed} acompañantes`, { description: "Agrégalo desde la ficha del paciente, en Acompañantes." })
}

export function Step8Cierre({ historical = false, embedded = false }: { historical?: boolean; embedded?: boolean }) {
  const draft = useEnrollmentStore((state) => state.draft)
  const updateDraft = useEnrollmentStore((state) => state.updateDraft)
  const prevStep = useEnrollmentStore((state) => state.prevStep)
  const isComplete = useEnrollmentStore((state) => state.isComplete)
  const completeEnrollment = useEnrollmentStore((state) => state.completeEnrollment)
  const resetEnrollment = useEnrollmentStore((state) => state.resetEnrollment)
  const setHistoricalResult = useEnrollmentStore((state) => state.setHistoricalResult)
  const historicalPatientId = useEnrollmentStore((state) => state.historicalPatientId)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const isAgent = user?.role === "AGENT"

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list(),
    staleTime: 60 * 1000,
  })

  const groups = cierreGroups(
    historical,
    isAgent,
    agents.map((agent) => ({ value: agent.id, label: agent.fullName ?? agent.id })),
  )
  const values = cierreValues(draft, historical)
  const gate = useStepGate(groups, values, (current) => validateCierre(current, isAgent))

  const mutation = useMutation({
    mutationFn: async () => {
      const state = useEnrollmentStore.getState()
      const current = state.draft
      const meta = current.enrollmentMetadata
      const agentId = isAgent ? agents.find((agent) => agent.userId === user?.id)?.id : meta.assignedAgentId
      if (!agentId) throw new Error("Seleccione un agente responsable antes de finalizar")
      if (
        (meta.affiliationType === "FAMILY" || meta.hasCaregiver === true) &&
        (!current.companion.fullName.trim() || !current.companion.primaryPhone.trim() || !current.companion.relationship?.trim())
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
            draft: current,
            agentId,
            categoriaClinica: state.categoriaClinica,
            historical: true,
            historicalEnrollmentDate: current.historicalEnrollmentDate,
          }),
        )
        setHistoricalResult(result.patientId, result.followUpId)
        await registerUnlinked(result.patientId, current)
        return result
      }
      const enrollment = await enrollmentsApi.create(
        buildEnrollmentPayload({ draft: current, agentId, categoriaClinica: state.categoriaClinica }),
      )
      await registerUnlinked(enrollment.patientId, current)
    },
    onSuccess: (result) => {
      completeEnrollment()
      toast.success(historical ? "Enrolamiento histórico guardado" : "Paciente enrolado correctamente")
      if (historical && result && "patientId" in result) navigate(`/carga-historica/pacientes/${result.patientId}`)
    },
    onError: (err: Error) => {
      toast.error("Error al enrolar", { description: err.message })
    },
  })

  function finish(event?: { preventDefault(): void }) {
    if (gate.blocked(event)) return
    const current = useEnrollmentStore.getState().draft
    if (!historical && !current.enrollmentMetadata.endTime && values.endTime) {
      updateDraft({ enrollmentMetadata: { ...current.enrollmentMetadata, endTime: values.endTime } })
    }
    mutation.mutate()
  }

  if (isComplete) {
    const leave = (
      <Button
        variant="dark"
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
      >
        {historical ? "Nueva carga histórica" : "Ir a pacientes"}
      </Button>
    )
    if (embedded) {
      return (
        <div>
          <h3 className="text-[15px] font-semibold text-zinc-900">Registro exitoso</h3>
          <p className="mt-1 mb-4 text-[13px] text-zinc-500">El paciente ha sido registrado en el Programa SEPA.</p>
          {leave}
        </div>
      )
    }
    return (
      <Card title="Registro exitoso" description="El paciente ha sido registrado en el Programa SEPA." {...sectionIcon("Registro exitoso")}>
        {leave}
      </Card>
    )
  }

  return (
    <StepContainer embedded={embedded} onSubmit={finish} className="flex flex-col gap-6">
      {embedded ? (
        <CierreSummary />
      ) : (
        <Card title="Resumen" {...sectionIcon("Resumen")}>
          <CierreSummary />
        </Card>
      )}
      <QuestionForm
        cards={!embedded}
        groups={withIcons(groups)}
        values={values}
        showMissing={gate.showMissing}
        onChange={(id, value) => updateDraft(applyCierre(useEnrollmentStore.getState().draft, id, value))}
      />
      {mutation.isError && (
        <InlineAlert>
          {mutation.error instanceof TypeError ? "Error al guardar. Verifica la conexión." : mutation.error.message}
        </InlineAlert>
      )}
      <StepNav
        currentStep={8}
        onPrev={embedded ? undefined : prevStep}
        onClick={embedded ? () => finish() : undefined}
        isLast
        isLoading={mutation.isPending}
        sticky={!embedded}
        missingCount={gate.missingCount}
        alert={gate.alert}
      />
    </StepContainer>
  )
}
