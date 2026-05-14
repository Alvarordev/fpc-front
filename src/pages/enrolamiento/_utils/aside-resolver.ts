import type { AsideContent } from "../_components/enrollment-aside";

const STEP_CONTENT: Record<number, AsideContent> = {
  1: { script: "Buenos días / Buenas Tardes. Bienvenido/a al Programa SEPA de la Fundación Peruana de Cáncer...", reference: "SEPA Protocol — Apertura de Sesión v4.2" },
  2: { script: "Para poder continuar, es preciso mencionarle que esta llamada se encuentra conforme a sus derechos como usuario de los servicios de Salud Ley 26842 y Ley 29733...", complianceNote: "Sin el acuerdo explícito, la inscripción debe detenerse inmediatamente.", reference: "SEPA Protocol — Autorización de Datos v4.2" },
  3: { script: "¿Me podría indicar si usted es el paciente oncológico, o si está realizando esta afiliación en nombre de un familiar o amigo?", reference: "SEPA Protocol — Identificación del Llamante v4.2" },
  4: { script: "Le solicitamos que autorice oficialmente su inscripción al Programa SEPA...", complianceNote: "El consentimiento verbal es jurídicamente válido. No continúe si el paciente no acepta.", reference: "SEPA Protocol — Consentimiento Informado v4.2" },
  5: { script: "Para proceder con su registro, ¿podría indicarme el nombre completo del paciente y su número de DNI?", complianceNote: "Asegúrese de que el paciente comprende que sus datos serán tratados bajo las regulaciones de privacidad.", reference: "SEPA Protocol — Verificación de Identidad v4.2" },
  6: { script: "Con base en la información brindada, vamos a identificar la categoría que mejor describe su situación.", reference: "SEPA Protocol — Categorización Clínica v4.2" },
  7: { script: "Complete los datos clínicos según la categoría seleccionada y la situación de seguro del paciente.", reference: "SEPA Protocol — Atención Especializada v4.2" },
  8: { script: "Muchas gracias por su tiempo. Le informo que le enviaremos una breve encuesta de satisfacción por WhatsApp.", reference: "SEPA Protocol — Cierre de Sesión v4.2" },
};

export function resolveAsideContent(step: number): AsideContent {
  return STEP_CONTENT[step] ?? { script: "Complete los campos de este paso para continuar.", reference: "SEPA Protocol v4.2" };
}
