import { useEffect } from "react"
import { Archive, ShieldCheck } from "lucide-react"
import { EnrollmentShell } from "@/pages/enrolamiento/_components/enrollment-shell"
import { useEnrollmentStore } from "@/pages/enrolamiento/_store/enrollment-store"
import { HistoricalPatientPicker } from "./_components/historical-patient-picker"
import { HistoricalRecordsPanel } from "./_components/historical-records-panel"

export default function HistoricalRecordsPage() {
  const {
    historicalPatientId,
    historicalFollowUpId,
    isComplete,
    setEnrollmentMode,
  } = useEnrollmentStore()

  useEffect(() => {
    setEnrollmentMode("HISTORICAL")
  }, [setEnrollmentMode])

  if (isComplete && historicalPatientId) {
    return (
      <div className="-m-4 min-h-[calc(100vh-3.5rem)] overflow-y-auto md:-m-6">
        <HistoricalRecordsPanel
          patientId={historicalPatientId}
          enrollmentFollowUpId={historicalFollowUpId}
        />
      </div>
    )
  }

  return (
    <div className="-m-4 flex min-h-[calc(100vh-3.5rem)] flex-col overflow-y-auto md:-m-6">
      <header className="mx-auto w-full max-w-5xl px-6 pt-6 md:px-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-primary mb-1 text-[10px] font-bold tracking-[0.18em] uppercase">
              Administración · Archivo
            </p>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Archive className="size-5 text-primary" />
              Carga histórica
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
              Registre información anterior a la operación actual sin activar automatizaciones ni tareas futuras.
            </p>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <ShieldCheck className="size-4 text-emerald-600" />
            Solo administradores
          </div>
        </div>
        <HistoricalPatientPicker />
      </header>
      <div className="min-h-[760px] flex-1">
        <EnrollmentShell historical />
      </div>
    </div>
  )
}
