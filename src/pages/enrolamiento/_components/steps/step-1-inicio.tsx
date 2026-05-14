import { useForm } from "react-hook-form"; import { zodResolver } from "@hookform/resolvers/zod"; import { z } from "zod"
import { Label } from "@/components/ui/label"; import { Textarea } from "@/components/ui/textarea"; import { Input } from "@/components/ui/input"
import { FileText, Clock } from "lucide-react"; import { useEnrollmentStore } from "../../_store/enrollment-store"
import { StepHeader, SectionHeader, StepNav } from "../shared"
const schema=z.object({q1_comentarios:z.string(),q2_horaInicio:z.string().min(1,"Ingrese la hora de inicio")})
export function Step1Inicio(){const{formData,saveStepData,nextStep}=useEnrollmentStore();const now=new Date().toTimeString().slice(0,5)
const{register,handleSubmit,formState:{errors}}=useForm({resolver:zodResolver(schema),defaultValues:{q1_comentarios:formData.q1_comentarios??"",q2_horaInicio:formData.q2_horaInicio??now}})
return<form onSubmit={handleSubmit(v=>{saveStepData(v);nextStep()})} className="flex flex-col gap-8">
<StepHeader step={1} title="Inicio de Afiliación" description="Registre los datos iniciales de la llamada." />
<div className="flex flex-col gap-6"><SectionHeader icon={FileText} title="Notas del Caso" />
<div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Comentarios sobre el caso</Label>
<Textarea placeholder="Anote los comentarios iniciales..." className="min-h-24 bg-card border" {...register("q1_comentarios")} /></div></div>
<div className="flex flex-col gap-6"><SectionHeader icon={Clock} title="Registro de Tiempo" />
<div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Hora de inicio <span className="text-destructive">*</span></Label>
<Input type="time" className="max-w-48 bg-card border" {...register("q2_horaInicio")} />{errors.q2_horaInicio&&<p className="text-xs text-destructive">{errors.q2_horaInicio.message}</p>}</div></div>
<StepNav currentStep={1} isFirst /></form>}
