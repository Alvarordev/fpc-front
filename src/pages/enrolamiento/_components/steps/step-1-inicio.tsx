import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { FileText, Clock } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"

export function Step1Inicio() {
  const { draft, updateDraft, nextStep } = useEnrollmentStore()
  const meta = draft.enrollmentMetadata
  const now = new Date().toTimeString().slice(0, 5)

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep() }} className="flex flex-col gap-8">
      <StepHeader step={1} title="Inicio de Afiliación" description="Registre los datos iniciales de la llamada." />
      <div className="flex flex-col gap-6">
        <SectionHeader icon={FileText} title="Notas del Caso" />
        <div className="flex flex-col gap-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Comentarios sobre el caso</Label>
          <Textarea
            value={meta.comments ?? ""}
            onChange={(e) => updateDraft({ enrollmentMetadata: { ...meta, comments: e.target.value } })}
            placeholder="Anote los comentarios iniciales del paciente o familiar..."
            className="min-h-24 bg-card border"
          />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <SectionHeader icon={Clock} title="Registro de Tiempo" />
        <div className="flex flex-col gap-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Hora de inicio <span className="text-destructive">*</span></Label>
          <Input
            type="time"
            value={meta.startTime?.slice(0, 5) ?? now}
            onChange={(e) => updateDraft({ enrollmentMetadata: { ...meta, startTime: e.target.value } })}
            className="max-w-48 bg-card border"
          />
        </div>
      </div>
      <StepNav currentStep={1} isFirst />
    </form>
  )
}
