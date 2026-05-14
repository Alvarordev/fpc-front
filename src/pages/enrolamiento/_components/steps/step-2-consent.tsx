import { useForm, Controller } from "react-hook-form"; import { zodResolver } from "@hookform/resolvers/zod"; import { z } from "zod"
import { Label } from "@/components/ui/label"; import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, Users } from "lucide-react"; import { useEnrollmentStore } from "../../_store/enrollment-store"
import { StepHeader, SectionHeader, StepNav } from "../shared"
const schema=z.object({q3_acuerdo:z.string().min(1,"Seleccione"),q4_tipo:z.string().min(1,"Seleccione")})
export function Step2Consent(){const{formData,saveStepData,nextStep,prevStep,setRejection}=useEnrollmentStore()
const{control,handleSubmit,formState:{errors}}=useForm({resolver:zodResolver(schema),defaultValues:{q3_acuerdo:formData.q3_acuerdo??"",q4_tipo:formData.q4_tipo??""}})
return<form onSubmit={handleSubmit(v=>{saveStepData(v);if(v.q3_acuerdo==="No"){setRejection("q3_no");return};nextStep()})} className="flex flex-col gap-8">
<StepHeader step={2} title="Consentimiento de Datos" description="Verifique el acuerdo del paciente con la política de datos." />
<div className="flex flex-col gap-6"><SectionHeader icon={ShieldCheck} title="Autorización de Datos" />
<div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Acuerdo con la política de datos <span className="text-destructive">*</span></Label>
<Controller name="q3_acuerdo" control={control} render={({field})=>(<Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Sí">Sí, está de acuerdo</SelectItem><SelectItem value="No">No, no está de acuerdo</SelectItem></SelectContent></Select>)} />{errors.q3_acuerdo&&<p className="text-xs text-destructive">{errors.q3_acuerdo.message}</p>}</div></div>
<div className="flex flex-col gap-6"><SectionHeader icon={Users} title="Tipo de Afiliación" />
<div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">¿Afiliación para usted o para un familiar? <span className="text-destructive">*</span></Label>
<Controller name="q4_tipo" control={control} render={({field})=>(<Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Para mi">Para mí — soy el paciente</SelectItem><SelectItem value="Para un tercero (familar /amigo)">Para un tercero — familiar o amigo</SelectItem></SelectContent></Select>)} />{errors.q4_tipo&&<p className="text-xs text-destructive">{errors.q4_tipo.message}</p>}</div></div>
<StepNav currentStep={2} onPrev={prevStep} /></form>}
