import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, Users } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"

export function Step2Consent() {
  const { draft, updateDraft, nextStep, prevStep, setRejection } = useEnrollmentStore()
  const meta = draft.enrollmentMetadata

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep() }} className="flex flex-col gap-8">
      <StepHeader step={2} title="Consentimiento de Datos" description="Verifique el acuerdo del paciente con la política de datos." />
      <div className="flex flex-col gap-6">
        <SectionHeader icon={ShieldCheck} title="Autorización de Datos" />
        <div className="flex flex-col gap-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Acuerdo con la política de datos <span className="text-destructive">*</span></Label>
          <Select
            value={meta.dataPolicyAccepted === true ? "Sí" : meta.dataPolicyAccepted === false ? "No" : ""}
            onValueChange={(v) => {
              if (v === "No") { updateDraft({ enrollmentMetadata: { ...meta, dataPolicyAccepted: false } }); setRejection("q3_no"); return }
              updateDraft({ enrollmentMetadata: { ...meta, dataPolicyAccepted: true } })
            }}
          >
            <SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent><SelectItem value="Sí">Sí, está de acuerdo</SelectItem><SelectItem value="No">No, no está de acuerdo</SelectItem></SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground/60">Si el paciente no está de acuerdo, la inscripción no puede continuar.</p>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <SectionHeader icon={Users} title="Tipo de Afiliación" />
        <div className="flex flex-col gap-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">¿Afiliación para usted o para un familiar? <span className="text-destructive">*</span></Label>
          <Select
            value={meta.affiliationType ?? "" as any}
            onValueChange={(v) => updateDraft({ enrollmentMetadata: { ...meta, affiliationType: v }, patientData: { ...draft.patientData, role: v === "PATIENT" ? "PATIENT" : "COMPANION" } })}
          >
            <SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent><SelectItem value="PATIENT">Para mí — soy el paciente</SelectItem><SelectItem value="FAMILY">Para un tercero — familiar o amigo</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <StepNav currentStep={2} onPrev={prevStep} />
    </form>
  )
}
