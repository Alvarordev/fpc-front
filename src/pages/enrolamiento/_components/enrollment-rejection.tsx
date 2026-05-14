import { XCircle, RotateCcw, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RejectionReason } from "../_store/enrollment-store";

interface Props { reason: RejectionReason; onReset: () => void; onBack: () => void }

const CONTENT: Record<RejectionReason, { title: string; label: string; message: string }> = {
  q3_no: {
    label: "Acuerdo no otorgado", title: "Inscripción no autorizada",
    message: "El paciente no ha otorgado su acuerdo para el procesamiento de datos personales conforme a la Ley 29733. Sin esta autorización, no es posible continuar con el registro en el Programa SEPA.",
  },
  q8_no: {
    label: "Consentimiento rechazado", title: "Consentimiento informado no aceptado",
    message: "El paciente no ha aceptado el consentimiento informado. Al no contar con su autorización verbal, no podemos concretar la inscripción ni realizar los servicios correspondientes al Programa SEPA.",
  },
  q27_privado: {
    label: "Seguro privado detectado", title: "Paciente no elegible para el programa",
    message: "El Programa SEPA está dirigido exclusivamente a población vulnerable sin seguro privado de salud. Las personas afiliadas a un seguro privado no pueden inscribirse.\n\nSe le enviará a su WhatsApp el contacto de su aseguradora y el enlace del canal de prevención de la Fundación Peruana de Cáncer.",
  },
};

export function EnrollmentRejection({ reason, onReset, onBack }: Props) {
  const c = CONTENT[reason];
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
        <XCircle className="size-8 text-destructive" />
      </div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-destructive/70">{c.label}</p>
      <h2 className="mb-3 text-2xl font-bold text-foreground">{c.title}</h2>
      <p className="mb-8 max-w-md whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{c.message}</p>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5"><ChevronLeft className="size-4" />Volver</Button>
        <Button size="sm" onClick={onReset} className="gap-1.5"><RotateCcw className="size-3.5" />Nueva inscripción</Button>
      </div>
    </div>
  );
}
