import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight, Clock, FileText } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"

interface Props {
  onOpenNotes: () => void
  notesCount: number
}

export function Step1Inicio({ onOpenNotes, notesCount }: Props) {
  const { draft, updateDraft, nextStep } = useEnrollmentStore()
  const meta = draft.enrollmentMetadata
  const now = new Date().toTimeString().slice(0, 5)

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep() }} className="flex flex-col gap-8">
      <StepHeader step={1} title="Inicio de Afiliación" description="Registre los datos iniciales de la llamada." />
      <div className="flex flex-col gap-6">
        <SectionHeader icon={FileText} title="Notas del Caso" />
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
          <p className="text-sm font-medium text-foreground">Notas del enrolamiento</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Aquí podrás escribir las notas que surjan durante todos los pasos del enrolamiento.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full justify-between gap-2 bg-background"
            onClick={onOpenNotes}
          >
            <span className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Abrir notas del enrolamiento
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {notesCount > 0 ? `${notesCount} ${notesCount === 1 ? "nota" : "notas"}` : "Sin notas"}
              <ChevronRight className="size-3.5" />
            </span>
          </Button>
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
