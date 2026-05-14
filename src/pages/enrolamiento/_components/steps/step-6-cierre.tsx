import { useEnrollmentStore } from "../../_store/enrollment-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export function Step6Cierre() {
  const { draft, updateDraft } = useEnrollmentStore();
  const tx = draft.treatment;
  const sis = draft.sisAffiliation;
  const meta = draft.enrollmentMetadata;

  function updateTx(partial: Partial<typeof tx>) { updateDraft({ treatment: { ...tx, ...partial } }); }
  function updateSis(partial: Partial<typeof sis>) { updateDraft({ sisAffiliation: { ...sis, ...partial } }); }
  function updateMeta(partial: Partial<typeof meta>) { updateDraft({ enrollmentMetadata: { ...meta, ...partial } }); }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Tratamiento</CardTitle><CardDescription>Información del tratamiento oncológico.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Tipo de tratamiento</Label><Input value={tx.treatmentType} onChange={(e) => updateTx({ treatmentType: e.target.value })} placeholder="Quimioterapia" /></div>
            <div className="space-y-2"><Label>Frecuencia</Label><Input value={tx.treatmentFrequency ?? ""} onChange={(e) => updateTx({ treatmentFrequency: e.target.value || null })} placeholder="Cada 3 semanas" /></div>
            <div className="space-y-2"><Label>Fecha de inicio</Label><Input type="date" value={tx.startDate ?? ""} onChange={(e) => updateTx({ startDate: e.target.value || null })} /></div>
            <div className="space-y-2"><Label>Motivo de no recibir tratamiento</Label><Input value={tx.notReceivingReason ?? ""} onChange={(e) => updateTx({ notReceivingReason: e.target.value || null })} placeholder="Si aplica" /></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Afiliación SIS</CardTitle><CardDescription>Solo se procesa si no hay seguro real.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>¿Puede afiliarse al SIS?</Label>
              <Select value={sis.canAffiliate ? "true" : "false"} onValueChange={(v) => updateSis({ canAffiliate: v === "true" })}>
                <SelectTrigger className="w-full">{sis.canAffiliate ? "Sí" : "No"}</SelectTrigger>
                <SelectContent><SelectItem value="true">Sí</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fecha esperada de afiliación</Label><Input type="date" value={sis.expectedDate ?? ""} onChange={(e) => updateSis({ expectedDate: e.target.value || null })} /></div>
            {!sis.canAffiliate && (
              <div className="space-y-2 md:col-span-2"><Label>Motivo por el cual no puede afiliarse</Label><Input value={sis.cantAffiliateReason ?? ""} onChange={(e) => updateSis({ cantAffiliateReason: e.target.value || null })} placeholder="Motivo..." /></div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Metadata del enrolamiento</CardTitle><CardDescription>Consentimientos y datos del programa.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>¿Es paciente oncológico?</Label>
              <Select value={meta.isOncologicalPatient ? "true" : "false"} onValueChange={(v) => updateMeta({ isOncologicalPatient: v === "true" })}>
                <SelectTrigger className="w-full">{meta.isOncologicalPatient ? "Sí" : "No"}</SelectTrigger>
                <SelectContent><SelectItem value="true">Sí</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Punto de entrada al programa</Label><Input value={meta.programEntryPoint ?? ""} onChange={(e) => updateMeta({ programEntryPoint: e.target.value || null })} placeholder="WhatsApp" /></div>
            <div className="space-y-2"><Label>¿Aceptó política de datos?</Label>
              <Select value={meta.dataPolicyAccepted ? "true" : "false"} onValueChange={(v) => updateMeta({ dataPolicyAccepted: v === "true" })}>
                <SelectTrigger className="w-full">{meta.dataPolicyAccepted ? "Sí" : "No"}</SelectTrigger>
                <SelectContent><SelectItem value="true">Sí</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>¿Aceptó consentimiento informado?</Label>
              <Select value={meta.informedConsentAccepted ? "true" : "false"} onValueChange={(v) => updateMeta({ informedConsentAccepted: v === "true" })}>
                <SelectTrigger className="w-full">{meta.informedConsentAccepted ? "Sí" : "No"}</SelectTrigger>
                <SelectContent><SelectItem value="true">Sí</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
