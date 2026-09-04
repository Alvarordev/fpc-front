import { startTransition, useEffect, useState } from "react"
import {
  ArrowLeft,
  Archive,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { EnrollmentShell } from "@/pages/enrolamiento/_components/enrollment-shell"
import { useEnrollmentStore } from "@/pages/enrolamiento/_store/enrollment-store"

export default function HistoricalEnrollmentPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const setEnrollmentMode = useEnrollmentStore(
    (state) => state.setEnrollmentMode,
  )

  useEffect(() => {
    setEnrollmentMode("HISTORICAL")
    startTransition(() => setReady(true))
  }, [setEnrollmentMode])

  const resetEnrollment = useEnrollmentStore((state) => state.resetEnrollment)

  function handleReset() {
    if (
      window.confirm(
        "¿Reiniciar el formulario histórico? Se perderá el borrador guardado.",
      )
    ) {
      resetEnrollment()
    }
  }

  return (
    <div className="-m-4 flex min-h-[calc(100vh-3.5rem)] flex-col overflow-y-auto md:-m-6">
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-start justify-between gap-4 px-6 pt-6 md:px-8">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2 gap-1.5 text-xs"
            onClick={() => navigate("/carga-historica")}
          >
            <ArrowLeft className="size-3.5" />
            Volver a búsqueda
          </Button>
          <p className="text-primary mb-1 text-[10px] font-bold tracking-[0.18em] uppercase">
            Administración · Archivo
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Archive className="text-primary size-5" />
            Nuevo paciente histórico
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Complete la información disponible en un solo formulario. Los campos
            clínicos aparecen según la situación del paciente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-9">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <ShieldCheck className="size-4 text-emerald-600" />
            Solo administradores
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="size-3.5" />
            Reiniciar formulario
          </Button>
        </div>
      </header>
      <div className="min-h-[760px] flex-1">
        {ready ? (
          <EnrollmentShell historical continuous />
        ) : (
          <div className="text-muted-foreground flex min-h-96 items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Preparando formulario...
          </div>
        )}
      </div>
    </div>
  )
}
