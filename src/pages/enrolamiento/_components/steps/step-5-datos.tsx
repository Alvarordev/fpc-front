import { useState } from "react"
import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"; import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, MapPin, Phone, GraduationCap, ShieldCheck, LogIn } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"
import type { InsuranceType, EpsProvider, EducationLevel } from "@/types"

const fl="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70"; const ic="bg-card border"
const sc="w-full bg-card border"
const EDU:Record<EducationLevel,string>={NONE:"Sin estudios",INITIAL:"Inicial",PRIMARY_INCOMPLETE:"Primaria incompleta",PRIMARY:"Primaria",SECONDARY_INCOMPLETE:"Secundaria incompleta",SECONDARY:"Secundaria",TECHNICAL_INCOMPLETE:"Técnica incompleta",TECHNICAL:"Técnica",HIGHER_INCOMPLETE:"Superior incompleta",HIGHER:"Superior"}
const INS:Record<InsuranceType,string>={SIS:"SIS",ESSALUD:"EsSalud",EPS:"EPS",FUERZAS_ARMADAS:"Fuerzas Armadas",SALUDPOL:"SaludPol",NONE:"Ninguno"}
const EPS_LABELS:Record<EpsProvider,string>={PACIFICO:"Pacífico",RIMAC:"Rímac",MAPFRE:"Mapfre",LA_POSITIVA:"La Positiva",SANITAS:"Sanitas",ONCOSALUD:"Oncosalud",OTHER:"Otro"}

const ENTRY_POINTS = [
  "Llamada directa",
  "Referido por paciente",
  "Referido por Voluntario",
  "Redes Sociales de FPC",
  "Campaña prevención",
  "Centro de salud/hospital",
  "Otro",
] as const

const NATIVE_LANGUAGES = [
  "Castellano",
  "Quechua",
  "Aymara",
  "Lenguaje de Señas",
  "Otros",
] as const

