import { Link } from "react-router-dom"
import type { PatientListItem } from "@/api/patients"
import { Button } from "@/components/ui/button"
import { useEnrollmentDniLookup } from "./use-enrollment-dni-lookup"

export function EnrollmentDniLookup({
  documentType,
  dni,
  patientId,
  onReenroll,
}: {
  documentType: string | null | undefined
  dni: string | null | undefined
  patientId: string | null
  onReenroll: (patient: PatientListItem) => void
}) {
  const { state, match } = useEnrollmentDniLookup(documentType, dni)

  if (state === "loading") {
    return (
      <p className="text-muted-foreground text-xs">Buscando el documento...</p>
    )
  }
  if (!match || state === "none" || state === "idle") return null

  if (state === "blocked") {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        Ya está enrolado, registra un seguimiento.{" "}
        <Link className="font-medium underline" to={`/pacientes/${match.id}`}>
          Abrir la ficha de {match.fullName}
        </Link>
      </div>
    )
  }

  if (state === "prospect") {
    return (
      <div className="rounded-lg border p-3 text-sm">
        Este documento ya tiene una ficha de prospecto.{" "}
        <Link className="font-medium underline" to={`/pacientes/${match.id}`}>
          Abrir la ficha de {match.fullName}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
      <p>
        {match.fullName} está inactivo o con cáncer descartado. Puedes
        reenrolarlo con estos datos.
      </p>
      {patientId === match.id ? (
        <p className="text-xs font-medium">Se reenrolará esta ficha.</p>
      ) : (
        <Button type="button" size="sm" onClick={() => onReenroll(match)}>
          Reenrolar
        </Button>
      )}
    </div>
  )
}
