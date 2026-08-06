import { useState } from "react";
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  FileCheck,
  FileX,
  Loader2,
  CalendarCheck,
  X,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMedicalAppointments } from "./_hooks/use-medical-appointments";
import { CreateAppointmentDialog } from "./_components/create-appointment-dialog";
import { EditAppointmentDialog } from "./_components/edit-appointment-dialog";
import { AppointmentCalendar } from "./_components/appointment-calendar";
import { AppointmentTable } from "./_components/appointment-table";
import type { MedicalAppointment } from "@/api/medical-appointments";

type ViewMode = "calendar" | "table";
type KpiFilter = "ALL" | "REFERRAL_YES" | "REFERRAL_NO";

export default function CitasPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<MedicalAppointment | null>(null);
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilter>("ALL");

  const { data: appointments = [], isLoading, error } = useMedicalAppointments();

  // Metrics calculation
  const totalCount = appointments.length;
  const withReferralCount = appointments.filter((a) => a.hasReferralSheet === true).length;
  const withoutReferralCount = appointments.filter((a) => !a.hasReferralSheet).length;

  // Filtered appointments based on active KPI card
  const filteredAppointments = appointments.filter((appt) => {
    if (activeKpiFilter === "REFERRAL_YES") {
      return appt.hasReferralSheet === true;
    }
    if (activeKpiFilter === "REFERRAL_NO") {
      return !appt.hasReferralSheet;
    }
    return true; // ALL
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarCheck className="size-6 text-red-600" />
            Gestión de Citas Médicas
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Visualización y registro de citas de 30 minutos agendadas para los pacientes del programa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center border rounded-lg p-1 bg-muted/40 text-xs">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarIcon className="size-3.5" />
              Calendario
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-3.5" />
              Tabla
            </button>
          </div>

          {/* Primary Action Button */}
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-2xs cursor-pointer"
          >
            <Plus className="size-4 mr-1.5" />
            Agendar Cita
          </Button>
        </div>
      </div>

      {/* KPI Filter Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total */}
        <button
          type="button"
          onClick={() => setActiveKpiFilter("ALL")}
          className={`text-left border rounded-xl p-4 shadow-2xs space-y-1 transition-all cursor-pointer relative overflow-hidden group hover:scale-[1.01] ${
            activeKpiFilter === "ALL"
              ? "bg-red-50/50 border-red-600 ring-2 ring-red-600/40"
              : "bg-card hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarCheck className="size-4 text-red-600" /> Total Citas
            </span>
            <span className="text-[10px] text-muted-foreground group-hover:text-red-600 transition-colors">
              (Clic para filtrar)
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalCount}</div>
          {activeKpiFilter === "ALL" && (
            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full inline-block mt-1">
              ✓ Mostrando Todas
            </span>
          )}
        </button>

        {/* Card 2: Con Hoja */}
        <button
          type="button"
          onClick={() => setActiveKpiFilter("REFERRAL_YES")}
          className={`text-left border rounded-xl p-4 shadow-2xs space-y-1 transition-all cursor-pointer relative overflow-hidden group hover:scale-[1.01] ${
            activeKpiFilter === "REFERRAL_YES"
              ? "bg-blue-50/50 border-blue-600 ring-2 ring-blue-600/40"
              : "bg-card hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <FileCheck className="size-4 text-blue-600" /> Con Hoja Referencia
            </span>
            <span className="text-[10px] text-muted-foreground group-hover:text-blue-600 transition-colors">
              (Clic para filtrar)
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{withReferralCount}</div>
          {activeKpiFilter === "REFERRAL_YES" && (
            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full inline-block mt-1">
              ✓ Filtro Activo: Con Hoja
            </span>
          )}
        </button>

        {/* Card 3: Sin Hoja */}
        <button
          type="button"
          onClick={() => setActiveKpiFilter("REFERRAL_NO")}
          className={`text-left border rounded-xl p-4 shadow-2xs space-y-1 transition-all cursor-pointer relative overflow-hidden group hover:scale-[1.01] ${
            activeKpiFilter === "REFERRAL_NO"
              ? "bg-amber-50/50 border-amber-600 ring-2 ring-amber-600/40"
              : "bg-card hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <FileX className="size-4 text-amber-600" /> Sin Hoja Referencia
            </span>
            <span className="text-[10px] text-muted-foreground group-hover:text-amber-600 transition-colors">
              (Clic para filtrar)
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{withoutReferralCount}</div>
          {activeKpiFilter === "REFERRAL_NO" && (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-1">
              ✓ Filtro Activo: Sin Hoja
            </span>
          )}
        </button>
      </div>

      {/* Active Filter Notification Bar */}
      {activeKpiFilter !== "ALL" && (
        <div className="flex items-center justify-between p-3 px-4 bg-red-50 border border-red-200 rounded-xl text-xs shadow-2xs">
          <span className="font-bold text-red-900 flex items-center gap-2">
            <Filter className="size-4 text-red-600" />
            Filtrando vista por:{" "}
            <span className="underline decoration-2">
              {activeKpiFilter === "REFERRAL_YES" && "Con Hoja de Referencia"}
              {activeKpiFilter === "REFERRAL_NO" && "Sin Hoja de Referencia"}
            </span>{" "}
            ({filteredAppointments.length} citas encontradas)
          </span>
          <button
            type="button"
            onClick={() => setActiveKpiFilter("ALL")}
            className="text-red-700 hover:text-red-900 font-bold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 border border-red-200 rounded-md shadow-2xs"
          >
            <X className="size-3.5" />
            Limpiar filtro KPI
          </button>
        </div>
      )}

      {/* Content View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="size-7 animate-spin text-red-600" />
          <span className="text-xs font-semibold">Cargando citas médicas...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs">
          Error al cargar las citas médicas. Revisa la conexión al servidor.
        </div>
      ) : viewMode === "calendar" ? (
        <AppointmentCalendar
          appointments={filteredAppointments}
          onEditAppointment={(appt) => setEditingAppt(appt)}
        />
      ) : (
        <AppointmentTable
          appointments={filteredAppointments}
          onEditAppointment={(appt) => setEditingAppt(appt)}
        />
      )}

      {/* Create Dialog Modal */}
      <CreateAppointmentDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {/* Edit Dialog Modal */}
      {editingAppt && (
        <EditAppointmentDialog
          key={editingAppt.id}
          appointment={editingAppt}
          open={!!editingAppt}
          onOpenChange={(open) => {
            if (!open) setEditingAppt(null);
          }}
        />
      )}
    </div>
  );
}
