import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { healthCentersApi } from "@/lib/api";
import { usePatient } from "../../_hooks/use-patient";
import type { CancerStage, InsuranceType, EpsProvider } from "@/types";

const educationOptions: Record<string, string> = {
  NONE: "Ninguno",
  INITIAL: "Inicial",
  PRIMARY_INCOMPLETE: "Primaria incompleta",
  PRIMARY: "Primaria",
  SECONDARY_INCOMPLETE: "Secundaria incompleta",
  SECONDARY: "Secundaria",
  TECHNICAL_INCOMPLETE: "Técnica incompleta",
  TECHNICAL: "Técnica",
  HIGHER_INCOMPLETE: "Superior incompleta",
  HIGHER: "Superior",
};

const cancerStageOptions: Record<CancerStage, string> = {
  STAGE_1: "Etapa 1",
  STAGE_2: "Etapa 2",
  STAGE_3: "Etapa 3",
  STAGE_4: "Etapa 4",
  UNKNOWN: "Desconocida",
};

const insuranceOptions: Record<InsuranceType, string> = {
  SIS: "SIS",
  ESSALUD: "EsSalud",
  EPS: "EPS",
  FUERZAS_ARMADAS: "Fuerzas Armadas",
  SALUDPOL: "SaludPol",
  NONE: "Ninguno",
};

const epsOptions: Record<EpsProvider, string> = {
  PACIFICO: "Pacífico",
  RIMAC: "Rímac",
  MAPFRE: "Mapfre",
  LA_POSITIVA: "La Positiva",
  SANITAS: "Sanitas",
  ONCOSALUD: "Oncosalud",
  OTHER: "Otro",
};

export interface PatientDetailsFormValues {
  currentAddress: string;
  currentDistrict: string;
  currentDepartment: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  educationLevel: string;
  nativeLanguage: string;
  requiresTranslation: boolean;
}

export interface DiagnosisFormValues {
  diagnosis: string;
  cancerStage: CancerStage;
  diagnosisDate: string;
  healthCenterId: string;
  symptomLeadingToCheckup: string;
  waitTimeForDiagnosis: string;
  hasMedicalReport: boolean;
}

export interface TreatmentFormValues {
  diagnosisId: string;
  treatmentType: string;
  treatmentFrequency: string;
  healthCenterId: string;
  startDate: string;
}

export interface InsuranceFormValues {
  insuranceType: InsuranceType | "";
  epsProvider: EpsProvider | "";
  changeReason: string;
  startDate: string;
  // SIS
  canAffiliate: boolean;
  expectedDate: string;
}

interface PatientUpdateTabsProps {
  pacienteId: string;
  detailsForm: ReturnType<typeof useForm<PatientDetailsFormValues>>;
  diagnosisForm: ReturnType<typeof useForm<DiagnosisFormValues>>;
  treatmentForm: ReturnType<typeof useForm<TreatmentFormValues>>;
  insuranceForm: ReturnType<typeof useForm<InsuranceFormValues>>;
}

