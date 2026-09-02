import { useState } from "react"
import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarDays, ChevronRight, Clock, FileText } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"

interface Props {
  onOpenNotes: () => void
  notesCount: number
  historical?: boolean
}

export function Step1Inicio({ onOpenNotes, notesCount, historical = false }: Props) {
  const { draft, updateDraft, nextStep } = useEnrollmentStore()
  const [error, setError] = useState<string | null>(null)
  const meta = draft.enrollmentMetadata
  const now = new Date().toTimeString().slice(0, 5)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (historical && !draft.historicalEnrollmentDate) {
      setError("Indica la fecha real de enrolamiento")
      return
    }
    setError(null)
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <StepHeader
        step={1}
        title={historical ? "Inicio de carga histórica" : "Inicio de Afiliación"}
        description={
          historical
            ? "Indique cuándo ocurrió el enrolamiento. La fecha de carga se registra aparte."
            : "Registre los datos iniciales de la llamada."
        }
      />
      {historical && (
        <div className="flex flex-col gap-6">
          <SectionHeader icon={CalendarDays} title="Fecha del hecho" />
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
              Fecha real de enrolamiento <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={draft.historicalEnrollmentDate}
              onChange={(event) => {
                updateDraft({ historicalEnrollmentDate: event.target.value })
                setError(null)
              }}
              className="max-w-56 bg-card border"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Se conservará como fecha calendario, sin inventar una hora.
            </p>
          </div>
        </div>
      )}
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
          <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
            {historical ? "Hora de inicio (opcional)" : "Hora de inicio"}
            {!historical && <span className="text-destructive"> *</span>}
          </Label>
          <Input
            type="time"
            value={historical ? (meta.startTime?.slice(0, 5) ?? "") : (meta.startTime?.slice(0, 5) ?? now)}
            onChange={(e) => updateDraft({ enrollmentMetadata: { ...meta, startTime: e.target.value } })}
            className="max-w-48 bg-card border"
          />
          {historical && <p className="text-xs text-muted-foreground">Déjela vacía si solo conoce el día.</p>}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <StepNav currentStep={1} isFirst />
    </form>
  )
}
