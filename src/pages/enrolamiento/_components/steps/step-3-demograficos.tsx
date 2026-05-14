import { useEnrollmentStore } from "../../_store/enrollment-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { EducationLevel } from "@/types";

const educationLabels: Record<EducationLevel, string> = {
  NONE: "Sin estudios", INITIAL: "Inicial", PRIMARY_INCOMPLETE: "Primaria incompleta",
  PRIMARY: "Primaria", SECONDARY_INCOMPLETE: "Secundaria incompleta", SECONDARY: "Secundaria",
  TECHNICAL_INCOMPLETE: "Técnica incompleta", TECHNICAL: "Técnica",
  HIGHER_INCOMPLETE: "Superior incompleta", HIGHER: "Superior",
};

export function Step3Demograficos() {
  const { draft, updateDraft } = useEnrollmentStore();
  const d = draft.details;

  function update(partial: Partial<typeof d>) {
    updateDraft({ details: { ...d, ...partial } });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos demográficos</CardTitle>
        <CardDescription>Dirección, educación, idioma y contacto de emergencia.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Dirección actual</Label><Input value={d.currentAddress ?? ""} onChange={(e) => update({ currentAddress: e.target.value || null })} placeholder="Av. Principal 123" /></div>
          <div className="space-y-2"><Label>Distrito</Label><Input value={d.currentDistrict ?? ""} onChange={(e) => update({ currentDistrict: e.target.value || null })} placeholder="Miraflores" /></div>
          <div className="space-y-2"><Label>Departamento</Label><Input value={d.currentDepartment ?? ""} onChange={(e) => update({ currentDepartment: e.target.value || null })} placeholder="Lima" /></div>
          <div className="space-y-2"><Label>Departamento de nacimiento</Label><Input value={d.birthDepartment ?? ""} onChange={(e) => update({ birthDepartment: e.target.value || null })} placeholder="Lima" /></div>
          <div className="space-y-2"><Label>Tiempo de viaje al hospital</Label><Input value={d.travelTimeToHospital ?? ""} onChange={(e) => update({ travelTimeToHospital: e.target.value || null })} placeholder="30 minutos" /></div>
          <div className="space-y-2"><Label>Nivel educativo</Label>
            <Select value={d.educationLevel ?? ""} onValueChange={(v) => update({ educationLevel: (v as EducationLevel) || null })}>
              <SelectTrigger className="w-full">{d.educationLevel ? educationLabels[d.educationLevel as EducationLevel] : "Seleccionar..."}</SelectTrigger>
              <SelectContent>{Object.entries(educationLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Lengua nativa</Label><Input value={d.nativeLanguage ?? ""} onChange={(e) => update({ nativeLanguage: e.target.value || null })} placeholder="Español" /></div>
          <div className="space-y-2"><Label>¿Requiere traducción?</Label>
            <Select value={d.requiresTranslation ? "true" : "false"} onValueChange={(v) => update({ requiresTranslation: v === "true" })}>
              <SelectTrigger className="w-full">{d.requiresTranslation ? "Sí" : "No"}</SelectTrigger>
              <SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Sí</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Contacto de emergencia</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={d.emergencyContactName ?? ""} onChange={(e) => update({ emergencyContactName: e.target.value || null })} placeholder="Carlos García" /></div>
            <div className="space-y-2"><Label>Teléfono</Label><Input value={d.emergencyContactPhone ?? ""} onChange={(e) => update({ emergencyContactPhone: e.target.value || null })} placeholder="987111222" /></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
