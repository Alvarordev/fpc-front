import { AlertTriangle } from "lucide-react"

export function DisponibilidadConsentNotice() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div className="space-y-2">
          <p className="font-semibold tracking-wide uppercase">Importante</p>
          <ul className="list-disc space-y-1.5 pl-4 leading-relaxed">
            <li>
              Al registrar tu disponibilidad confirmas que cuentas con el
              consentimiento del paciente para coordinar la sesión.
            </li>
            <li>
              Verifica tu agenda antes de publicar horarios; no todas las horas
              registradas se asignan automáticamente.
            </li>
            <li>
              El Programa SEPA contempla 4 sesiones de soporte emocional, con
              posibilidad de sesiones adicionales según indicación clínica.
            </li>
            <li>
              Cada sesión dura 45 minutos, más 15 minutos adicionales para el
              registro de la atención.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
