import { Link } from "react-router-dom"
import type { PatientListItem } from "@/api/patients"
import { Button } from "@/components/ds/button"
import { Item } from "@/components/ds/card"
import { InlineAlert } from "@/components/ds/inline-alert"
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

  if (state === "loading") return <p className="text-[13px] text-zinc-500">Buscando el documento...</p>
  if (!match || state === "none" || state === "idle") return null

  if (state === "blocked") {
    return (
      <InlineAlert tone="warning">
        Ya está enrolado, registra un seguimiento.{" "}
        <Link className="font-medium underline" to={`/pacientes/${match.id}`}>
          Abrir la ficha de {match.fullName}
        </Link>
      </InlineAlert>
    )
  }

  if (state === "prospect") {
    return (
      <InlineAlert>
        Este documento ya tiene una ficha de prospecto.{" "}
        <Link className="font-medium underline" to={`/pacientes/${match.id}`}>
          Abrir la ficha de {match.fullName}
        </Link>
      </InlineAlert>
    )
  }

  return (
    <Item
      title={match.fullName}
      body="Está inactivo o con cáncer descartado. Puedes reenrolarlo con estos datos."
      actions={
        patientId === match.id ? (
          <span className="text-[13px] font-medium text-zinc-700">Se reenrolará esta ficha.</span>
        ) : (
          <Button onClick={() => onReenroll(match)}>Reenrolar</Button>
        )
      }
    />
  )
}
