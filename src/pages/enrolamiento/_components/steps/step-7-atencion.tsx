import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Activity, Stethoscope, HeartPulse, Building2, Plus, Users, Minus } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"
import { healthCentersApi } from "@/lib/api"
import { CreateHealthCenterDialog } from "@/pages/hospitales/_components/create-health-center-dialog"
import type { AddMedicalAppointmentRequest, CancerStage, HealthCenter } from "@/types"

const fl = "text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70"
const sc = "w-full bg-card border"

const stageLabels: Record<CancerStage, string> = {
  STAGE_1: "1",
  STAGE_2: "2",
  STAGE_3: "3",
  STAGE_4: "4",
  UNKNOWN: "Desconoce",
}

const DIAGNOSIS_OPTIONS = [
  "Cáncer de mama",
  "Cáncer de cuello uterino",
  "Cáncer de próstata",
  "Cáncer de estómago",
  "Cáncer de pulmón",
  "Cáncer de colon y recto",
  "Cáncer de piel",
  "Cáncer de hígado",
  "Cáncer de tiroides",
  "Leucemia",
  "Linfoma",
  "Cáncer de riñón",
  "Cáncer de vejiga",
  "Cáncer de páncreas",
  "Cáncer de ovario",
  "Sarcoma",
  "Cáncer de esófago",
  "Cáncer de endometrio",
] as const

const TREATMENT_SITUATIONS = [
  "En curso",
  "Por iniciar",
  "Suspendido temporalmente",
  "Finalizado",
  "En evaluación",
  "No recibe tratamiento",
] as const

const TALK_TOPICS = [
  "Prevención del cáncer de mama",
  "Prevención del cáncer de cuello uterino",
  "Prevención del cáncer de próstata",
  "Prevención del cáncer de estómago",
  "Prevención del cáncer de pulmón",
  "Prevención del cáncer de colon y recto",
  "Prevención del cáncer de piel",
  "Prevención general del cáncer",
] as const

const OTHER_VALUE = "OTHER"
const TALK_OTHER = "TALK_OTHER"

const EMPTY_APPOINTMENT: AddMedicalAppointmentRequest = {
  healthCenterId: null,
  specialty: null,
  appointmentDate: null,
  nextAppointmentDate: null,
  difficulties: null,
  hasReferralSheet: false,
  isFirstConsultation: false,
}

