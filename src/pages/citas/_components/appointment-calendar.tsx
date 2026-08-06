import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Building2,
  User,
  FileCheck,
  AlertCircle,
  Stethoscope,
  Clock,
  Edit,
  Bell,
  BellRing,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MedicalAppointment } from "@/api/medical-appointments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppointmentCalendarProps {
  appointments: MedicalAppointment[];
  onEditAppointment?: (appt: MedicalAppointment) => void;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const formatTimeRange = (timeStr?: string | null) => {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  const startTotalMinutes = h * 60 + m;
  const endTotalMinutes = startTotalMinutes + 30; // 30 mins constraint
  const endH = Math.floor(endTotalMinutes / 60) % 24;
  const endM = endTotalMinutes % 60;

  const fmtStart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const fmtEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  return `${fmtStart} - ${fmtEnd}`;
};

// ─── Reminder Modal ─────────────────────────────────────────────────────────
const REMINDER_WEBHOOK = "https://jaffjos-n8n.3ezxho.easypanel.host/webhook/recordatorio";

interface ReminderModalProps {
  appt: MedicalAppointment;
  onClose: () => void;
  onEdit?: (appt: MedicalAppointment) => void;
  formatTimeRange: (t?: string | null) => string | null;
}

function ReminderModal({ appt, onClose, onEdit, formatTimeRange }: ReminderModalProps) {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  const handleSendReminder = async () => {
    setSending(true);
    setStatus("idle");

    const payload = {
      evento: "recordatorio_cita",
      paciente: {
        nombre: appt.patientFullName ?? "",
        dni: appt.patientDni ?? "",
      },
      cita: {
        id: appt.id,
        fecha: appt.appointmentDate ?? "",
        hora_inicio: appt.appointmentTime ?? "",
        hora_rango: formatTimeRange(appt.appointmentTime) ?? "",
        especialidad: appt.specialty ?? "General",
        hospital: appt.healthCenterName ?? "",
        motivo: appt.difficulties ?? "",
        hoja_referencia: appt.hasReferralSheet ?? false,
      },
      enviado_en: new Date().toISOString(),
    };

    try {
      const res = await fetch(REMINDER_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600 font-semibold">
              <CalendarIcon className="size-5" />
              <DialogTitle className="text-base">Detalles de la Cita Médica</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          {/* Patient Header Card */}
          <div className="p-3 bg-muted/40 rounded-lg space-y-1 border flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <User className="size-4 text-red-600" />
                {appt.patientFullName || "Paciente N/A"}
              </div>
              {appt.patientDni && (
                <div className="text-muted-foreground pt-0.5">DNI: {appt.patientDni}</div>
              )}
            </div>

            {/* Reminder button (top) */}
            <div className="flex flex-col items-end gap-1.5">
              <Button
                size="sm"
                disabled={sending || status === "sent"}
                onClick={handleSendReminder}
                className={`flex items-center gap-1.5 font-semibold cursor-pointer shadow-2xs transition-all ${
                  status === "sent"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : status === "error"
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {sending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : status === "sent" ? (
                  <BellRing className="size-3.5" />
                ) : (
                  <Bell className="size-3.5" />
                )}
                {sending ? "Enviando…" : status === "sent" ? "¡Enviado!" : "Enviar Recordatorio"}
              </Button>
              {status === "error" && (
                <span className="text-[10px] text-orange-600 font-medium">Error al enviar</span>
              )}
            </div>
          </div>

          {/* Hospital & Specialty */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 border rounded-lg bg-background">
              <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3" /> Hospital / Clínica
              </span>
              <div className="font-medium text-foreground mt-0.5 truncate">
                {appt.healthCenterName || "No asignado"}
              </div>
            </div>
            <div className="p-2.5 border rounded-lg bg-background">
              <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                <Stethoscope className="size-3" /> Especialidad
              </span>
              <div className="font-medium text-foreground mt-0.5 truncate">
                {appt.specialty || "General"}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 border rounded-lg bg-background">
              <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="size-3 text-red-600" /> Fecha de Cita
              </span>
              <div className="font-bold text-red-600 mt-0.5">
                {appt.appointmentDate || "Sin fecha"}
              </div>
            </div>
            <div className="p-2.5 border rounded-lg bg-background">
              <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                <Clock className="size-3 text-red-600" /> Horario (30 min)
              </span>
              <div className="font-bold text-foreground mt-0.5">
                {formatTimeRange(appt.appointmentTime) || "Hora sin asignar"}
              </div>
            </div>
          </div>

          {/* Next Appointment */}
          <div className="p-2.5 border rounded-lg bg-background flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Próxima Cita de Control</span>
            <span className="font-medium text-foreground">
              {appt.nextAppointmentDate || "No programada"}
            </span>
          </div>

          {/* Referral */}
          <div className="flex items-center justify-between p-2.5 border rounded-lg bg-background">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <FileCheck className="size-4 text-blue-600" /> Hoja de Referencia
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              appt.hasReferralSheet ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}>
              {appt.hasReferralSheet ? "Sí cuenta" : "Pendiente"}
            </span>
          </div>

          {/* Difficulties */}
          {appt.difficulties && (
            <div className="p-2.5 border border-amber-200 rounded-lg bg-amber-50 text-amber-950 space-y-1">
              <span className="text-[10px] font-bold uppercase flex items-center gap-1 text-amber-800">
                <AlertCircle className="size-3" /> Dificultades u Observaciones
              </span>
              <p className="text-xs italic">{appt.difficulties}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t flex items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            {onEdit && (
              <Button
                type="button"
                size="sm"
                onClick={() => { onClose(); onEdit(appt); }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Edit className="size-4" />
                Editar Cita Médica
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export function AppointmentCalendar({
  appointments,
  onEditAppointment,
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppt, setSelectedAppt] = useState<MedicalAppointment | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayMonth = () => setCurrentDate(new Date());

  // First day of month & total days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Group appointments by YYYY-MM-DD cleanly (handling ISO strings)
  const appointmentsByDate = appointments.reduce<Record<string, MedicalAppointment[]>>(
    (acc, appt) => {
      const rawDate = appt.appointmentDate || appt.createdAt;
      if (!rawDate) return acc;
      const dateStr = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate.substring(0, 10);
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(appt);
      return acc;
    },
    {}
  );

  // Generate calendar grid slots
  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    daysArray.push(day);
  }

  const formatLocalDateStr = (dayNum: number) => {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(dayNum).padStart(2, "0");
    return `${year}-${mStr}-${dStr}`;
  };

  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === dayNum
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-5 text-red-600" />
          <h2 className="text-base font-bold text-foreground">
            {MONTH_NAMES[month]} {year}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs" onClick={todayMonth} className="text-xs font-semibold">
            Hoy
          </Button>
          <div className="flex items-center border rounded-lg overflow-hidden bg-background">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-none border-r cursor-pointer"
              onClick={prevMonth}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-none cursor-pointer"
              onClick={nextMonth}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        {/* Day Header */}
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-semibold text-muted-foreground py-2.5">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={i === 0 || i === 6 ? "text-red-500/80" : ""}>
              {d}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y border-b text-xs">
          {daysArray.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} className="bg-muted/10 min-h-[120px]" />;
            }

            const dateStr = formatLocalDateStr(dayNum);
            const dayAppts = appointmentsByDate[dateStr] || [];
            const isCurrentDay = isToday(dayNum);

            return (
              <div
                key={`day-${dayNum}`}
                className={`min-h-[120px] p-1.5 flex flex-col transition-colors ${
                  isCurrentDay ? "bg-red-50/40 font-semibold" : "hover:bg-muted/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center size-6 rounded-full text-xs ${
                      isCurrentDay
                        ? "bg-red-600 text-white font-bold"
                        : "text-foreground"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayAppts.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                      {dayAppts.length} {dayAppts.length === 1 ? "cita" : "citas"}
                    </span>
                  )}
                </div>

                {/* Appointment Badges Container */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[95px] pr-0.5">
                  {dayAppts.map((appt) => {
                    const timeRange = formatTimeRange(appt.appointmentTime);

                    return (
                      <div
                        key={appt.id}
                        onClick={() => setSelectedAppt(appt)}
                        className="w-full text-left p-1.5 rounded-md text-[11px] border transition-all shadow-2xs flex flex-col gap-0.5 cursor-pointer group relative bg-blue-50 text-blue-950 border-blue-200 hover:bg-blue-100"
                      >
                        <div className="font-semibold truncate flex items-center justify-between gap-1">
                          <span className="truncate">
                            {appt.patientFullName || "Paciente N/A"}
                          </span>

                          {/* Quick Edit Icon on badge */}
                          {onEditAppointment && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditAppointment(appt);
                              }}
                              title="Editar cita médica"
                              className="opacity-80 group-hover:opacity-100 hover:text-red-700 text-muted-foreground p-0.5 rounded hover:bg-white/80 shrink-0"
                            >
                              <Edit className="size-3 text-red-600" />
                            </button>
                          )}
                        </div>

                        {timeRange && (
                          <div className="text-[10px] font-bold text-red-700 flex items-center gap-0.5">
                            <Clock className="size-2.5 shrink-0" />
                            {timeRange}
                          </div>
                        )}

                        {appt.specialty && (
                          <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                            <Stethoscope className="size-2.5 shrink-0" />
                            {appt.specialty}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <ReminderModal
          appt={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onEdit={onEditAppointment}
          formatTimeRange={formatTimeRange}
        />
      )}

    </div>
  );
}
