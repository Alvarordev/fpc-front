import { Button } from "@/components/ds/button"
import { Card } from "@/components/ds/card"
import { InlineAlert } from "@/components/ds/inline-alert"
import type { RejectionReason } from "../_store/enrollment-store"

interface Props {
  reason: RejectionReason
  onReset: () => void
  onBack: () => void
}

const CONTENT: Record<RejectionReason, { title: string; label: string; message: string }> = {
  q3_no: {
    label: "Acuerdo no otorgado",
    title: "Inscripción no autorizada",
    message:
      "El paciente no ha otorgado su acuerdo para el procesamiento de datos personales conforme a la Ley 29733. Sin esta autorización, no es posible continuar con el registro en el Programa SEPA.",
  },
  q8_no: {
    label: "Consentimiento rechazado",
    title: "Consentimiento informado no aceptado",
    message:
      "El paciente no ha aceptado el consentimiento informado. Al no contar con su autorización verbal, no podemos concretar la inscripción ni realizar los servicios correspondientes al Programa SEPA.",
  },
}

export function EnrollmentRejection({ reason, onReset, onBack }: Props) {
  const content = CONTENT[reason]
  return (
    <Card title={content.title} description={content.label}>
      <InlineAlert tone="warning">{content.message}</InlineAlert>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button variant="dark" onClick={onReset}>
          Empezar de nuevo
        </Button>
      </div>
    </Card>
  )
}