export function Step7Atencion() {
  const { draft, updateDraft, nextStep, prevStep, categoriaClinica } = useEnrollmentStore()
  const sr = draft.symptomReport
  const dx = draft.diagnosis
  const tx = draft.treatment
  const sis = draft.sisAffiliation
  const details = draft.details
  const meta = draft.enrollmentMetadata
  const seguro = draft.insurance.insuranceType
  const tieneSeguroReal = seguro && seguro !== "NONE"
  const esSignos = categoriaClinica === "signos"
  const esDx = categoriaClinica === "diagnostico"
  const label = esSignos ? "Signos y Síntomas" : "Diagnóstico de Cáncer"

  const [newHospitalOpen, setNewHospitalOpen] = useState(false)

  const knownDiagnoses = DIAGNOSIS_OPTIONS as readonly string[]
  const [isOtherDiagnosis, setIsOtherDiagnosis] = useState(() => {
    const d = dx.diagnosis
    return !!d && !knownDiagnoses.includes(d)
  })
  const diagnosisSelectValue = isOtherDiagnosis
    ? OTHER_VALUE
    : dx.diagnosis && knownDiagnoses.includes(dx.diagnosis)
      ? dx.diagnosis
      : ""

  const medicalAppointments = draft.medicalAppointments ?? []
  const familyPreventionTalkInterests = draft.familyPreventionTalkInterests ?? []
  const appointment = medicalAppointments[0] ?? EMPTY_APPOINTMENT
  const ft = familyPreventionTalkInterests
  const [showFamilyTalks, setShowFamilyTalks] = useState(ft.length > 0)
  const [talkOtherIndices, setTalkOtherIndices] = useState<Set<number>>(() => {
    const topics = TALK_TOPICS as readonly string[]
    const others = new Set<number>()
    ft.forEach((entry, i) => {
      if (entry.talkName && !topics.includes(entry.talkName)) others.add(i)
    })
    return others
  })

  const { data: healthCenters = [] } = useQuery<HealthCenter[]>({
    queryKey: ["healthCenters"],
    queryFn: () => healthCentersApi.list(),
    staleTime: 60 * 1000,
  })

  const activeCenters = healthCenters.filter(c => c.isActive)

  function updateAppointment(partial: Partial<AddMedicalAppointmentRequest>) {
    updateDraft({ medicalAppointments: [{ ...appointment, ...partial }] })
  }

  function clearAppointment() {
    updateDraft({ medicalAppointments: [] })
  }

  function setTalkOther(idx: number, isOther: boolean) {
    setTalkOtherIndices(prev => {
      const next = new Set(prev)
      if (isOther) next.add(idx)
      else next.delete(idx)
      return next
    })
  }

  function addFamilyTalk() {
    updateDraft({
      familyPreventionTalkInterests: [
        ...ft,
        { talkName: "", familyMemberName: "", familyMemberPhone: "", familyMemberEmail: "" },
      ],
    })
  }

  function removeFamilyTalk(idx: number) {
    const updated = ft.filter((_, i) => i !== idx)
    setTalkOtherIndices(prev => {
      const next = new Set<number>()
      prev.forEach(i => {
        if (i < idx) next.add(i)
        else if (i > idx) next.add(i - 1)
      })
      return next
    })
    updateDraft({ familyPreventionTalkInterests: updated })
    if (updated.length === 0) setShowFamilyTalks(false)
  }

  function updateFamilyTalk(idx: number, field: keyof typeof ft[0], value: string) {
    updateDraft({ familyPreventionTalkInterests: ft.map((e, i) => i === idx ? { ...e, [field]: value } : e) })
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep() }} className="flex flex-col gap-8">
      <StepHeader step={7} title="Atención Especializada" description={`Rama activa: ${label}${!tieneSeguroReal ? " · Sin seguro" : ""}`} />
      <div className="bg-card rounded-xl px-4 py-3">
        <p className="text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase">Categoría</p>
        <p className="text-foreground mt-0.5 text-sm font-semibold">{label} · {tieneSeguroReal ? "Con seguro" : "Sin seguro"}</p>
      </div>

      {esSignos && (
        <section className="flex flex-col gap-5"><SectionHeader icon={Activity} title="Signos y Síntomas" />
          <div className="flex flex-col gap-2"><Label className={fl}>¿Presenta malestar o dolor?</Label>
            <Select value={sr.hasDiscomfort === true ? "Sí" : sr.hasDiscomfort === false ? "No" : ""} onValueChange={v => updateDraft({ symptomReport: { ...sr, hasDiscomfort: v === "Sí" } })}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Signos y síntomas</Label><Textarea value={sr.signsAndSymptoms ?? ""} onChange={e => updateDraft({ symptomReport: { ...sr, signsAndSymptoms: e.target.value || null } })} placeholder="Describa los signos o síntomas..." className="bg-card border min-h-20" /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>¿Actualmente ha sacado o asistido a una cita médica?</Label>
            <Select value={sr.hasSoughtMedicalConsultation === true ? "Sí" : sr.hasSoughtMedicalConsultation === false ? "No" : ""} onValueChange={v => updateDraft({ symptomReport: { ...sr, hasSoughtMedicalConsultation: v === "Sí" } })}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Especialidad consultada</Label><Input value={sr.specialty ?? ""} onChange={e => updateDraft({ symptomReport: { ...sr, specialty: e.target.value || null } })} placeholder="Ej: Oncología" className="bg-card border" /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Indicaciones recibidas</Label><Input value={sr.indicationsReceived ?? ""} onChange={e => updateDraft({ symptomReport: { ...sr, indicationsReceived: e.target.value || null } })} placeholder="Indicaciones de la consulta" className="bg-card border" /></div>
        </section>
      )}

      {esDx && (
        <>
          <section className="flex flex-col gap-5"><SectionHeader icon={Stethoscope} title="Diagnóstico Oncológico" />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label className={fl}>¿Cuál es su diagnóstico oncológico? <span className="text-destructive">*</span></Label>
                <Select value={diagnosisSelectValue} onValueChange={v => { if (!v) return; if (v === OTHER_VALUE) { setIsOtherDiagnosis(true); updateDraft({ diagnosis: { ...dx, diagnosis: "" } }) } else { setIsOtherDiagnosis(false); updateDraft({ diagnosis: { ...dx, diagnosis: v } }) } }}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger><SelectContent>{DIAGNOSIS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}<SelectSeparator /><SelectItem value={OTHER_VALUE}>Otro (especificar)</SelectItem></SelectContent></Select>
              </div>
              <div className="flex flex-col gap-2"><Label className={fl}>¿Conoce el estadio del diagnóstico? (1, 2, 3, 4 o desconoce)</Label>
                <Select value={dx.cancerStage ?? ""} onValueChange={v => updateDraft({ diagnosis: { ...dx, cancerStage: (v as CancerStage) || null } })}><SelectTrigger className={sc}><SelectValue placeholder="Estadio" /></SelectTrigger><SelectContent>{Object.entries(stageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            </div>
            {isOtherDiagnosis && <div className="flex flex-col gap-2"><Label className={fl}>Especifique el diagnóstico</Label><Input value={dx.diagnosis} onChange={e => updateDraft({ diagnosis: { ...dx, diagnosis: e.target.value } })} placeholder="Describa el diagnóstico oncológico..." className="bg-card border" /></div>}
            <div className="flex flex-col gap-2"><Label className={fl}>¿Qué síntoma lo llevó a realizarse su chequeo médico?</Label><Textarea value={dx.symptomLeadingToCheckup ?? ""} onChange={e => updateDraft({ diagnosis: { ...dx, symptomLeadingToCheckup: e.target.value || null } })} placeholder="Motivo o síntoma principal" className="bg-card border min-h-20" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label className={fl}>¿Cuándo fue diagnosticado?</Label><Input type="date" value={dx.diagnosisDate ?? ""} onChange={e => updateDraft({ diagnosis: { ...dx, diagnosisDate: e.target.value || null } })} className="bg-card border" /></div>
              <div className="flex flex-col gap-2"><Label className={fl}>¿Cuánto tiempo esperó para el diagnóstico?</Label><Input value={dx.waitTimeForDiagnosis ?? ""} onChange={e => updateDraft({ diagnosis: { ...dx, waitTimeForDiagnosis: e.target.value || null } })} placeholder="Ej: 6 semanas" className="bg-card border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label className={fl}>¿Dónde fue diagnosticado?</Label>
                <div className="flex gap-2"><Select value={dx.healthCenterId ?? ""} onValueChange={v => updateDraft({ diagnosis: { ...dx, healthCenterId: v || null } })}><SelectTrigger className="flex-1 bg-card border"><SelectValue placeholder="Seleccionar establecimiento..." /></SelectTrigger><SelectContent>{activeCenters.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.department}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => setNewHospitalOpen(true)}><Building2 className="size-3.5" /><Plus className="size-3" /></Button></div>
              </div>
              <div className="flex flex-col gap-2"><Label className={fl}>¿Qué especialidad lo diagnosticó?</Label><Input value={dx.diagnosisSpecialty ?? ""} onChange={e => updateDraft({ diagnosis: { ...dx, diagnosisSpecialty: e.target.value || null } })} placeholder="Especialidad" className="bg-card border" /></div>
            </div>
            <div className="flex flex-col gap-2"><Label className={fl}>¿Cuenta con informe médico de respaldo?</Label>
              <Select value={dx.hasMedicalReport === true ? "Sí" : dx.hasMedicalReport === false ? "No" : ""} onValueChange={v => updateDraft({ diagnosis: { ...dx, hasMedicalReport: v === "Sí" } })}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
          </section>

          <section className="flex flex-col gap-5"><SectionHeader icon={Activity} title="Consultas Médicas" />
            <div className="flex flex-col gap-2"><Label className={fl}>¿Actualmente asiste a sus consultas médicas?</Label>
              <Select value={meta.currentlyAttendingConsultations === true ? "Sí" : meta.currentlyAttendingConsultations === false ? "No" : ""} onValueChange={v => { const attends = v === "Sí"; updateDraft({ enrollmentMetadata: { ...meta, currentlyAttendingConsultations: attends } }); if (!attends) clearAppointment(); else updateAppointment({}) }}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
            {meta.currentlyAttendingConsultations && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2"><Label className={fl}>Si asiste: ¿cuándo fue su última consulta?</Label><Input type="date" value={appointment.appointmentDate ?? ""} onChange={e => updateAppointment({ appointmentDate: e.target.value || null })} className="bg-card border" /></div>
                  <div className="flex flex-col gap-2"><Label className={fl}>Especialidad de la consulta</Label><Input value={appointment.specialty ?? ""} onChange={e => updateAppointment({ specialty: e.target.value || null })} placeholder="Especialidad" className="bg-card border" /></div>
                </div>
                <div className="flex flex-col gap-2"><Label className={fl}>¿Cuándo es su siguiente consulta y especialidad?</Label><Input type="date" value={appointment.nextAppointmentDate ?? ""} onChange={e => updateAppointment({ nextAppointmentDate: e.target.value || null })} className="bg-card border max-w-60" /></div>
                <div className="flex flex-col gap-2"><Label className={fl}>¿Tiene alguna dificultad para sus consultas médicas?</Label><Textarea value={appointment.difficulties ?? ""} onChange={e => updateAppointment({ difficulties: e.target.value || null })} placeholder="Detalle de barreras o dificultades" className="bg-card border min-h-20" /></div>
              </>
            )}
          </section>

          <section className="flex flex-col gap-5"><SectionHeader icon={HeartPulse} title="Tratamiento" />
            <div className="flex flex-col gap-2"><Label className={fl}>¿En qué establecimiento de salud se atiende actualmente?</Label>
              <div className="flex gap-2"><Select value={tx.healthCenterId ?? ""} onValueChange={v => updateDraft({ treatment: { ...tx, healthCenterId: v || null } })}><SelectTrigger className="flex-1 bg-card border"><SelectValue placeholder="Seleccionar establecimiento..." /></SelectTrigger><SelectContent>{activeCenters.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.department}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => setNewHospitalOpen(true)}><Building2 className="size-3.5" /><Plus className="size-3" /></Button></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label className={fl}>¿Actualmente recibe tratamiento médico?</Label>
                <Select value={meta.currentlyReceivingTreatment === true ? "Sí" : meta.currentlyReceivingTreatment === false ? "No" : ""} onValueChange={v => { const receives = v === "Sí"; updateDraft({ enrollmentMetadata: { ...meta, currentlyReceivingTreatment: receives }, treatment: { ...tx, isCurrent: receives } }) }}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-2"><Label className={fl}>Situación del tratamiento</Label><Select value={tx.treatmentSituation ?? ""} onValueChange={v => updateDraft({ treatment: { ...tx, treatmentSituation: v || null } })}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{TREATMENT_SITUATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            {meta.currentlyReceivingTreatment !== false && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2"><Label className={fl}>¿Qué tipo de tratamiento recibe?</Label><Input value={tx.treatmentType} onChange={e => updateDraft({ treatment: { ...tx, treatmentType: e.target.value } })} placeholder="Ej: Quimioterapia" className="bg-card border" /></div>
                <div className="flex flex-col gap-2"><Label className={fl}>Frecuencia del tratamiento</Label><Input value={tx.treatmentFrequency ?? ""} onChange={e => updateDraft({ treatment: { ...tx, treatmentFrequency: e.target.value || null } })} placeholder="Ej: Cada 3 semanas" className="bg-card border" /></div>
              </div>
            )}
            {meta.currentlyReceivingTreatment === false && (
              <div className="flex flex-col gap-2"><Label className={fl}>Tipo y frecuencia de tratamiento / motivo si no recibe</Label><Textarea value={tx.notReceivingReason ?? ""} onChange={e => updateDraft({ treatment: { ...tx, notReceivingReason: e.target.value || null } })} placeholder="Motivo si no recibe tratamiento" className="bg-card border min-h-20" /></div>
            )}
          </section>
        </>
      )}

      <section className="flex flex-col gap-5"><SectionHeader icon={Users} title="Servicios de Apoyo" />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2"><Label className={fl}>¿Desea recibir soporte emocional (psicooncología)?</Label><Input disabled value="Pendiente de endpoint en fullEnrollment" className="bg-muted/40 border text-muted-foreground" /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>¿Se derivó con la asistenta social?</Label><Select value={details.referredToSocialWorker === true ? "Sí" : details.referredToSocialWorker === false ? "No" : ""} onValueChange={v => updateDraft({ details: { ...details, referredToSocialWorker: v === "Sí" } })}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
        </div>
        <div className="flex flex-col gap-2"><Label className={fl}>¿Familiares interesados en charlas de prevención del cáncer?</Label><Select value={showFamilyTalks ? "Sí" : "No"} onValueChange={v => { const show = v === "Sí"; setShowFamilyTalks(show); if (show && ft.length === 0) addFamilyTalk(); if (!show) updateDraft({ familyPreventionTalkInterests: [] }) }}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
        {showFamilyTalks && ft.map((entry, idx) => (
          <div key={idx} className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted-foreground">Familiar {idx + 1}</p><Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-destructive" onClick={() => removeFamilyTalk(idx)}><Minus className="size-3.5" /></Button></div>
            <div className="flex flex-col gap-2"><Label className={fl}>Charla de prevención</Label><Select value={talkOtherIndices.has(idx) ? TALK_OTHER : (entry.talkName || "")} onValueChange={v => { if (!v) return; if (v === TALK_OTHER) { setTalkOther(idx, true); updateFamilyTalk(idx, "talkName", "") } else { setTalkOther(idx, false); updateFamilyTalk(idx, "talkName", v) } }}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar charla..." /></SelectTrigger><SelectContent>{TALK_TOPICS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}<SelectSeparator /><SelectItem value={TALK_OTHER}>Otro (especificar)</SelectItem></SelectContent></Select>{talkOtherIndices.has(idx) && <Input value={entry.talkName} onChange={e => updateFamilyTalk(idx, "talkName", e.target.value)} placeholder="Especifique la charla de prevención..." className="bg-card border" />}</div>
            <div className="grid grid-cols-3 gap-3"><div className="flex flex-col gap-2"><Label className={fl}>Nombre del familiar</Label><Input value={entry.familyMemberName} onChange={e => updateFamilyTalk(idx, "familyMemberName", e.target.value)} placeholder="Ej: Rosa García" className="bg-card border" /></div><div className="flex flex-col gap-2"><Label className={fl}>Teléfono</Label><Input value={entry.familyMemberPhone} onChange={e => updateFamilyTalk(idx, "familyMemberPhone", e.target.value)} placeholder="999 000 777" className="bg-card border" /></div><div className="flex flex-col gap-2"><Label className={fl}>Correo</Label><Input value={entry.familyMemberEmail} onChange={e => updateFamilyTalk(idx, "familyMemberEmail", e.target.value)} placeholder="rosa@example.com" className="bg-card border" /></div></div>
          </div>
        ))}
        {showFamilyTalks && <Button type="button" variant="outline" size="sm" className="gap-1.5 self-start" onClick={addFamilyTalk}><Plus className="size-3.5" />Agregar familiar</Button>}
      </section>

      {!tieneSeguroReal && (
        <section className="flex flex-col gap-5"><SectionHeader icon={HeartPulse} title="Afiliación SIS" />
          <div className="flex flex-col gap-2"><Label className={fl}>¿Puede afiliarse al SIS?</Label><Select value={sis.canAffiliate === true ? "Sí" : sis.canAffiliate === false ? "No" : ""} onValueChange={v => updateDraft({ sisAffiliation: { ...sis, canAffiliate: v === "Sí" } })}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
          {sis.canAffiliate && <div className="flex flex-col gap-2"><Label className={fl}>Fecha esperada de afiliación</Label><Input type="date" value={sis.expectedDate ?? ""} onChange={e => updateDraft({ sisAffiliation: { ...sis, expectedDate: e.target.value || null } })} className="bg-card border max-w-60" /></div>}
          {!sis.canAffiliate && <div className="flex flex-col gap-2"><Label className={fl}>Motivo por el que no puede afiliarse</Label><Input value={sis.cantAffiliateReason ?? ""} onChange={e => updateDraft({ sisAffiliation: { ...sis, cantAffiliateReason: e.target.value || null } })} placeholder="Motivo..." className="bg-card border" /></div>}
        </section>
      )}

      <CreateHealthCenterDialog open={newHospitalOpen} onOpenChange={setNewHospitalOpen} />
      <StepNav currentStep={7} onPrev={prevStep} />
    </form>
  )
}
