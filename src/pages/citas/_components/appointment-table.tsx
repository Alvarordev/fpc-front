import { useState } from "react";
import {
  Search,
  Building2,
  Stethoscope,
  FileCheck,
  Bot,
  User,
  Phone,
  Copy,
  Check,
  Clock,
  Edit,
} from "lucide-react";
import type { MedicalAppointmentResponse } from "@/types";

interface AppointmentTableProps {
  appointments: MedicalAppointmentResponse[];
  onEditAppointment?: (appt: MedicalAppointmentResponse) => void;
}

const formatTimeRange = (timeStr?: string | null) => {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  const startTotalMinutes = h * 60 + m;
  const endTotalMinutes = startTotalMinutes + 30; // 30 mins duration constraint
  const endH = Math.floor(endTotalMinutes / 60) % 24;
  const endM = endTotalMinutes % 60;

  const fmtStart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const fmtEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  return `${fmtStart} - ${fmtEnd}`;
};

export function AppointmentTable({
  appointments,
  onEditAppointment,
}: AppointmentTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [referralFilter, setReferralFilter] = useState<"ALL" | "WITH" | "WITHOUT">("ALL");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "BOT" | "MANUAL">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAppointments = appointments.filter((appt) => {
    // Search
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matchName = appt.patientFullName?.toLowerCase().includes(term);
      const matchDni = appt.patientDni?.toLowerCase().includes(term);
      const matchHospital = appt.healthCenterName?.toLowerCase().includes(term);
      const matchSpecialty = appt.specialty?.toLowerCase().includes(term);
      if (!matchName && !matchDni && !matchHospital && !matchSpecialty) {
        return false;
      }
    }

    // Referral Sheet Filter
    if (referralFilter === "WITH" && !appt.hasReferralSheet) return false;
    if (referralFilter === "WITHOUT" && appt.hasReferralSheet) return false;

    // Channel Filter
    const isBot = appt.contact?.type === "WHATSAPP" || (appt.contact?.type as string) === "BOT";
    if (channelFilter === "BOT" && !isBot) return false;
    if (channelFilter === "MANUAL" && isBot) return false;

    return true;
  });

  const handleCopyDetails = (appt: MedicalAppointmentResponse) => {
    const timeText = formatTimeRange(appt.appointmentTime) || "Por confirmar";
    const text = `📋 *Recordatorio de Cita Médica - FPC*\n\n👤 *Paciente:* ${appt.patientFullName || "N/A"}\n🪪 *DNI:* ${appt.patientDni || "N/A"}\n🏥 *Hospital:* ${appt.healthCenterName || "N/A"}\n🩺 *Especialidad:* ${appt.specialty || "General"}\n📅 *Fecha:* ${appt.appointmentDate?.split("T")[0] || "Por confirmar"}\n⏰ *Horario (30 min):* ${timeText}\n📄 *Hoja Referencia:* ${appt.hasReferralSheet ? "Sí cuenta" : "Pendiente"}`;
    navigator.clipboard.writeText(text);
    setCopiedId(appt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-xl p-3.5 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por Paciente, DNI, Hospital o Especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Referral Filter */}
          <select
            value={referralFilter}
            onChange={(e) => setReferralFilter(e.target.value as any)}
            className="bg-background border rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Hoja Referencia: Todas</option>
            <option value="WITH">Con Hoja Referencia</option>
            <option value="WITHOUT">Sin Hoja Referencia</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="bg-background border rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Origen: Todos</option>
            <option value="BOT">🤖 Bot WhatsApp</option>
            <option value="MANUAL">📝 Registro Manual</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="p-3">Paciente</th>
                <th className="p-3">Hospital / Clínica</th>
                <th className="p-3">Especialidad</th>
                <th className="p-3">Fecha y Horario</th>
                <th className="p-3">Hoja Referencia</th>
                <th className="p-3">Origen</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron citas médicas registradas.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => {
                  const isBot = appt.contact?.type === "WHATSAPP" || (appt.contact?.type as string) === "BOT";
                  const timeRange = formatTimeRange(appt.appointmentTime);
                  const displayDate = appt.appointmentDate?.split("T")[0] || "Por confirmar";

                  return (
                    <tr key={appt.id} className="hover:bg-muted/20 transition-colors">
                      {/* Patient */}
                      <td className="p-3">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <User className="size-3.5 text-red-600 shrink-0" />
                          {appt.patientFullName || "Paciente N/A"}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          {appt.patientDni && <span>DNI: {appt.patientDni}</span>}
                          {appt.patientPhone && (
                            <span className="flex items-center gap-0.5 text-emerald-700 font-medium">
                              <Phone className="size-2.5" />
                              {appt.patientPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hospital */}
                      <td className="p-3">
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                          {appt.healthCenterName || "No asignado"}
                        </div>
                      </td>

                      {/* Specialty */}
                      <td className="p-3">
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <Stethoscope className="size-3.5 text-muted-foreground shrink-0" />
                          {appt.specialty || "General"}
                        </div>
                        {appt.isFirstConsultation && (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-full mt-0.5 inline-block">
                            Primera Consulta
                          </span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="p-3">
                        <div className="font-bold text-red-600">
                          {displayDate}
                        </div>
                        {timeRange ? (
                          <div className="text-[11px] font-semibold text-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="size-3 text-red-600" />
                            {timeRange}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground">Hora sin asignar</div>
                        )}
                      </td>

                      {/* Referral Sheet */}
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            appt.hasReferralSheet
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <FileCheck className="size-3" />
                          {appt.hasReferralSheet ? "Sí cuenta" : "Pendiente"}
                        </span>
                      </td>

                      {/* Origin */}
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isBot
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-blue-50 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {isBot && <Bot className="size-3" />}
                          {isBot ? "Bot WhatsApp" : "Manual"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onEditAppointment && (
                            <button
                              type="button"
                              onClick={() => onEditAppointment(appt)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white px-2.5 py-1 border border-red-200 rounded-md transition-colors cursor-pointer shadow-2xs"
                              title="Editar cita médica"
                            >
                              <Edit className="size-3.5" />
                              <span>Editar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopyDetails(appt)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 border rounded-md hover:bg-background transition-colors cursor-pointer"
                            title="Copiar detalles para WhatsApp"
                          >
                            {copiedId === appt.id ? (
                              <>
                                <Check className="size-3 text-emerald-600" />
                                <span className="text-emerald-600">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