export function PatientUpdateTabs({
  pacienteId,
  detailsForm,
  diagnosisForm,
  treatmentForm,
  insuranceForm,
}: PatientUpdateTabsProps) {
  const { data: patient } = usePatient(pacienteId);
  const { data: hospitals = [] } = useQuery({
    queryKey: ["health-centers"],
    queryFn: () => healthCentersApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const diagnoses = patient?.diagnoses ?? [];
  const currentDiagnosis = diagnoses.find((d) => d.isCurrent);

  return (
    <Tabs defaultValue="datos" className="w-full">
      <TabsList className="mb-4 w-full justify-start overflow-x-auto">
        <TabsTrigger value="datos">Datos generales</TabsTrigger>
        <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
        <TabsTrigger value="tratamiento">Tratamiento</TabsTrigger>
        <TabsTrigger value="seguro">Seguro / SIS</TabsTrigger>
      </TabsList>

      {/* ── Datos generales ── */}
      <TabsContent value="datos" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Dirección actual</Label>
            <Input {...detailsForm.register("currentAddress")} placeholder="Av. Principal 123" />
          </div>
          <div className="space-y-2">
            <Label>Distrito</Label>
            <Input {...detailsForm.register("currentDistrict")} placeholder="Miraflores" />
          </div>
          <div className="space-y-2">
            <Label>Contacto de emergencia</Label>
            <Input {...detailsForm.register("emergencyContactName")} placeholder="Nombre del contacto" />
          </div>
          <div className="space-y-2">
            <Label>Teléfono de emergencia</Label>
            <Input {...detailsForm.register("emergencyContactPhone")} placeholder="+51999000000" />
          </div>
          <div className="space-y-2">
            <Label>Departamento</Label>
            <Input {...detailsForm.register("currentDepartment")} placeholder="Lima" />
          </div>
          <div className="space-y-2">
            <Label>Lengua nativa</Label>
            <Input {...detailsForm.register("nativeLanguage")} placeholder="Español, Quechua..." />
          </div>
          <div className="space-y-2">
            <Label>Nivel educativo</Label>
            <Select
              value={detailsForm.watch("educationLevel")}
              onValueChange={(v) => detailsForm.setValue("educationLevel", v ?? "")}
            >
              <SelectTrigger>
                {detailsForm.watch("educationLevel")
                  ? educationOptions[detailsForm.watch("educationLevel")]
                  : <SelectValue placeholder="Seleccionar" />}
              </SelectTrigger>
              <SelectContent>
                {Object.entries(educationOptions).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex items-center gap-3 pt-2">
            <Checkbox
              checked={detailsForm.watch("requiresTranslation")}
              onCheckedChange={(v) => detailsForm.setValue("requiresTranslation", !!v)}
              id="requiresTranslation"
            />
            <Label htmlFor="requiresTranslation" className="cursor-pointer">
              Requiere traducción
            </Label>
          </div>
        </div>
      </TabsContent>

      {/* ── Diagnóstico ── */}
      <TabsContent value="diagnostico" className="space-y-4">
        {currentDiagnosis && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            Diagnóstico actual: <strong>{currentDiagnosis.diagnosis}</strong>
            {currentDiagnosis.cancerStage && ` (${cancerStageOptions[currentDiagnosis.cancerStage]})`}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Diagnóstico</Label>
            <Input {...diagnosisForm.register("diagnosis")} placeholder="Ej: Cáncer de mama" />
          </div>
          <div className="space-y-2">
            <Label>Etapa</Label>
            <Select
              value={diagnosisForm.watch("cancerStage")}
              onValueChange={(v) => diagnosisForm.setValue("cancerStage", v as CancerStage)}
            >
              <SelectTrigger>
                {diagnosisForm.watch("cancerStage")
                  ? cancerStageOptions[diagnosisForm.watch("cancerStage")]
                  : <SelectValue placeholder="Seleccionar" />}
              </SelectTrigger>
              <SelectContent>
                {Object.entries(cancerStageOptions).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fecha de diagnóstico</Label>
            <Input type="date" {...diagnosisForm.register("diagnosisDate")} />
          </div>
          <div className="space-y-2">
            <Label>Establecimiento de salud</Label>
            <Select
              value={diagnosisForm.watch("healthCenterId")}
              onValueChange={(v) => diagnosisForm.setValue("healthCenterId", v ?? "")}
            >
              <SelectTrigger>
                {diagnosisForm.watch("healthCenterId")
                  ? hospitals.find((h) => h.id === diagnosisForm.watch("healthCenterId"))?.name
                  : <SelectValue placeholder="Seleccionar" />}
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Síntoma que llevó a consulta</Label>
            <Input {...diagnosisForm.register("symptomLeadingToCheckup")} placeholder="Ej: Bulto en seno" />
          </div>
          <div className="space-y-2">
            <Label>Tiempo de espera para diagnóstico</Label>
            <Input {...diagnosisForm.register("waitTimeForDiagnosis")} placeholder="Ej: 2 meses" />
          </div>
          <div className="space-y-2 flex items-center gap-3 pt-2">
            <Checkbox
              checked={diagnosisForm.watch("hasMedicalReport")}
              onCheckedChange={(v) => diagnosisForm.setValue("hasMedicalReport", !!v)}
              id="hasReport"
            />
            <Label htmlFor="hasReport" className="cursor-pointer">Tiene informe médico</Label>
          </div>
        </div>
      </TabsContent>

      {/* ── Tratamiento ── */}
      <TabsContent value="tratamiento" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Diagnóstico asociado</Label>
            <Select
              value={treatmentForm.watch("diagnosisId")}
              onValueChange={(v) => treatmentForm.setValue("diagnosisId", v ?? "")}
            >
              <SelectTrigger>
                {treatmentForm.watch("diagnosisId")
                  ? diagnoses.find((d) => d.id === treatmentForm.watch("diagnosisId"))?.diagnosis
                  : <SelectValue placeholder="Seleccionar diagnóstico" />}
              </SelectTrigger>
              <SelectContent>
                {diagnoses.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.diagnosis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {diagnoses.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Primero registrá un diagnóstico.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tipo de tratamiento</Label>
            <Input {...treatmentForm.register("treatmentType")} placeholder="Ej: Quimioterapia" />
          </div>
          <div className="space-y-2">
            <Label>Frecuencia</Label>
            <Input {...treatmentForm.register("treatmentFrequency")} placeholder="Ej: Mensual" />
          </div>
          <div className="space-y-2">
            <Label>Fecha de inicio</Label>
            <Input type="date" {...treatmentForm.register("startDate")} />
          </div>
          <div className="space-y-2">
            <Label>Establecimiento</Label>
            <Select
              value={treatmentForm.watch("healthCenterId")}
              onValueChange={(v) => treatmentForm.setValue("healthCenterId", v ?? "")}
            >
              <SelectTrigger>
                {treatmentForm.watch("healthCenterId")
                  ? hospitals.find((h) => h.id === treatmentForm.watch("healthCenterId"))?.name
                  : <SelectValue placeholder="Seleccionar" />}
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      {/* ── Seguro / SIS ── */}
      <TabsContent value="seguro" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de seguro</Label>
            <Select
              value={insuranceForm.watch("insuranceType")}
              onValueChange={(v) => insuranceForm.setValue("insuranceType", v as InsuranceType)}
            >
              <SelectTrigger>
                {insuranceForm.watch("insuranceType")
                  ? insuranceOptions[insuranceForm.watch("insuranceType")]
                  : <SelectValue placeholder="Seleccionar" />}
              </SelectTrigger>
              <SelectContent>
                {Object.entries(insuranceOptions).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {insuranceForm.watch("insuranceType") === "EPS" && (
            <div className="space-y-2">
              <Label>Proveedor EPS</Label>
              <Select
                value={insuranceForm.watch("epsProvider") || ""}
                onValueChange={(v) => insuranceForm.setValue("epsProvider", v as EpsProvider)}
              >
                <SelectTrigger>
                  {insuranceForm.watch("epsProvider")
                    ? epsOptions[insuranceForm.watch("epsProvider") as EpsProvider]
                    : <SelectValue placeholder="Seleccionar" />}
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(epsOptions).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Motivo del cambio</Label>
            <Input {...insuranceForm.register("changeReason")} placeholder="Motivo" />
          </div>
          <div className="space-y-2">
            <Label>Fecha de inicio</Label>
            <Input type="date" {...insuranceForm.register("startDate")} />
          </div>
        </div>

        {insuranceForm.watch("insuranceType") === "NONE" && (
          <div className="border-t border-border/60 pt-4 mt-2">
            <p className="text-sm font-medium mb-3">Afiliación SIS</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 flex items-center gap-3">
                <Checkbox
                  checked={insuranceForm.watch("canAffiliate")}
                  onCheckedChange={(v) => insuranceForm.setValue("canAffiliate", !!v)}
                  id="canAffiliate"
                />
                <Label htmlFor="canAffiliate" className="cursor-pointer">
                  Puede afiliarse al SIS
                </Label>
              </div>
              <div className="space-y-2">
                <Label>Fecha esperada</Label>
                <Input type="date" {...insuranceForm.register("expectedDate")} />
              </div>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

// Default values factory
export const patientDetailsDefaults: PatientDetailsFormValues = {
  currentAddress: "",
  currentDistrict: "",
  currentDepartment: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  educationLevel: "",
  nativeLanguage: "",
  requiresTranslation: false,
};

export const diagnosisDefaults: DiagnosisFormValues = {
  diagnosis: "",
  cancerStage: "UNKNOWN",
  diagnosisDate: "",
  healthCenterId: "",
  symptomLeadingToCheckup: "",
  waitTimeForDiagnosis: "",
  hasMedicalReport: false,
};

export const treatmentDefaults: TreatmentFormValues = {
  diagnosisId: "",
  treatmentType: "",
  treatmentFrequency: "",
  healthCenterId: "",
  startDate: "",
};

export const insuranceDefaults: InsuranceFormValues = {
  insuranceType: "",
  epsProvider: "",
  changeReason: "",
  startDate: "",
  canAffiliate: false,
  expectedDate: "",
};
