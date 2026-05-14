import { useForm, Controller } from "react-hook-form"; import { zodResolver } from "@hookform/resolvers/zod"; import { z } from "zod"
import { Label } from "@/components/ui/label"; import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardList } from "lucide-react"; import { useEnrollmentStore } from "../../_store/enrollment-store"
import { StepHeader, SectionHeader, StepNav } from "../shared"
const schema=z.object({q8_consentimiento:z.string().min(1,"Seleccione")})
export function Step4Consentimiento(){const{formData,saveStepData,nextStep,prevStep,setRejection}=useEnrollmentStore()
const{control,handleSubmit,formState:{errors}}=useForm({resolver:zodResolver(schema),defaultValues:{q8_consentimiento:formData.q8_consentimiento??""}})
return<form onSubmit={handleSubmit(v=>{saveStepData(v);if(v.q8_consentimiento==="No acepto"){setRejection("q8_no");return};nextStep()})} className="flex flex-col gap-8">
<StepHeader step={4} title="Consentimiento Informado" description="Lea el consentimiento al paciente y registre su respuesta." />
<div className="rounded-xl border border-primary/15 bg-primary/5 p-5"><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary/70">Instrucción para el agente</p><p className="text-sm leading-relaxed text-foreground/80">Lea el consentimiento informado completo disponible en el panel derecho.</p></div>
<div className="flex flex-col gap-6"><SectionHeader icon={ClipboardList} title="Respuesta del Paciente" />
<div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Consentimiento informado <span className="text-destructive">*</span></Label>
<Controller name="q8_consentimiento" control={control} render={({field})=>(<Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent><SelectItem value="Acepto">Acepto — el paciente acepta</SelectItem><SelectItem value="No acepto">No acepto — el paciente no acepta</SelectItem></SelectContent></Select>)} />{errors.q8_consentimiento&&<p className="text-xs text-destructive">{errors.q8_consentimiento.message}</p>}</div></div>
<StepNav currentStep={4} onPrev={prevStep} /></form>}
