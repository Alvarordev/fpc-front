import { useState } from "react";
import { Calendar as CalendarIcon, User, Building2, Stethoscope, FileText, Loader2, Plus, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { useHealthCenters } from "@/pages/hospitales/_hooks/use-health-centers";
import { usePatients } from "@/pages/pacientes/_hooks/use-patients";
import { useCreateMedicalAppointment } from "../_hooks/use-medical-appointments";

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

const COMMON_SPECIALTIES = [
  "Oncología Médica",
  "Radioterapia",
  "Mastología / Cirugía Oncológica",
  "Ginecología Oncológica",
  "Ecografía / Diagnóstico por Imágenes",
  "Quimioterapia",
  "Psicooncología",
  "Cuidados Paliativos",
  "Medicina General / Chequeo",
];

export function CreateAppointmentDialog({ open, onOpenChange }: CreateAppointmentDialogProps) {
  const [patientId, setPatientId] = useState("");
  const [healthCenterId, setHealthCenterId] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [nextAppointmentDate, setNextAppointmentDate] = useState("");
  const [hasReferralSheet, setHasReferralSheet] = useState(false);
  const [referredTo, setReferredTo] = useState("");
  const [difficulties, setDifficulties] = useState("");
  const [isFirstConsultation, setIsFirstConsultation] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { data: patientPage } = usePatients();
  const patients = patientPage?.data ?? [];
  const { data: healthCenters = [] } = useHealthCenters();
  const createAppointment = useCreateMedicalAppointment();

  const patientOptions: SearchableOption[] = patients.map((p) => ({
    value: p.id,
    label: p.fullName,
    sublabel: `${p.dni ? `DNI: ${p.dni}` : "Sin DNI"} | Tel: ${p.primaryPhone}`,
  }));

  const healthCenterOptions: SearchableOption[] = healthCenters.map((hc) => ({
    value: hc.id,
    label: hc.name,
    sublabel: hc.department,
  }));

  function resetForm() {
    setPatientId("");
    setHealthCenterId("");
    setSpecialty("");
    setCustomSpecialty("");
    setAppointmentDate("");
    setAppointmentTime("");
    setNextAppointmentDate("");
    setHasReferralSheet(false);
    setReferredTo("");
    setDifficulties("");
    setIsFirstConsultation(false);
    setErrorMsg("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      setErrorMsg("Selecciona un paciente.");
      return;
    }

    const finalSpecialty = specialty === "OTRO" ? customSpecialty.trim() : specialty;
    if (!finalSpecialty) {
      setErrorMsg("Selecciona o especifica una especialidad médica.");
      return;
    }

    try {
      setErrorMsg("");
      await createAppointment.mutateAsync({
        patientId,
        healthCenterId: healthCenterId || undefined,
        specialty: finalSpecialty,
        appointmentDate: appointmentDate || undefined,
        appointmentTime: appointmentTime || undefined,
        nextAppointmentDate: nextAppointmentDate || undefined,
        hasReferralSheet,
        referredTo: referredTo.trim() || undefined,
        difficulties: difficulties.trim() || undefined,
        isFirstConsultation,
      });

      resetForm();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al agendar la cita médica.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 font-semibold text-base">
            <CalendarIcon className="size-5" />
            <DialogTitle className="text-lg">Agendar Cita Médica</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Registra una cita programada de 30 minutos para un paciente en su hospital asignado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-2.5 text-xs rounded-md bg-red-50 text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Patient Searchable Combobox */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <User className="size-3.5 text-muted-foreground" />
              Paciente *
            </label>
            <SearchableSelect
              options={patientOptions}
              value={patientId}
              onChange={setPatientId}
              placeholder="Buscar paciente por nombre o DNI..."
              searchPlaceholder="Escribe el nombre o DNI del paciente..."
            />
          </div>

          {/* Health Center Searchable Combobox */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Building2 className="size-3.5 text-muted-foreground" />
              Establecimiento de Salud
            </label>
            <SearchableSelect
              options={healthCenterOptions}
              value={healthCenterId}
              onChange={setHealthCenterId}
              placeholder="Buscar hospital o clínica..."
              searchPlaceholder="Escribe el nombre del hospital..."
            />
          </div>

          {/* Specialty */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Stethoscope className="size-3.5 text-muted-foreground" />
              Especialidad Médica *
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">-- Selecciona Especialidad --</option>
              {COMMON_SPECIALTIES.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
              <option value="OTRO">Otra especialidad...</option>
            </select>
            {specialty === "OTRO" && (
              <input
                type="text"
                placeholder="Especifica la especialidad médica"
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                className="w-full mt-1.5 bg-background border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            )}
          </div>

          {/* Date & Time Slot (30-min) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <CalendarIcon className="size-3.5 text-red-600" />
                Fecha de Cita
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Clock className="size-3.5 text-red-600" />
                Hora (30 min)
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Seleccionar Hora...</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t} hrs (Duración: 30 min)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Next Appointment Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Próxima Cita de Control (Opcional)</label>
            <input
              type="date"
              value={nextAppointmentDate}
              onChange={(e) => setNextAppointmentDate(e.target.value)}
              className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Referral Sheet Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="hasReferral"
              checked={hasReferralSheet}
              onChange={(e) => setHasReferralSheet(e.target.checked)}
              className="size-4 text-red-600 rounded focus:ring-red-500 border-gray-300 cursor-pointer"
            />
            <label htmlFor="hasReferral" className="text-xs font-medium text-foreground cursor-pointer">
              Cuenta con Hoja de Referencia médica
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="firstConsult"
              checked={isFirstConsultation}
              onChange={(e) => setIsFirstConsultation(e.target.checked)}
              className="size-4 text-red-600 rounded focus:ring-red-500 border-gray-300 cursor-pointer"
            />
            <label htmlFor="firstConsult" className="text-xs font-medium text-foreground cursor-pointer">
              Es Primera Consulta Oncológica
            </label>
          </div>

          {/* Referred To */}
          {hasReferralSheet && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <FileText className="size-3.5 text-muted-foreground" />
                Referido A (Hospital o Servicio)
              </label>
              <input
                type="text"
                placeholder="Ej. INEN - Departamento de Radioterapia"
                value={referredTo}
                onChange={(e) => setReferredTo(e.target.value)}
                className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {/* Difficulties / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Dificultades u Observaciones
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Paciente requiere transporte de apoyo, espera de repuesto para equipo..."
              value={difficulties}
              onChange={(e) => setDifficulties(e.target.value)}
              className="w-full bg-background border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={createAppointment.isPending}
            >
              {createAppointment.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="size-3.5 mr-1.5" />
                  Agendar Cita
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
