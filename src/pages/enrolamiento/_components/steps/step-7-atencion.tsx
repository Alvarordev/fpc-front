import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Activity, Stethoscope, HeartPulse, Building2, Plus } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"
import { healthCentersApi } from "@/lib/api"
import { CreateHealthCenterDialog } from "@/pages/hospitales/_components/create-health-center-dialog"
import type { CancerStage, HealthCenter } from "@/types"

const fl="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70"; const sc="w-full bg-card border"
const stageLabels:Record<CancerStage,string>={STAGE_1:"Etapa 1",STAGE_2:"Etapa 2",STAGE_3:"Etapa 3",STAGE_4:"Etapa 4",UNKNOWN:"Desconocida"}

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

const OTHER_VALUE = "OTHER"

export function Step7Atencion() {
  const { draft, updateDraft, nextStep, prevStep, categoriaClinica } = useEnrollmentStore()
  const sr = draft.symptomReport; const dx = draft.diagnosis; const tx = draft.treatment; const sis = draft.sisAffiliation
  const seguro = draft.insurance.insuranceType; const tieneSeguroReal = seguro && seguro !== "NONE"
  const esSignos = categoriaClinica === "signos"; const esDx = categoriaClinica === "diagnostico"
  const label = esSignos ? "Signos y Síntomas" : "Diagnóstico de Cáncer"

  const [newHospitalOpen, setNewHospitalOpen] = useState(false)

  const knownDiagnoses = DIAGNOSIS_OPTIONS as readonly string[]
  const [isOtherDiagnosis, setIsOtherDiagnosis] = useState(() => {
    const d = dx.diagnosis
    return !!d && !knownDiagnoses.includes(d)
  })
  const diagnosisSelectValue = isOtherDiagnosis
    ? OTHER_VALUE
    : (dx.diagnosis && knownDiagnoses.includes(dx.diagnosis) ? dx.diagnosis : "")

  const { data: healthCenters = [] } = useQuery<HealthCenter[]>({
    queryKey: ["healthCenters"],
    queryFn: () => healthCentersApi.list(),
    staleTime: 60 * 1000,
  })

  const activeCenters = healthCenters.filter(c => c.isActive)

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep() }} className="flex flex-col gap-8">
      <StepHeader step={7} title="Atención Especializada" description={`Rama activa: ${label}${!tieneSeguroReal ? " · Sin seguro" : ""}`} />
      <div className="bg-card rounded-xl px-4 py-3"><p className="text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase">Categoría</p><p className="text-foreground mt-0.5 text-sm font-semibold">{label} · {tieneSeguroReal ? "Con seguro" : "Sin seguro"}</p></div>

      {/* SIGNOS Y SÍNTOMAS */}
      {esSignos && <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-5"><SectionHeader icon={Activity} title="Signos y Síntomas" />
          <div className="flex flex-col gap-2"><Label className={fl}>¿Presenta malestar o dolor?</Label>
            <Select value={sr.hasDiscomfort===true?"Sí":sr.hasDiscomfort===false?"No":""} onValueChange={v=>updateDraft({symptomReport:{...sr,hasDiscomfort:v==="Sí"}})}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Signos y síntomas</Label><Textarea value={sr.signsAndSymptoms??""} onChange={e=>updateDraft({symptomReport:{...sr,signsAndSymptoms:e.target.value||null}})} placeholder="Describa los signos o síntomas..." className="bg-card border min-h-20" /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>¿Solicitó o asistió a consulta médica?</Label>
            <Select value={sr.hasSoughtMedicalConsultation===true?"Sí":sr.hasSoughtMedicalConsultation===false?"No":""} onValueChange={v=>updateDraft({symptomReport:{...sr,hasSoughtMedicalConsultation:v==="Sí"}})}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Especialidad consultada</Label><Input value={sr.specialty??""} onChange={e=>updateDraft({symptomReport:{...sr,specialty:e.target.value||null}})} placeholder="Ej: Oncología" className="bg-card border" /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Indicaciones recibidas</Label><Input value={sr.indicationsReceived??""} onChange={e=>updateDraft({symptomReport:{...sr,indicationsReceived:e.target.value||null}})} placeholder="Indicaciones de la consulta" className="bg-card border" /></div>
        </section>
      </div>}

      {/* DIAGNÓSTICO */}
      {esDx && <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-5"><SectionHeader icon={Stethoscope} title="Diagnóstico Oncológico" />
          <div className="flex flex-col gap-2"><Label className={fl}>¿Cuál es el diagnóstico oncológico? <span className="text-destructive">*</span></Label>
              <Select value={diagnosisSelectValue} onValueChange={v=>{if(v===OTHER_VALUE){setIsOtherDiagnosis(true);updateDraft({diagnosis:{...dx,diagnosis:""}})}else{setIsOtherDiagnosis(false);updateDraft({diagnosis:{...dx,diagnosis:v}})}}}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar diagnóstico..." /></SelectTrigger>
                <SelectContent>{DIAGNOSIS_OPTIONS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}<SelectSeparator /><SelectItem value={OTHER_VALUE}>Otro (especificar)</SelectItem></SelectContent>
              </Select>
            </div>
            {isOtherDiagnosis&&<div className="flex flex-col gap-2"><Label className={fl}>Especifique el diagnóstico</Label><Input value={dx.diagnosis} onChange={e=>updateDraft({diagnosis:{...dx,diagnosis:e.target.value}})} placeholder="Describa el diagnóstico oncológico..." className="bg-card border" /></div>}
          <div className="flex flex-col gap-2"><Label className={fl}>Estadio del cáncer</Label>
            <Select value={dx.cancerStage??""} onValueChange={v=>updateDraft({diagnosis:{...dx,cancerStage:(v as CancerStage)||null}})}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{Object.entries(stageLabels).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Fecha de diagnóstico</Label><Input type="date" value={dx.diagnosisDate??""} onChange={e=>updateDraft({diagnosis:{...dx,diagnosisDate:e.target.value||null}})} className="bg-card border max-w-60" /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Especialidad que diagnosticó</Label><Input value={dx.diagnosisSpecialty??""} onChange={e=>updateDraft({diagnosis:{...dx,diagnosisSpecialty:e.target.value||null}})} placeholder="Ej: Oncología" className="bg-card border" /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Síntoma que llevó al chequeo</Label><Input value={dx.symptomLeadingToCheckup??""} onChange={e=>updateDraft({diagnosis:{...dx,symptomLeadingToCheckup:e.target.value||null}})} placeholder="Ej: Bulto en el seno" className="bg-card border" /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>¿Cuenta con informe médico de respaldo?</Label>
            <Select value={dx.hasMedicalReport===true?"Sí":dx.hasMedicalReport===false?"No":""} onValueChange={v=>updateDraft({diagnosis:{...dx,hasMedicalReport:v==="Sí"}})}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
          {/* Hospital de diagnóstico */}
          <div className="flex flex-col gap-2"><Label className={fl}>Centro de salud</Label>
            <div className="flex gap-2">
              <Select value={dx.healthCenterId??""} onValueChange={v=>updateDraft({diagnosis:{...dx,healthCenterId:v||null}})}>
                <SelectTrigger className="flex-1 bg-card border"><SelectValue placeholder="Seleccionar centro de salud..." /></SelectTrigger>
                <SelectContent>{activeCenters.map(c=><SelectItem key={c.id} value={c.id}>{c.name} — {c.department}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => setNewHospitalOpen(true)}>
                <Building2 className="size-3.5" /><Plus className="size-3" />
              </Button>
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-5"><SectionHeader icon={HeartPulse} title="Tratamiento" />
          <div className="flex flex-col gap-2"><Label className={fl}>Tipo de tratamiento</Label><Input value={tx.treatmentType} onChange={e=>updateDraft({treatment:{...tx,treatmentType:e.target.value}})} placeholder="Ej: Quimioterapia" className="bg-card border" /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Frecuencia</Label><Input value={tx.treatmentFrequency??""} onChange={e=>updateDraft({treatment:{...tx,treatmentFrequency:e.target.value||null}})} placeholder="Ej: Cada 3 semanas" className="bg-card border" /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Fecha de inicio</Label><Input type="date" value={tx.startDate??""} onChange={e=>updateDraft({treatment:{...tx,startDate:e.target.value||null}})} className="bg-card border max-w-60" /></div>
          {/* Hospital de tratamiento */}
          <div className="flex flex-col gap-2"><Label className={fl}>Centro de salud del tratamiento</Label>
            <div className="flex gap-2">
              <Select value={tx.healthCenterId??""} onValueChange={v=>updateDraft({treatment:{...tx,healthCenterId:v||null}})}>
                <SelectTrigger className="flex-1 bg-card border"><SelectValue placeholder="Seleccionar centro de salud..." /></SelectTrigger>
                <SelectContent>{activeCenters.map(c=><SelectItem key={c.id} value={c.id}>{c.name} — {c.department}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => setNewHospitalOpen(true)}>
                <Building2 className="size-3.5" /><Plus className="size-3" />
              </Button>
            </div>
          </div>
        </section>
      </div>}

      {/* SIN SEGURO → SIS */}
      {!tieneSeguroReal && <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-5"><SectionHeader icon={HeartPulse} title="Afiliación SIS" />
          <div className="flex flex-col gap-2"><Label className={fl}>¿Puede afiliarse al SIS?</Label>
            <Select value={sis.canAffiliate===true?"Sí":sis.canAffiliate===false?"No":""} onValueChange={v=>updateDraft({sisAffiliation:{...sis,canAffiliate:v==="Sí"}})}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
          {sis.canAffiliate&&<div className="flex flex-col gap-2"><Label className={fl}>Fecha esperada de afiliación</Label><Input type="date" value={sis.expectedDate??""} onChange={e=>updateDraft({sisAffiliation:{...sis,expectedDate:e.target.value||null}})} className="bg-card border max-w-60" /></div>}
          {!sis.canAffiliate&&<div className="flex flex-col gap-2"><Label className={fl}>Motivo por el que no puede afiliarse</Label><Input value={sis.cantAffiliateReason??""} onChange={e=>updateDraft({sisAffiliation:{...sis,cantAffiliateReason:e.target.value||null}})} placeholder="Motivo..." className="bg-card border" /></div>}
        </section>
      </div>}

      <CreateHealthCenterDialog open={newHospitalOpen} onOpenChange={setNewHospitalOpen} />

      <StepNav currentStep={7} onPrev={prevStep} />
    </form>
  )
}
