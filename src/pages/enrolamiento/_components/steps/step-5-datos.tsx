import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"; import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, MapPin, Phone, GraduationCap, ShieldCheck } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"
import type { InsuranceType, EpsProvider, EducationLevel } from "@/types"

const fl="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70"; const ic="bg-card border"
const sc="w-full bg-card border"
const EDU:Record<EducationLevel,string>={NONE:"Sin estudios",INITIAL:"Inicial",PRIMARY_INCOMPLETE:"Primaria incompleta",PRIMARY:"Primaria",SECONDARY_INCOMPLETE:"Secundaria incompleta",SECONDARY:"Secundaria",TECHNICAL_INCOMPLETE:"Técnica incompleta",TECHNICAL:"Técnica",HIGHER_INCOMPLETE:"Superior incompleta",HIGHER:"Superior"}
const INS:Record<InsuranceType,string>={SIS:"SIS",ESSALUD:"EsSalud",EPS:"EPS",FUERZAS_ARMADAS:"Fuerzas Armadas",SALUDPOL:"SaludPol",NONE:"Ninguno"}
const EPS_LABELS:Record<EpsProvider,string>={PACIFICO:"Pacífico",RIMAC:"Rímac",MAPFRE:"Mapfre",LA_POSITIVA:"La Positiva",SANITAS:"Sanitas",ONCOSALUD:"Oncosalud",OTHER:"Otro"}

