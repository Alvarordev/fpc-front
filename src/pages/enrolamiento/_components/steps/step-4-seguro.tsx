import { useEnrollmentStore } from "../../_store/enrollment-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { InsuranceType, EpsProvider } from "@/types";

const insuranceLabels: Record<InsuranceType, string> = {
  SIS: "SIS", ESSALUD: "EsSalud", EPS: "EPS", FUERZAS_ARMADAS: "Fuerzas Armadas", SALUDPOL: "SaludPol", NONE: "Ninguno",
};
const epsLabels: Record<EpsProvider, string> = {
  PACIFICO: "Pacífico", RIMAC: "Rímac", MAPFRE: "Mapfre", LA_POSITIVA: "La Positiva", SANITAS: "Sanitas", ONCOSALUD: "Oncosalud", OTHER: "Otro",
};

export function Step4Seguro() {
  const { draft, updateDraft } = useEnrollmentStore();
  const ins = draft.insurance;

  function update(partial: Partial<typeof ins>) { updateDraft({ insurance: { ...ins, ...partial } }); }

  return (
    <Card>
      <CardHeader><CardTitle>Seguro del paciente</CardTitle><CardDescription>Información del seguro de salud.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de seguro</Label>
            <Select value={ins.insuranceType} onValueChange={(v) => { update({ insuranceType: v as InsuranceType }); if (v !== "EPS") update({ epsProvider: undefined }); }}>
              <SelectTrigger className="w-full">{insuranceLabels[ins.insuranceType as InsuranceType]}</SelectTrigger>
              <SelectContent>{Object.entries(insuranceLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          {ins.insuranceType === "EPS" && (
            <div className="space-y-2">
              <Label>Proveedor EPS</Label>
              <Select value={ins.epsProvider ?? ""} onValueChange={(v) => update({ epsProvider: (v as EpsProvider) || null })}>
                <SelectTrigger className="w-full">{ins.epsProvider ? epsLabels[ins.epsProvider as EpsProvider] : "Seleccionar..."}</SelectTrigger>
                <SelectContent>{Object.entries(epsLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2"><Label>Fecha de inicio</Label><Input type="date" value={ins.startDate ?? ""} onChange={(e) => update({ startDate: e.target.value || null })} /></div>
          <div className="space-y-2"><Label>Motivo de cambio</Label><Input value={ins.changeReason ?? ""} onChange={(e) => update({ changeReason: e.target.value || null })} placeholder="Primer registro" /></div>
        </div>
      </CardContent>
    </Card>
  );
}
