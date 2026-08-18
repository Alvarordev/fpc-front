import { useState } from "react"
import {
  Calendar as CalendarIcon,
  User,
  Building2,
  Stethoscope,
  FileText,
  Loader2,
  Plus,
  Clock,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  SearchableSelect,
  type SearchableOption,
} from "@/components/ui/searchable-select"
import { useHealthCenters } from "@/pages/hospitales/_hooks/use-health-centers"
import { usePatients } from "@/pages/pacientes/_hooks/use-patients"
import { useCreateMedicalAppointment } from "../_hooks/use-medical-appointments"

interface CreateAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

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
]

export function CreateAppointmentDialog({
  open,
  onOpenChange,
}: CreateAppointmentDialogProps) {
  const [patientId, setPatientId] = useState("")
  const [healthCenterId, setHealthCenterId] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [customSpecialty, setCustomSpecialty] = useState("")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [nextAppointmentDate, setNextAppointmentDate] = useState("")
  const [hasReferralSheet, setHasReferralSheet] = useState(false)
  const [referredTo, setReferredTo] = useState("")
  const [difficulties, setDifficulties] = useState("")
  const [isFirstConsultation, setIsFirstConsultation] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const { data: patientPage } = usePatients({
    filters: { segment: "CARE" },
  })
  const patients = patientPage?.data ?? []
  const { data: healthCenters = [] } = useHealthCenters()
  const createAppointment = useCreateMedicalAppointment()

  const patientOptions: SearchableOption[] = patients.map((p) => ({
    value: p.id,
    label: p.fullName,
    sublabel: `${p.dni ? `DNI: ${p.dni}` : "Sin DNI"} | Tel: ${p.primaryPhone}`,
  }))

  const healthCenterOptions: SearchableOption[] = healthCenters.map((hc) => ({
    value: hc.id,
    label: hc.name,
    sublabel: hc.department,
  }))

  function resetForm() {
    setPatientId("")
    setHealthCenterId("")
    setSpecialty("")
    setCustomSpecialty("")
    setAppointmentDate("")
    setAppointmentTime("")
    setNextAppointmentDate("")
    setHasReferralSheet(false)
    setReferredTo("")
    setDifficulties("")
    setIsFirstConsultation(false)
    setErrorMsg("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) {
      setErrorMsg("Selecciona un paciente.")
      return
    }

    const finalSpecialty =
      specialty === "OTRO" ? customSpecialty.trim() : specialty
    if (!finalSpecialty) {
      setErrorMsg("Selecciona o especifica una especialidad médica.")
      return
    }

    try {
      setErrorMsg("")
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
      })

      resetForm()
      onOpenChange(false)
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Error al agendar la cita médica.",
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-base font-semibold text-red-600">
            <CalendarIcon className="size-5" />
            <DialogTitle className="text-lg">Agendar Cita Médica</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Registra una cita programada de 30 minutos para un paciente en su
            hospital asignado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Patient Searchable Combobox */}
          <div className="space-y-1.5">
            <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
              <User className="text-muted-foreground size-3.5" />
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
            <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
              <Building2 className="text-muted-foreground size-3.5" />
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
            <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
              <Stethoscope className="text-muted-foreground size-3.5" />
              Especialidad Médica *
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="bg-background focus:ring-ring w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
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
                className="bg-background focus:ring-ring mt-1.5 w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
              />
            )}
          </div>

          {/* Date & Time Slot (30-min) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
                <CalendarIcon className="size-3.5 text-red-600" />
                Fecha de Cita
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="bg-background focus:ring-ring w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
                <Clock className="size-3.5 text-red-600" />
                Hora (30 min)
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="bg-background focus:ring-ring w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
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
            <label className="text-foreground text-xs font-semibold">
              Próxima Cita de Control (Opcional)
            </label>
            <input
              type="date"
              value={nextAppointmentDate}
              onChange={(e) => setNextAppointmentDate(e.target.value)}
              className="bg-background focus:ring-ring w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
            />
          </div>

          {/* Referral Sheet Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="hasReferral"
              checked={hasReferralSheet}
              onChange={(e) => setHasReferralSheet(e.target.checked)}
              className="size-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label
              htmlFor="hasReferral"
              className="text-foreground cursor-pointer text-xs font-medium"
            >
              Cuenta con Hoja de Referencia médica
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="firstConsult"
              checked={isFirstConsultation}
              onChange={(e) => setIsFirstConsultation(e.target.checked)}
              className="size-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label
              htmlFor="firstConsult"
              className="text-foreground cursor-pointer text-xs font-medium"
            >
              Es Primera Consulta Oncológica
            </label>
          </div>

          {/* Referred To */}
          {hasReferralSheet && (
            <div className="space-y-1.5">
              <label className="text-foreground flex items-center gap-1 text-xs font-semibold">
                <FileText className="text-muted-foreground size-3.5" />
                Referido A (Hospital o Servicio)
              </label>
              <input
                type="text"
                placeholder="Ej. INEN - Departamento de Radioterapia"
                value={referredTo}
                onChange={(e) => setReferredTo(e.target.value)}
                className="bg-background focus:ring-ring w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
              />
            </div>
          )}

          {/* Difficulties / Notes */}
          <div className="space-y-1.5">
            <label className="text-foreground text-xs font-semibold">
              Dificultades u Observaciones
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Paciente requiere transporte de apoyo, espera de repuesto para equipo..."
              value={difficulties}
              onChange={(e) => setDifficulties(e.target.value)}
              className="bg-background focus:ring-ring w-full resize-none rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
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
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={createAppointment.isPending}
            >
              {createAppointment.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 size-3.5" />
                  Agendar Cita
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
