import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, ClipboardCheck } from "lucide-react"
import { patientsApi, agentsApi } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"
import { useEnrollmentStore } from "../../_store/enrollment-store"
import { StepHeader, SectionHeader, StepNav } from "../shared"
import { toast } from "sonner"
import type { FullEnrollmentRequest } from "@/types"

export function Step8Cierre() {
  const { draft, updateDraft, prevStep, isComplete, completeEnrollment, resetEnrollment } = useEnrollmentStore()
  const user = useAuthStore(s=>s.user)
  const navigate = useNavigate()
  const meta = draft.enrollmentMetadata
  const now = new Date().toTimeString().slice(0,5)

  // Resolve agentId: if user is ADMIN, use first agent; if AGENT, find by userId
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list(),
    staleTime: 60 * 1000,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      let agentId: string | undefined

      if (user?.role === "AGENT") {
        const agent = agents.find(a => a.userId === user.id)
        agentId = agent?.id
      } else if (user?.role === "ADMIN") {
        agentId = agents[0]?.id
      }

      const today = new Date().toISOString().slice(0, 10)
      const shouldSendTreatment =
        !!draft.treatment.treatmentType ||
        !!draft.treatment.treatmentFrequency ||
        !!draft.treatment.healthCenterId ||
        !!draft.treatment.treatmentSituation ||
        !!draft.treatment.notReceivingReason ||
        meta.currentlyReceivingTreatment === false

      const treatment = shouldSendTreatment
        ? {
            ...draft.treatment,
            treatmentType:
              draft.treatment.treatmentType ||
              (meta.currentlyReceivingTreatment === false
                ? "No recibe tratamiento"
                : draft.treatment.treatmentType),
          }
        : undefined

      const medicalAppointments = draft.medicalAppointments.filter((a) =>
        !!a.healthCenterId ||
        !!a.specialty ||
        !!a.appointmentDate ||
        !!a.nextAppointmentDate ||
        !!a.difficulties ||
        !!a.referredTo
      )

      const familyPreventionTalkInterests = draft.familyPreventionTalkInterests.filter((t) =>
        !!t.talkName ||
        !!t.familyMemberName ||
        !!t.familyMemberPhone ||
        !!t.familyMemberEmail
      )

      const payload: FullEnrollmentRequest = {
        patientId: draft.patientId,
        patientData: draft.patientData.fullName ? draft.patientData : undefined,
        details: { ...draft.details },
        insurance: draft.insurance.insuranceType && draft.insurance.insuranceType !== "NONE" ? { ...draft.insurance } : undefined,
        symptomReport: draft.symptomReport.hasDiscomfort !== undefined ? { ...draft.symptomReport } : null,
        diagnosis: draft.diagnosis.diagnosis ? { ...draft.diagnosis } : undefined,
        treatment,
        sisAffiliation: draft.insurance.insuranceType === "NONE" ? { ...draft.sisAffiliation } : null,
        medicalAppointments: medicalAppointments.length > 0 ? medicalAppointments : null,
        familyPreventionTalkInterests: familyPreventionTalkInterests.length > 0 ? familyPreventionTalkInterests : null,
        companions: null,
        enrollmentMetadata: {
          caseComments: meta.comments || null,
          startTime: meta.startTime ? `${today}T${meta.startTime}:00Z` : null,
          endTime: meta.endTime ? `${today}T${meta.endTime}:00Z` : null,
          dataPolicyAccepted: meta.dataPolicyAccepted,
          informedConsentAccepted: meta.informedConsentAccepted,
          isOncologicalPatient: meta.isOncologicalPatient,
          programEntryPoint: meta.programEntryPoint || null,
          currentlyAttendingConsultations: meta.currentlyAttendingConsultations ?? null,
          currentlyReceivingTreatment: meta.currentlyReceivingTreatment ?? null,
          surveyAccepted: meta.surveyAccepted,
          surveyRating: meta.surveyRating ?? null,
          agentId,
          affiliationType: (meta.affiliationType as any) || "PATIENT",
        },
      }
      await patientsApi.enroll(payload)
    },
    onSuccess: () => {
      completeEnrollment()
      toast.success("Paciente enrolado correctamente")
    },
    onError: (err: Error) => {
      toast.error("Error al enrolar", { description: err.message })
    },
  })

  if (isComplete) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-emerald-500/10 ring-8 ring-emerald-500/5"><CheckCircle2 className="size-10 text-emerald-500" /></div>
      <p className="mb-1 text-[10px] font-bold tracking-widest text-emerald-600 uppercase">Inscripción completada</p>
      <h2 className="mb-3 text-2xl font-bold">Registro exitoso</h2>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">El paciente ha sido registrado en el Programa SEPA.</p>
      <Button onClick={() => { resetEnrollment(); navigate("/pacientes") }} size="lg" className="px-8">Ir a pacientes</Button>
    </div>
  )

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="flex flex-col gap-8">
      <StepHeader step={8} title="Cierre de Llamada" description="Registre el cierre y confirme la encuesta de satisfacción." />
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5"><p className="mb-3 text-[10px] font-bold tracking-widest text-emerald-700/80 uppercase">Resumen</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">Paciente</span><span className="font-medium">{draft.patientData.fullName || "—"}</span>
          <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">DNI</span><span className="font-medium">{draft.patientData.dni || "—"}</span>
          <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">Teléfono</span><span className="font-medium">{draft.patientData.primaryPhone || "—"}</span>
          <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wide uppercase">Seguro</span><span className="font-medium">{draft.insurance.insuranceType || "—"}</span>
        </div>
      </div>
      <section className="flex flex-col gap-5"><SectionHeader icon={ClipboardCheck} title="Encuesta de Satisfacción" />
        <div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">¿El paciente acepta la encuesta? <span className="text-destructive">*</span></Label>
          <Select value={meta.surveyAccepted?"Sí":"No"} onValueChange={v=>updateDraft({enrollmentMetadata:{...meta,surveyAccepted:v==="Sí"}})}><SelectTrigger className="w-full bg-card border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí, acepta</SelectItem><SelectItem value="No">No desea</SelectItem></SelectContent></Select></div>
        {meta.surveyAccepted && (
          <div className="flex flex-col gap-2 pt-1">
            <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Calificación (1 al 5)</Label>
            <Select
              value={meta.surveyRating ? String(meta.surveyRating) : ""}
              onValueChange={(v) =>
                updateDraft({
                  enrollmentMetadata: {
                    ...meta,
                    surveyRating: v ? Number(v) : undefined,
                  },
                })
              }
            >
              <SelectTrigger className="max-w-48 bg-card border">
                <SelectValue placeholder="Sin calificar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — Muy mala</SelectItem>
                <SelectItem value="2">2 — Mala</SelectItem>
                <SelectItem value="3">3 — Regular</SelectItem>
                <SelectItem value="4">4 — Buena</SelectItem>
                <SelectItem value="5">5 — Muy buena</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </section>
      <section className="flex flex-col gap-5"><SectionHeader icon={Clock} title="Registro de Tiempo" />
        <div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Hora de fin <span className="text-destructive">*</span></Label><Input type="time" value={meta.endTime?.slice(0,5)??now} onChange={e=>updateDraft({enrollmentMetadata:{...meta,endTime:e.target.value}})} className="max-w-48 bg-card border" /></div>
      </section>
      {mutation.isError && <div className="border-destructive/20 bg-destructive/5 rounded-xl border p-4"><p className="text-destructive text-sm">Error al guardar. Verificá la conexión.</p></div>}
      <StepNav currentStep={8} onPrev={prevStep} isLast isLoading={mutation.isPending} />
    </form>
  )
}
