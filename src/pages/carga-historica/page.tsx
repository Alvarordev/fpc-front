import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Archive, Plus, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEnrollmentStore } from "@/pages/enrolamiento/_store/enrollment-store"
import { HistoricalPatientPicker } from "./_components/historical-patient-picker"

export default function HistoricalRecordsPage() {
  const setEnrollmentMode = useEnrollmentStore((state) => state.setEnrollmentMode)
  const navigate = useNavigate()

  useEffect(() => {
    setEnrollmentMode("HISTORICAL")
  }, [setEnrollmentMode])

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
              Busque un paciente para reconstruir su historia o cree un perfil
              histórico desde el enrolamiento.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <ShieldCheck className="size-4 text-emerald-600" />
              Solo administradores
            </div>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate("/carga-historica/nuevo")}
            >
              <Plus className="size-4" />
              Nuevo paciente histórico
            </Button>
          </div>
        </div>
        <HistoricalPatientPicker />
      </header>
    </div>
  )
}
