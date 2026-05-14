import { useEnrollmentStore } from "../../_store/enrollment-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { CancerStage } from "@/types";

const stageLabels: Record<CancerStage, string> = {
  STAGE_1: "Etapa 1", STAGE_2: "Etapa 2", STAGE_3: "Etapa 3", STAGE_4: "Etapa 4", UNKNOWN: "Desconocida",
};

export function Step5Diagnostico() {
  const { draft, updateDraft } = useEnrollmentStore();
  const dx = draft.diagnosis;
  const sr = draft.symptomReport;

  function updateDx(partial: Partial<typeof dx>) { updateDraft({ diagnosis: { ...dx, ...partial } }); }
  function updateSr(partial: Partial<typeof sr>) { updateDraft({ symptomReport: { ...sr, ...partial } }); }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Signos y síntomas</CardTitle><CardDescription>Reporte de malestar y consulta médica previa.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>¿Presenta malestar o dolor?</Label>
              <Select value={sr.hasDiscomfort ? "true" : "false"} onValueChange={(v) => updateSr({ hasDiscomfort: v === "true" })}>
                <SelectTrigger className="w-full">{sr.hasDiscomfort ? "Sí" : "No"}</SelectTrigger>
                <SelectContent><SelectItem value="true">Sí</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>¿Buscó consulta médica?</Label>
              <Select value={sr.hasSoughtMedicalConsultation ? "true" : "false"} onValueChange={(v) => updateSr({ hasSoughtMedicalConsultation: v === "true" })}>
                <SelectTrigger className="w-full">{sr.hasSoughtMedicalConsultation ? "Sí" : "No"}</SelectTrigger>
                <SelectContent><SelectItem value="true">Sí</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Signos y síntomas</Label><Textarea value={sr.signsAndSymptoms ?? ""} onChange={(e) => updateSr({ signsAndSymptoms: e.target.value || null })} placeholder="Describí los signos y síntomas..." className="min-h-20" /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Diagnóstico</CardTitle><CardDescription>Información del diagnóstico oncológico.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2"><Label>Diagnóstico *</Label><Input value={dx.diagnosis} onChange={(e) => updateDx({ diagnosis: e.target.value })} placeholder="Ej: Cáncer de mama" /></div>
            <div className="space-y-2"><Label>Etapa del cáncer</Label>
              <Select value={dx.cancerStage ?? ""} onValueChange={(v) => updateDx({ cancerStage: (v as CancerStage) || null })}>
                <SelectTrigger className="w-full">{dx.cancerStage ? stageLabels[dx.cancerStage as CancerStage] : "Seleccionar..."}</SelectTrigger>
                <SelectContent>{Object.entries(stageLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fecha de diagnóstico</Label><Input type="date" value={dx.diagnosisDate ?? ""} onChange={(e) => updateDx({ diagnosisDate: e.target.value || null })} /></div>
            <div className="space-y-2"><Label>Especialidad</Label><Input value={dx.diagnosisSpecialty ?? ""} onChange={(e) => updateDx({ diagnosisSpecialty: e.target.value || null })} placeholder="Oncología" /></div>
            <div className="space-y-2"><Label>¿Tiene informe médico?</Label>
              <Select value={dx.hasMedicalReport ? "true" : "false"} onValueChange={(v) => updateDx({ hasMedicalReport: v === "true" })}>
                <SelectTrigger className="w-full">{dx.hasMedicalReport ? "Sí" : "No"}</SelectTrigger>
                <SelectContent><SelectItem value="true">Sí</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Síntoma que llevó al chequeo</Label><Input value={dx.symptomLeadingToCheckup ?? ""} onChange={(e) => updateDx({ symptomLeadingToCheckup: e.target.value || null })} placeholder="Bulto en el seno" /></div>
            <div className="space-y-2"><Label>Tiempo de espera para diagnóstico</Label><Input value={dx.waitTimeForDiagnosis ?? ""} onChange={(e) => updateDx({ waitTimeForDiagnosis: e.target.value || null })} placeholder="3 semanas" /></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
