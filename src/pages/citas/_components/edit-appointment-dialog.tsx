import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { useHealthCenters } from "@/pages/hospitales/_hooks/use-health-centers";
import { useUpdateMedicalAppointment } from "../_hooks/use-medical-appointments";
import type { MedicalAppointment, UpdateMedicalAppointmentInput } from "@/api/medical-appointments";
import { Calendar, Clock, Stethoscope, Building2, FileCheck, Loader2 } from "lucide-react";

interface EditAppointmentDialogProps {
  appointment: MedicalAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

export function EditAppointmentDialog({
  appointment,
  open,
  onOpenChange,
}: EditAppointmentDialogProps) {
  const { data: healthCenters = [] } = useHealthCenters();
  const updateAppointmentMutation = useUpdateMedicalAppointment();

  const [healthCenterId, setHealthCenterId] = useState(() => appointment?.healthCenterId || "");
  const [appointmentDate, setAppointmentDate] = useState(() => appointment?.appointmentDate || "");
  const [appointmentTime, setAppointmentTime] = useState(() => appointment?.appointmentTime || "");
  const [nextAppointmentDate, setNextAppointmentDate] = useState(() => appointment?.nextAppointmentDate || "");
  const [hasReferralSheet, setHasReferralSheet] = useState(() => appointment?.hasReferralSheet || false);
  const [referredTo, setReferredTo] = useState(() => appointment?.referredTo || "");
  const [difficulties, setDifficulties] = useState(() => appointment?.difficulties || "");
  const [isFirstConsultation, setIsFirstConsultation] = useState(() => appointment?.isFirstConsultation || false);
  const [attendedViaSepa, setAttendedViaSepa] = useState<boolean | undefined>(
    () => appointment?.attendedViaSepa ?? undefined,
  );
  const [referredViaSepa, setReferredViaSepa] = useState<boolean | undefined>(
    () => appointment?.referredViaSepa ?? undefined,
  );
  const [changeReason, setChangeReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const healthCenterOptions: SearchableOption[] = healthCenters.map((hc) => ({
    value: hc.id,
    label: hc.name,
    sublabel: hc.department,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    if (!changeReason.trim()) {
      setErrorMsg("Indica el motivo del cambio.");
      return;
    }

    const payload: UpdateMedicalAppointmentInput = {
      healthCenterId: healthCenterId || undefined,
      appointmentDate: appointmentDate || undefined,
      appointmentTime: appointmentTime || undefined,
      nextAppointmentDate: nextAppointmentDate || undefined,
      hasReferralSheet,
      referredTo: referredTo || undefined,
      difficulties: difficulties || undefined,
      isFirstConsultation,
      attendedViaSepa,
      referredViaSepa,
      changeReason: changeReason.trim(),
    };

    setErrorMsg("");
    updateAppointmentMutation.mutate(
      { id: appointment.id, data: payload },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: (err) => {
          setErrorMsg(err instanceof Error ? err.message : "No se pudo actualizar la cita médica.");
        },
      }
    );
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 font-semibold">
            <Calendar className="size-5" />
            <DialogTitle className="text-base">Editar Cita Médica</DialogTitle>
          </div>
          <div className="text-xs text-muted-foreground pt-0.5">
            Paciente: <span className="font-bold text-foreground">{appointment.patientFullName || "N/A"}</span> ({appointment.patientDni || "Sin DNI"})
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-md bg-red-50 text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Specialty (read-only — the backend forbids changing it) */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <Stethoscope className="size-3.5 text-muted-foreground" />
              Especialidad Médica
            </label>
            <div className="w-full bg-muted/30 border rounded-md px-3 py-1.5 text-muted-foreground">
              {appointment.specialty}
            </div>
            <p className="text-[10px] text-muted-foreground">
              La especialidad no se puede cambiar — agenda una nueva cita si el paciente necesita otra.
            </p>
          </div>

          {/* Hospital / Clínica */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1">
              <Building2 className="size-3.5 text-muted-foreground" />
              Hospital / Centro de Salud
            </label>
            <SearchableSelect
              options={healthCenterOptions}
              value={healthCenterId}
              onChange={setHealthCenterId}
              placeholder="Buscar hospital o clínica..."
              searchPlaceholder="Escribe el nombre del hospital..."
            />
          </div>

          {/* Date & Time (30-min Slot) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="size-3.5 text-red-600" />
                Fecha de la Cita
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full bg-background border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Clock className="size-3.5 text-red-600" />
                Hora (30 min)
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full bg-background border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
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
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Próxima Cita / Control (Opcional)</label>
            <input
              type="date"
              value={nextAppointmentDate}
              onChange={(e) => setNextAppointmentDate(e.target.value)}
              className="w-full bg-background border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Referral Sheet & Details */}
          <div className="p-3 border rounded-lg bg-muted/20 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editHasReferralSheet"
                checked={hasReferralSheet}
                onChange={(e) => setHasReferralSheet(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500 size-4 cursor-pointer"
              />
              <label htmlFor="editHasReferralSheet" className="font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
                <FileCheck className="size-3.5 text-blue-600" />
                ¿Cuenta con Hoja de Referencia oficial?
              </label>
            </div>

            {hasReferralSheet && (
              <div className="space-y-1 pt-1 pl-6">
                <label className="text-[11px] font-medium text-muted-foreground">Derivado / Referido a</label>
                <input
                  type="text"
                  value={referredTo}
                  onChange={(e) => setReferredTo(e.target.value)}
                  placeholder="Ej. INEN, Hospital Neoplásicas"
                  className="w-full bg-background border rounded-md px-3 py-1 text-xs focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* First Consultation Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editIsFirstConsultation"
              checked={isFirstConsultation}
              onChange={(e) => setIsFirstConsultation(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500 size-4 cursor-pointer"
            />
            <label htmlFor="editIsFirstConsultation" className="font-medium text-foreground cursor-pointer">
              Es Primera Consulta
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">
                ¿Asistió a la consulta de atención primaria a partir del soporte de SEPA?
              </label>
              <select
                value={attendedViaSepa === undefined ? "" : attendedViaSepa ? "SI" : "NO"}
                onChange={(e) => {
                  const value = e.target.value
                  setAttendedViaSepa(value === "" ? undefined : value === "SI")
                }}
                className="w-full bg-background border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Sin dato</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">
                ¿Logró ser referido a mayor complejidad a partir del soporte de SEPA?
              </label>
              <select
                value={referredViaSepa === undefined ? "" : referredViaSepa ? "SI" : "NO"}
                onChange={(e) => {
                  const value = e.target.value
                  setReferredViaSepa(value === "" ? undefined : value === "SI")
                }}
                className="w-full bg-background border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Sin dato</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </div>
          </div>

          {/* Difficulties / Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Dificultades u Observaciones</label>
            <textarea
              rows={2}
              value={difficulties}
              onChange={(e) => setDifficulties(e.target.value)}
              placeholder="Ej. Requiere silla de ruedas, ambulancia o movilidad de traslado..."
              className="w-full bg-background border rounded-md p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Change Reason (required by the backend) */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Motivo del cambio *</label>
            <input
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Ej. Reprogramación solicitada por el paciente"
              className="w-full bg-background border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <DialogFooter className="pt-2">
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
              disabled={updateAppointmentMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {updateAppointmentMutation.isPending && (
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              )}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
