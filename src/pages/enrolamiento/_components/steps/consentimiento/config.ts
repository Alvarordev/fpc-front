import type { Group } from "@/components/ds/questions"

export const CONSENT_TEXT = [
  "Por este medio, usted deja constancia:",
  "Ha sido informado sobre el funcionamiento del Programa SEPA de la Fundación Peruana de Cáncer.",
  "Acepta y tiene conocimiento que este programa lo/a acompañará a lo largo de la duración de este.",
  "Acepta que la Fundación Peruana de Cáncer recolecte, almacene, transfiera, administre y utilice sus datos personales y de salud recogidos.",
  "Acepta que la Fundación Peruana de Cáncer utilice sus datos, resguardando su confidencialidad, para fines de investigación y generación de evidencia que contribuya a mejorar la atención y el abordaje del cáncer.",
  "Entiende que puede solicitar que sus datos sean actualizados, rectificados o solicitar que no sean utilizados en el futuro y/o eliminarlos de la base de datos del Programa SEPA.",
  "Tiene conocimiento de que el Programa SEPA es un programa de acceso libre, gratuito y voluntario patrocinado por la Fundación Peruana de Cáncer y que esta se reserva el derecho de suspenderlo y/o terminarlo y/o modificarlo.",
  "Acepta ser contactado y recibir los materiales correspondientes al Programa SEPA a través de su teléfono o el de un familiar y su correo, si lo tuviese.",
  "Tiene conocimiento de que puede solicitar a la Fundación Peruana de Cáncer en cualquier momento activar o desactivar cualquiera de dichos canales de comunicación con usted.",
].join("\n")

export const consentimientoGroups: Group[] = [
  {
    title: "Respuesta del paciente",
    questions: [
      {
        id: "informedConsent",
        label: "Consentimiento informado",
        type: "choice",
        required: true,
        wide: true,
        hint: "Si el paciente no acepta, la inscripción termina en este paso.",
        options: [
          { value: "yes", label: "Acepto — el paciente acepta" },
          { value: "no", label: "No acepto — el paciente no acepta" },
        ],
      },
    ],
  },
]