export function Step5Datos() {
  const { draft, updateDraft, nextStep, prevStep } = useEnrollmentStore()
  const pd = draft.patientData; const d = draft.details; const ins = draft.insurance
  const meta = draft.enrollmentMetadata

  const saved = meta.programEntryPoint

  const [entryPoint, setEntryPoint] = useState<string>(() => {
    if (!saved) return ""
    if ((ENTRY_POINTS as readonly string[]).includes(saved)) return saved
    return "Otro"
  })

  const [customEntryPoint, setCustomEntryPoint] = useState<string>(() => {
    if (!saved) return ""
    if ((ENTRY_POINTS as readonly string[]).includes(saved)) return ""
    return saved
  })

  function handleEntryPointChange(v: string) {
    setEntryPoint(v)
    setCustomEntryPoint("")
    if (v === "Otro") {
      updateDraft({ enrollmentMetadata: { ...meta, programEntryPoint: undefined } })
    } else {
      updateDraft({ enrollmentMetadata: { ...meta, programEntryPoint: v } })
    }
  }

  const savedLang = d.nativeLanguage

  const [nativeLanguage, setNativeLanguage] = useState<string>(() => {
    if (!savedLang) return ""
    if ((NATIVE_LANGUAGES as readonly string[]).includes(savedLang)) return savedLang
    return "Otros"
  })

  const [customNativeLanguage, setCustomNativeLanguage] = useState<string>(() => {
    if (!savedLang) return ""
    if ((NATIVE_LANGUAGES as readonly string[]).includes(savedLang)) return ""
    return savedLang
  })

  function handleNativeLanguageChange(v: string) {
    setNativeLanguage(v)
    setCustomNativeLanguage("")
    if (v === "Otros") {
      updateDraft({ details: { ...d, nativeLanguage: undefined } })
    } else {
      updateDraft({ details: { ...d, nativeLanguage: v } })
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep() }} className="flex flex-col gap-10">
      <StepHeader step={5} title="Datos del Paciente" description="Complete los datos de identidad, demográficos, contacto y seguro." />
      <section className="flex flex-col gap-5"><SectionHeader icon={CreditCard} title="Información de Identidad" />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2"><Label className={fl}>DNI <span className="text-destructive">*</span></Label><Input placeholder="74829304" className={ic} value={pd.dni??""} onChange={e=>updateDraft({patientData:{...pd,dni:e.target.value||null}})} /></div>
          <div className="flex flex-col gap-2"><Label className={fl}>Fecha de nacimiento <span className="text-destructive">*</span></Label><Input type="date" className={ic} value={pd.birthDate??""} onChange={e=>updateDraft({patientData:{...pd,birthDate:e.target.value||null}})} /></div>
        </div>
        <div className="flex flex-col gap-2"><Label className={fl}>Nombre completo <span className="text-destructive">*</span></Label><Input placeholder="Tal como aparece en el DNI" className={ic} value={pd.fullName} onChange={e=>updateDraft({patientData:{...pd,fullName:e.target.value}})} /></div>
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
          <div className="flex flex-col gap-2"><Label className={fl}>Lengua nativa</Label>
            <Select value={nativeLanguage} onValueChange={handleNativeLanguageChange}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>{NATIVE_LANGUAGES.map(l=><SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2"><Label className={fl}>¿Requiere traducción?</Label>
            <Select value={d.requiresTranslation?"Sí":"No"} onValueChange={v=>updateDraft({details:{...d,requiresTranslation:v==="Sí"}})}><SelectTrigger className={sc}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
        </div>
        {nativeLanguage==="Otros"&&<div className="flex flex-col gap-2"><Label className={fl}>Especificar lengua</Label>
          <Input placeholder="Escriba la lengua nativa" className={ic} value={customNativeLanguage}
            onChange={e=>{setCustomNativeLanguage(e.target.value);updateDraft({details:{...d,nativeLanguage:e.target.value||undefined}})}} />
        </div>}
      </section>
      <section className="flex flex-col gap-5"><SectionHeader icon={ShieldCheck} title="Seguro de Salud" />
        <div className="flex flex-col gap-2"><Label className={fl}>¿Actualmente cuenta con un seguro de salud? <span className="text-destructive">*</span></Label>
          <Select value={ins.insuranceType!=="NONE"?"Sí":"No"} onValueChange={v=>{if(v==="No"){updateDraft({insurance:{...ins,insuranceType:"NONE",epsProvider:undefined,startDate:null},sisAffiliation:{canAffiliate:true}})}else{updateDraft({insurance:{...ins,insuranceType:"SIS"}})}}}>
            <SelectTrigger className={sc}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
        {ins.insuranceType!=="NONE"&&<>
          <div className="flex flex-col gap-2"><Label className={fl}>Tipo de seguro <span className="text-destructive">*</span></Label>
          <Select value={ins.insuranceType} onValueChange={v=>{updateDraft({insurance:{...ins,insuranceType:v as InsuranceType,epsProvider:v!=="EPS"?undefined:ins.epsProvider}});if(v==="NONE")updateDraft({sisAffiliation:{canAffiliate:true}})}}><SelectTrigger className={sc}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(INS).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
        {ins.insuranceType==="EPS"&&<div className="flex flex-col gap-2"><Label className={fl}>Proveedor EPS</Label>
          <Select value={ins.epsProvider??""} onValueChange={v=>updateDraft({insurance:{...ins,epsProvider:v as EpsProvider}})}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{Object.entries(EPS_LABELS).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>}
        <div className="flex flex-col gap-2"><Label className={fl}>Fecha de inicio del seguro</Label><Input type="date" className={ic} value={ins.startDate??""} onChange={e=>updateDraft({insurance:{...ins,startDate:e.target.value||null}})} /></div>
        </>}
      </section>
      <section className="flex flex-col gap-5"><SectionHeader icon={LogIn} title="Punto de Ingreso" />
        <div className="flex flex-col gap-2"><Label className={fl}>¿Cuál fue el punto de ingreso al programa?</Label>
          <Select value={entryPoint} onValueChange={handleEntryPointChange}><SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>{ENTRY_POINTS.map(ep=><SelectItem key={ep} value={ep}>{ep}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {entryPoint==="Otro"&&<div className="flex flex-col gap-2"><Label className={fl}>Especificar</Label>
          <Input placeholder="Describa el punto de ingreso" className={ic} value={customEntryPoint}
            onChange={e=>{setCustomEntryPoint(e.target.value);updateDraft({enrollmentMetadata:{...meta,programEntryPoint:e.target.value||undefined}})}} />
        </div>}
      </section>
      <StepNav currentStep={5} onPrev={prevStep} />
    </form>
  )
}
