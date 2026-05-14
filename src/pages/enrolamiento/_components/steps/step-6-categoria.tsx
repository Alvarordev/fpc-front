import { useForm, Controller } from "react-hook-form"; import { zodResolver } from "@hookform/resolvers/zod"; import { z } from "zod"
import { Label } from "@/components/ui/label"; import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag } from "lucide-react"; import { useEnrollmentStore, Q27_BRANCH_MAP } from "../../_store/enrollment-store"
import { StepHeader, SectionHeader, StepNav } from "../shared"
const Q27=["Signos y Síntomas / Seguro","Signos y Sintomas / EPS-ESSALUD","Signos y Sintomas / Privado","Signos y Síntomas / No Seguro","Diagnóstico de Cáncer / Seguro","Diagnostico de Cancer / EPS-ESSALUD","Diagnostico de Cancer / Privado","Diagnóstico de Cáncer / No Seguro","Servicio Psicooncológico","Servicios FPC","Otros"]
export function Step6Categoria(){const{formData,saveStepData,nextStep,prevStep,setRejection}=useEnrollmentStore()
const{control,handleSubmit,formState:{errors}}=useForm({resolver:zodResolver(z.object({q27_categoria:z.string().min(1,"Requerido")})),defaultValues:{q27_categoria:formData.q27_categoria??""}})
return<form onSubmit={handleSubmit(v=>{saveStepData(v);const b=Q27_BRANCH_MAP[v.q27_categoria];if(b==="signos_privado"||b==="dx_privado"){setRejection("q27_privado");return};nextStep()})} className="flex flex-col gap-8">
<StepHeader step={6} title="Categorización del Paciente" description="Seleccione la categoría que describe la situación del paciente." />
<div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"><p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-700/80">Aviso importante</p><p className="text-sm text-foreground/70">Esta selección determina las preguntas del siguiente paso. Pacientes con seguro privado no son elegibles.</p></div>
<div className="flex flex-col gap-6"><SectionHeader icon={Tag} title="Perfil Clínico" />
<div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Categorización <span className="text-destructive">*</span></Label>
<Controller name="q27_categoria" control={control} render={({field})=>(<Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{Q27.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>)} />{errors.q27_categoria&&<p className="text-xs text-destructive">{errors.q27_categoria.message}</p>}</div></div>
<StepNav currentStep={6} onPrev={prevStep} /></form>}
