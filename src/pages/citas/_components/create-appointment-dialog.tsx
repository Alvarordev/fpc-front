import { useState } from "react"
import {
  Calendar as CalendarIcon,
  User,
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
import {
  MedicalAppointmentFields,
  resolveSpecialty,
  type MedicalAppointmentFieldsValue,
} from "@/components/medical-appointment-fields"
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

const EMPTY_APPOINTMENT: MedicalAppointmentFieldsValue = {
  specialty: "",
  customSpecialty: "",
  healthCenterId: "",
  isFirstConsultation: false,
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
}: CreateAppointmentDialogProps) {
  const [patientId, setPatientId] = useState("")
  const [appointmentFields, setAppointmentFields] =
    useState<MedicalAppointmentFieldsValue>(EMPTY_APPOINTMENT)
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [nextAppointmentDate, setNextAppointmentDate] = useState("")
  const [hasReferralSheet, setHasReferralSheet] = useState(false)
  const [referredTo, setReferredTo] = useState("")
  const [difficulties, setDifficulties] = useState("")
  const [attendedViaSepa, setAttendedViaSepa] = useState<boolean | undefined>()
  const [referredViaSepa, setReferredViaSepa] = useState<boolean | undefined>()
  const [errorMsg, setErrorMsg] = useState("")

  const { data: patientPage } = usePatients({
    filters: { segment: "CARE" },
  })
  const patients = patientPage?.data ?? []
  const createAppointment = useCreateMedicalAppointment()

  const patientOptions: SearchableOption[] = patients.map((p) => ({
    value: p.id,
    label: p.fullName,
    sublabel: `${p.dni ? `DNI: ${p.dni}` : "Sin DNI"} | Tel: ${p.primaryPhone ?? "Sin teléfono registrado"}`,
  }))

  function resetForm() {
    setPatientId("")
    setAppointmentFields(EMPTY_APPOINTMENT)
    setAppointmentDate("")
    setAppointmentTime("")
    setNextAppointmentDate("")
    setHasReferralSheet(false)
    setReferredTo("")
    setDifficulties("")
    setAttendedViaSepa(undefined)
    setReferredViaSepa(undefined)
    setErrorMsg("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) {
      setErrorMsg("Selecciona un paciente.")
      return
    }

    const finalSpecialty = resolveSpecialty(appointmentFields)
    if (!finalSpecialty) {
      setErrorMsg("Selecciona o especifica una especialidad médica.")
      return
    }

    try {
      setErrorMsg("")
      await createAppointment.mutateAsync({
        patientId,
        healthCenterId: appointmentFields.healthCenterId || undefined,
        specialty: finalSpecialty,
        appointmentDate: appointmentDate || undefined,
        appointmentTime: appointmentTime || undefined,
        nextAppointmentDate: nextAppointmentDate || undefined,
        hasReferralSheet,
        referredTo: referredTo.trim() || undefined,
        difficulties: difficulties.trim() || undefined,
        isFirstConsultation: appointmentFields.isFirstConsultation,
        attendedViaSepa,
        referredViaSepa,
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

          <MedicalAppointmentFields
            value={appointmentFields}
            onChange={setAppointmentFields}
          />

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

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-foreground text-xs font-semibold">
                ¿Asistió a la consulta de atención primaria a partir del soporte
                de SEPA?
              </label>
              <select
                value={
                  attendedViaSepa === undefined
                    ? ""
                    : attendedViaSepa
                      ? "SI"
                      : "NO"
                }
                onChange={(e) => {
                  const value = e.target.value
                  setAttendedViaSepa(value === "" ? undefined : value === "SI")
                }}
                className="bg-background focus:ring-ring w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
              >
                <option value="">Sin dato</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-foreground text-xs font-semibold">
                ¿Logró ser referido a mayor complejidad a partir del soporte de
                SEPA?
              </label>
              <select
                value={
                  referredViaSepa === undefined
                    ? ""
                    : referredViaSepa
                      ? "SI"
                      : "NO"
                }
                onChange={(e) => {
                  const value = e.target.value
                  setReferredViaSepa(value === "" ? undefined : value === "SI")
                }}
                className="bg-background focus:ring-ring w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
              >
                <option value="">Sin dato</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </div>
          </div>

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
