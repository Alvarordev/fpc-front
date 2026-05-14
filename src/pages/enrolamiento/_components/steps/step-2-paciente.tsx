import { useEnrollmentStore } from "../../_store/enrollment-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { PatientRole } from "@/types";

const roleLabels: Record<PatientRole, string> = {
  PATIENT: "Paciente",
  COMPANION: "Acompañante",
  UNKNOWN: "Sin definir",
};

export function Step2Paciente() {
  const { draft, updateDraft } = useEnrollmentStore();
  const pd = draft.patientData;

  function updatePatient(partial: Partial<typeof pd>) {
    updateDraft({ patientData: { ...pd, ...partial } });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del paciente</CardTitle>
        <CardDescription>
          Información básica de identificación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre completo *</Label>
            <Input
              value={pd.fullName}
              onChange={(e) => updatePatient({ fullName: e.target.value })}
              placeholder="Ej: María García López"
            />
          </div>
          <div className="space-y-2">
            <Label>DNI</Label>
            <Input
              value={pd.dni ?? ""}
              onChange={(e) => updatePatient({ dni: e.target.value || null })}
              placeholder="12345678"
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha de nacimiento</Label>
            <Input
              type="date"
              value={pd.birthDate ?? ""}
              onChange={(e) => updatePatient({ birthDate: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select
              value={pd.role ?? "UNKNOWN"}
              onValueChange={(v) => updatePatient({ role: v as PatientRole })}
            >
              <SelectTrigger className="w-full">
                {(pd.role ? roleLabels[pd.role as PatientRole] : "Sin definir")}
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Teléfono principal *</Label>
            <Input
              value={pd.primaryPhone}
              onChange={(e) => updatePatient({ primaryPhone: e.target.value })}
              placeholder="987654321"
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono secundario</Label>
            <Input
              value={pd.secondaryPhone ?? ""}
              onChange={(e) => updatePatient({ secondaryPhone: e.target.value || null })}
              placeholder="999888777"
            />
          </div>
          <div className="space-y-2">
            <Label>¿Tiene WhatsApp?</Label>
            <Select
              value={pd.hasWhatsapp ? "true" : "false"}
              onValueChange={(v) => updatePatient({ hasWhatsapp: v === "true" })}
            >
              <SelectTrigger className="w-full">
                {pd.hasWhatsapp ? "Sí" : "No"}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sí</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
