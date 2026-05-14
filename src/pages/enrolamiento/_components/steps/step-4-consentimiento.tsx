import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardList } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"

export function Step4Consentimiento() {
  const { draft, updateDraft, nextStep, prevStep, setRejection } = useEnrollmentStore()
  const meta = draft.enrollmentMetadata

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep() }} className="flex flex-col gap-8">
      <StepHeader step={4} title="Consentimiento Informado" description="Lea el consentimiento al paciente y registre su respuesta." />
      <div className="rounded-xl border border-primary/15 bg-primary/5 p-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary/70">Instrucción para el agente</p>
        <p className="text-sm leading-relaxed text-foreground/80">Lea el consentimiento informado completo disponible en el panel derecho.</p>
      </div>
      <div className="flex flex-col gap-6"><SectionHeader icon={ClipboardList} title="Respuesta del Paciente" />
        <div className="flex flex-col gap-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Consentimiento informado <span className="text-destructive">*</span></Label>
          <Select
            value={meta.informedConsentAccepted === true ? "Acepto" : meta.informedConsentAccepted === false ? "No acepto" : ""}
            onValueChange={(v) => {
              if (v === "No acepto") { updateDraft({ enrollmentMetadata: { ...meta, informedConsentAccepted: false } }); setRejection("q8_no"); return }
              updateDraft({ enrollmentMetadata: { ...meta, informedConsentAccepted: true } })
            }}
          >
            <SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar respuesta del paciente..." /></SelectTrigger>
            <SelectContent><SelectItem value="Acepto">Acepto — el paciente acepta</SelectItem><SelectItem value="No acepto">No acepto — el paciente no acepta</SelectItem></SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground/60">Si el paciente no acepta, la inscripción finalizará en este paso.</p>
        </div>
      </div>
      <StepNav currentStep={4} onPrev={prevStep} />
    </form>
  )
}