export function Step5Datos() {
  const { draft, updateDraft, nextStep, prevStep } = useEnrollmentStore()
  const pd = draft.patientData; const d = draft.details; const ins = draft.insurance

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep() }} className="flex flex-col gap-10">
      <StepHeader step={5} title="Datos del Paciente" description="Complete los datos de identidad, demográficos, contacto y seguro." />
      <section className="flex flex-col gap-5"><SectionHeader icon={CreditCard} title="Información de Identidad" />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2"><Label className={fl}>DNI <span className="text-destructive">*</span></Label><Input placeholder="74829304" className={ic} value={pd.dni??""} onChange={e=>updateDraft({patientData:{...pd,dni:e.target.value||null}})} /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Fecha de nacimiento <span className="text-destructive">*</span></Label><Input type="date" className={ic} value={pd.birthDate??""} onChange={e=>updateDraft({patientData:{...pd,birthDate:e.target.value||null}})} /></div>
        </div>
        <div className="flex flex-col gap-2"><Label className={fl}>Nombre completo <span className="text-destructive">*</span></Label><Input placeholder="Tal como aparece en el DNI" className={ic} value={pd.fullName} onChange={e=>updateDraft({patientData:{...pd,fullName:e.target.value}})} /></div>
        <div className="flex flex-col gap-2"><Label className={fl}>Rol</Label>
          <Select value={pd.role??"PATIENT"} onValueChange={v=>updateDraft({patientData:{...pd,role:v as any}})}><SelectTrigger className={sc}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PATIENT">Paciente</SelectItem><SelectItem value="COMPANION">Acompañante</SelectItem></SelectContent></Select></div>
      </section>
      <section className="flex flex-col gap-5"><SectionHeader icon={MapPin} title="Datos Demográficos" />
        <div className="flex flex-col gap-2"><Label className={fl}>Dirección actual</Label><Input placeholder="Av. Principal 123" className={ic} value={d.currentAddress??""} onChange={e=>updateDraft({details:{...d,currentAddress:e.target.value||null}})} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2"><Label className={fl}>Distrito</Label><Input placeholder="Miraflores" className={ic} value={d.currentDistrict??""} onChange={e=>updateDraft({details:{...d,currentDistrict:e.target.value||null}})} /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Departamento</Label><Input placeholder="Lima" className={ic} value={d.currentDepartment??""} onChange={e=>updateDraft({details:{...d,currentDepartment:e.target.value||null}})} /></div>
        </div>
        <div className="flex flex-col gap-2"><Label className={fl}>Tiempo de viaje al hospital</Label><Input placeholder="30 minutos" className={ic} value={d.travelTimeToHospital??""} onChange={e=>updateDraft({details:{...d,travelTimeToHospital:e.target.value||null}})} /></div>
        <div className="flex flex-col gap-2"><Label className={fl}>¿Dirección DNI coincide con actual?</Label>
          <Select value={d.dniMatchesAddress===true?"Sí":d.dniMatchesAddress===false?"No":""} onValueChange={v=>updateDraft({details:{...d,dniMatchesAddress:v==="Sí"}})}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
      </section>
      <section className="flex flex-col gap-5"><SectionHeader icon={Phone} title="Contacto" />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2"><Label className={fl}>Teléfono principal <span className="text-destructive">*</span></Label><Input placeholder="987654321" className={ic} value={pd.primaryPhone} onChange={e=>updateDraft({patientData:{...pd,primaryPhone:e.target.value}})} /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Teléfono secundario</Label><Input placeholder="999888777" className={ic} value={pd.secondaryPhone??""} onChange={e=>updateDraft({patientData:{...pd,secondaryPhone:e.target.value||null}})} /></div>
        </div>
        <div className="flex flex-col gap-2"><Label className={fl}>¿Tiene WhatsApp?</Label>
          <Select value={pd.hasWhatsapp?"Sí":"No"} onValueChange={v=>updateDraft({patientData:{...pd,hasWhatsapp:v==="Sí"}})}><SelectTrigger className={sc}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2"><Label className={fl}>Contacto de emergencia</Label><Input placeholder="Nombre" className={ic} value={d.emergencyContactName??""} onChange={e=>updateDraft({details:{...d,emergencyContactName:e.target.value||null}})} /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Tel. emergencia</Label><Input placeholder="987654321" className={ic} value={d.emergencyContactPhone??""} onChange={e=>updateDraft({details:{...d,emergencyContactPhone:e.target.value||null}})} /></div>
        </div>
      </section>
      <section className="flex flex-col gap-5"><SectionHeader icon={GraduationCap} title="Perfil Socioeducativo" />
        <div className="flex flex-col gap-2"><Label className={fl}>Nivel educativo</Label>
          <Select value={d.educationLevel??""} onValueChange={v=>updateDraft({details:{...d,educationLevel:v as EducationLevel}})}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{Object.entries(EDU).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2"><Label className={fl}>Lengua nativa</Label><Input placeholder="Español" className={ic} value={d.nativeLanguage??""} onChange={e=>updateDraft({details:{...d,nativeLanguage:e.target.value||null}})} /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>¿Requiere traducción?</Label>
            <Select value={d.requiresTranslation?"Sí":"No"} onValueChange={v=>updateDraft({details:{...d,requiresTranslation:v==="Sí"}})}><SelectTrigger className={sc}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
        </div>
      </section>
      <section className="flex flex-col gap-5"><SectionHeader icon={ShieldCheck} title="Seguro de Salud" />
        <div className="flex flex-col gap-2"><Label className={fl}>Tipo de seguro <span className="text-destructive">*</span></Label>
          <Select value={ins.insuranceType} onValueChange={v=>{updateDraft({insurance:{...ins,insuranceType:v as InsuranceType,epsProvider:v!=="EPS"?undefined:ins.epsProvider}});if(v==="NONE")updateDraft({sisAffiliation:{canAffiliate:true}})}}><SelectTrigger className={sc}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(INS).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
        {ins.insuranceType==="EPS"&&<div className="flex flex-col gap-2"><Label className={fl}>Proveedor EPS</Label>
          <Select value={ins.epsProvider??""} onValueChange={v=>updateDraft({insurance:{...ins,epsProvider:v as EpsProvider}})}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{Object.entries(EPS_LABELS).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>}
        <div className="flex flex-col gap-2"><Label className={fl}>Fecha de inicio del seguro</Label><Input type="date" className={ic} value={ins.startDate??""} onChange={e=>updateDraft({insurance:{...ins,startDate:e.target.value||null}})} /></div>
      </section>
      <StepNav currentStep={5} onPrev={prevStep} />
    </form>
  )
}
