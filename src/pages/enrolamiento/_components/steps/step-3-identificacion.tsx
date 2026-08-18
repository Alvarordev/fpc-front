import { useEnrollmentStore } from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCheck } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"
import { genderLabels, relationshipLabels } from "@/pages/pacientes/[id]/_lib/clinical-labels"
import { isMinor } from "../../_utils/patient-age"

const fl = "text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70"
const ic = "bg-card border"
const sc = "w-full bg-card border"
const CAREGIVER_OPTIONS = [
  { value: "Sí", label: "Sí, registrar cuidador" },
  { value: "No", label: "No" },
] as const

export function Step3Identificacion() {
  const { draft, updateDraft, nextStep, prevStep } = useEnrollmentStore()
  const meta = draft.enrollmentMetadata
  const companion = draft.companion
  const isParaMi = meta.affiliationType === "PATIENT"
  const isParaTercero = meta.affiliationType === "FAMILY"
  const showCompanionForm = isParaTercero || meta.hasCaregiver === true
  const patientIsMinor = isMinor(draft.patientData.birthDate)

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep() }} className="flex flex-col gap-8">
      <StepHeader step={3} title="Identificación del Llamante" description="Determine la relación del llamante con el paciente oncológico." />
      <div className="flex flex-col gap-6"><SectionHeader icon={UserCheck} title="Relación con el Paciente" />
        {isParaMi && (
          <>
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
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">¿Hay un cuidador distinto del paciente?</Label>
              <Select
                items={CAREGIVER_OPTIONS}
                value={meta.hasCaregiver === true ? "Sí" : "No"}
                onValueChange={(v) => updateDraft({
                  enrollmentMetadata: { ...meta, hasCaregiver: v === "Sí" },
                  ...(v === "No" ? { companion: { fullName: "", primaryPhone: "" } } : {}),
                })}
              >
                <SelectTrigger className="w-full bg-card border"><SelectValue /></SelectTrigger>
                <SelectContent>{CAREGIVER_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </>
        )}
        {showCompanionForm && (
          <>
            {isParaTercero && <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">¿Usted es familiar del paciente oncológico?</Label>
              <Select
                value={meta.isOncologicalPatient === true ? "Sí" : meta.isOncologicalPatient === false ? "No" : ""}
                onValueChange={(v) => updateDraft({ enrollmentMetadata: { ...meta, isOncologicalPatient: v === "Sí" } })}
              >
                <SelectTrigger className="w-full bg-card border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent><SelectItem value="Sí">Sí, soy familiar</SelectItem><SelectItem value="No">No, soy amigo u otra persona</SelectItem></SelectContent>
              </Select>
            </div>}
            {patientIsMinor && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-700/80">Paciente menor de edad</p>
                <p className="text-sm text-foreground/70">
                  Complete todos los datos del acompañante o tutor a continuación.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className={fl}>{isParaTercero ? "Nombre completo del familiar o acompañante" : "Nombre completo del cuidador"} <span className="text-destructive">*</span></Label>
                <Input
                  value={companion.fullName}
                  onChange={(e) => updateDraft({ companion: { ...companion, fullName: e.target.value } })}
                  placeholder={isParaTercero ? "Nombre y apellidos de quien llama" : "Nombre y apellidos del cuidador"}
                  className={ic}
                />
              </div>
              <div className="flex flex-col gap-2">
               <Label className={fl}>Parentesco con el paciente <span className="text-destructive">*</span></Label>
                <Select items={Object.entries(relationshipLabels).map(([value, label]) => ({ value, label }))} value={companion.relationship ?? ""} onValueChange={(v) => updateDraft({ companion: { ...companion, relationship: v ?? undefined } })}>
                  <SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{Object.entries(relationshipLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className={fl}>DNI</Label>
                <Input
                  value={companion.dni ?? ""}
                  onChange={(e) => updateDraft({ companion: { ...companion, dni: e.target.value || undefined } })}
                  placeholder="74829304"
                  className={ic}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={companion.birthDate ?? ""}
                  onChange={(e) => updateDraft({ companion: { ...companion, birthDate: e.target.value || undefined } })}
                  className={ic}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
                <Label className={fl}>Género del cuidador</Label>
              <Select items={Object.entries(genderLabels).map(([value, label]) => ({ value, label }))} value={companion.gender ?? ""} onValueChange={(v) => updateDraft({ companion: { ...companion, gender: v || undefined } })}>
                <SelectTrigger className={sc}><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{Object.entries(genderLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className={fl}>Teléfono principal <span className="text-destructive">*</span></Label>
                <Input
                  value={companion.primaryPhone}
                  onChange={(e) => updateDraft({ companion: { ...companion, primaryPhone: e.target.value } })}
                  placeholder="999 000 777"
                  className={ic}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>Teléfono secundario</Label>
                <Input
                  value={companion.secondaryPhone ?? ""}
                  onChange={(e) => updateDraft({ companion: { ...companion, secondaryPhone: e.target.value || undefined } })}
                  placeholder="999 888 777"
                  className={ic}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className={fl}>¿Tiene WhatsApp?</Label>
              <Select value={companion.hasWhatsapp ? "Sí" : "No"} onValueChange={(v) => updateDraft({ companion: { ...companion, hasWhatsapp: v === "Sí" } })}>
                <SelectTrigger className={sc}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className={fl}>Correo electrónico</Label>
              <Input
                type="email"
                value={companion.email ?? ""}
                onChange={(e) => updateDraft({ companion: { ...companion, email: e.target.value || undefined } })}
                placeholder="acompanante@correo.com"
                className={ic}
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
