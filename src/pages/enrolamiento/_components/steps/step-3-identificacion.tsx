import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCheck } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"

export function Step3Identificacion() {
  const { draft, updateDraft, nextStep, prevStep } = useEnrollmentStore()
  const meta = draft.enrollmentMetadata
  const isParaMi = meta.affiliationType === "PATIENT"
  const isParaTercero = meta.affiliationType === "FAMILY"

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep() }} className="flex flex-col gap-8">
      <StepHeader step={3} title="Identificación del Llamante" description="Determine la relación del llamante con el paciente oncológico." />
      <div className="flex flex-col gap-6"><SectionHeader icon={UserCheck} title="Relación con el Paciente" />
        {isParaMi && (
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">¿Usted es paciente oncológico?</Label>
            <Select
              value={meta.isOncologicalPatient === true ? "Sí" : meta.isOncologicalPatient === false ? "No" : ""}
              onValueChange={(v) => updateDraft({ enrollmentMetadata: { ...meta, isOncologicalPatient: v === "Sí" } })}
            >
              <SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent><SelectItem value="Sí">Sí, soy paciente oncológico</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
            </Select>
          </div>
        )}
        {isParaTercero && (
          <>
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">¿Usted es familiar del paciente oncológico?</Label>
              <Select
                value={meta.isOncologicalPatient === true ? "Sí" : meta.isOncologicalPatient === false ? "No" : ""}
                onValueChange={(v) => updateDraft({ enrollmentMetadata: { ...meta, isOncologicalPatient: v === "Sí" } })}
              >
                <SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent><SelectItem value="Sí">Sí, soy familiar</SelectItem><SelectItem value="No">No, soy amigo u otra persona</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Nombre completo del familiar o acompañante</Label>
              <Input
                value={meta.nombreTercero ?? ""}
                onChange={(e) => updateDraft({ enrollmentMetadata: { ...meta, nombreTercero: e.target.value } })}
                placeholder="Nombre y apellidos de quien llama"
                className="bg-card border"
              />
            </div>
          </>
        )}
        {!isParaMi && !isParaTercero && (
          <div className="rounded-xl bg-card p-4 text-sm text-muted-foreground">Tipo de afiliación no definido. Regrese al paso anterior.</div>
        )}
      </div>
      <StepNav currentStep={3} onPrev={prevStep} />
    </form>
  )
}
