import { useForm, Controller } from "react-hook-form"; import { zodResolver } from "@hookform/resolvers/zod"; import { z } from "zod"
import { Label } from "@/components/ui/label"; import { Input } from "@/components/ui/input"; import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCheck } from "lucide-react"; import { useEnrollmentStore } from "../../_store/enrollment-store"
import { StepHeader, SectionHeader, StepNav } from "../shared"
const schema=z.object({q5_esPacienteOnco:z.string(),q6_esFamiliar:z.string(),q7_nombreTercero:z.string(),_tipo:z.string()}).refine(d=>d._tipo!=="Para mi"||d.q5_esPacienteOnco!=="",{message:"Seleccione",path:["q5_esPacienteOnco"]}).refine(d=>d._tipo!=="Para un tercero (familar /amigo)"||d.q6_esFamiliar!=="",{message:"Seleccione",path:["q6_esFamiliar"]})
export function Step3Identificacion(){const{formData,saveStepData,nextStep,prevStep}=useEnrollmentStore();const p=formData;const tipo=p.q4_tipo??"";const pm=tipo==="Para mi";const pt=tipo==="Para un tercero (familar /amigo)"
const{register,control,handleSubmit}=useForm({resolver:zodResolver(schema),defaultValues:{q5_esPacienteOnco:p.q5_esPacienteOnco??"",q6_esFamiliar:p.q6_esFamiliar??"",q7_nombreTercero:p.q7_nombreTercero??"",_tipo:tipo}})
return<form onSubmit={handleSubmit(({_tipo:_,...rest})=>{saveStepData(rest);nextStep()})} className="flex flex-col gap-8">
<StepHeader step={3} title="Identificación del Llamante" description="Determine la relación del llamante con el paciente." />
<div className="flex flex-col gap-6"><SectionHeader icon={UserCheck} title="Relación con el Paciente" />
{pm&&<div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">¿Usted es paciente oncológico?</Label>
<Controller name="q5_esPacienteOnco" control={control} render={({field})=>(<Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí, soy paciente oncológico</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select>)} /></div>}
{pt&&<><div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">¿Usted es familiar del paciente oncológico?</Label>
<Controller name="q6_esFamiliar" control={control} render={({field})=>(<Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí, soy familiar</SelectItem><SelectItem value="No">No, soy amigo u otra persona</SelectItem></SelectContent></Select>)} /></div>
<div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Nombre completo del familiar o acompañante</Label><Input placeholder="Nombre y apellidos" className="bg-card border" {...register("q7_nombreTercero")} /></div></>}
{!pm&&!pt&&<div className="rounded-xl bg-card p-4 text-sm text-muted-foreground">Tipo de afiliación no definido. Regrese al paso anterior.</div>}</div>
<StepNav currentStep={3} onPrev={prevStep} /></form>}
