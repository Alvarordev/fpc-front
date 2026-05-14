import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"

export function Step6Categoria() {
  const { categoriaClinica, setCategoria, nextStep, prevStep, draft } = useEnrollmentStore()
  const seguro = draft.insurance.insuranceType
  

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep() }} className="flex flex-col gap-8">
      <StepHeader step={6} title="Categorización del Paciente" description="Seleccione la categoría clínica para determinar los datos a registrar." />
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"><p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-700/80">Información</p><p className="text-sm text-foreground/70">Seguro seleccionado: <strong>{seguro && seguro !== "NONE" ? seguro : "Sin seguro"}</strong>. Esta selección determina los campos del siguiente paso.</p></div>
      <div className="flex flex-col gap-6"><SectionHeader icon={Tag} title="Perfil Clínico" />
        <div className="flex flex-col gap-2"><Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Categorización <span className="text-destructive">*</span></Label>
          <Select value={categoriaClinica ?? ""} onValueChange={(v) => setCategoria(v as any)}>
            <SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent><SelectItem value="signos">Signos y Síntomas</SelectItem><SelectItem value="diagnostico">Diagnóstico de Cáncer</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <StepNav currentStep={6} onPrev={prevStep} />
    </form>
  )
}
