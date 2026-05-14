import type { Q27Branch } from "../_store/enrollment-store";
import type { AsideContent } from "../_components/enrollment-aside";

const STEP_CONTENT: Record<number, AsideContent> = {
  1: {
    script: "Buenos días / Buenas Tardes. Bienvenido/a al Programa SEPA de la Fundación Peruana de Cáncer. Le saluda [Nombre], ejecutiva del programa SEPA. ¿Me brinda su nombre por favor?\n\nEstimado(a) _____ Le comentamos que el programa SEPA es un programa que brinda Servicios gratuitos de Educación en Prevención del Cáncer y Acompañamiento al Paciente con cáncer. ¿Cuál es el motivo de su llamada?",
    reference: "SEPA Protocol — Apertura de Sesión v4.2",
  },
  2: {
    script: "Sra./Sr. .......... Para poder continuar, es preciso mencionarle que esta llamada se encuentra conforme a sus derechos como usuario de los servicios de Salud Ley 26842 y Ley 29733 sobre la protección de Datos Personales. Le comentamos que esta llamada podría ser grabada por temas de calidad. ¿Realizaremos un registro para continuar con la inscripción dentro del programa Sepa. ¿Esta usted de acuerdo?",
    complianceNote: "Sin el acuerdo explícito del paciente, la inscripción debe detenerse inmediatamente. No proceder bajo ninguna circunstancia.",
    reference: "SEPA Protocol — Autorización de Datos v4.2",
  },
  3: {
    script: "¿Me podría indicar si usted es el paciente oncológico, o si está realizando esta afiliación en nombre de un familiar o amigo?",
    reference: "SEPA Protocol — Identificación del Llamante v4.2",
  },
  4: {
    script: `Por otro lado, Le solicitamos que autorice oficialmente su inscripción al Programa SEPA y el uso de sus datos personales al brindarnos su consentimiento verbal. Para ello, le leeremos el consentimiento informado y al final de este, usted nos debe comentar si acepta o no acepta.\n\n"Por este medio, usted deja constancia:\n- Ha sido informado sobre el funcionamiento del Programa SEPA de la Fundación Peruana de Cáncer.\n- Acepta y tiene conocimiento que este programa lo/a acompañará a lo largo de la duración de este.\n- Acepta que la Fundación Peruana de Cáncer recolecte, almacene, transfiera, administre y utilice sus datos personales y de salud recogidos.\n- Entiende que puede solicitar que sus datos sean actualizados, rectificados o solicitar que no sean utilizados en el futuro y/o eliminarlos de la base de datos del Programa SEPA.\n- Tiene conocimiento de que el Programa SEPA es un programa de acceso libre, gratuito y voluntario patrocinado por la Fundación Peruana de Cáncer y que esta se reserva el derecho de suspenderlo y/o terminarlo y/o modificarlo.\n- Acepta ser contactado y recibir los materiales correspondientes al Programa SEPA a través de su teléfono o el de un familiar y su correo, si lo tuviese.\n- Tiene conocimiento de que puede solicitar a la Fundación Peruana de Cáncer en cualquier momento activar o desactivar cualquiera de dichos canales de comunicación con usted."\n\nPor favor me confirma si acepta y confirma tener conocimiento todo lo detallado en el texto leído:`,
    complianceNote: "El consentimiento verbal es jurídicamente válido. Registre la respuesta con absoluta precisión. No continúe si el paciente no acepta.",
    reference: "SEPA Protocol — Consentimiento Informado v4.2",
  },
  5: {
    script: "Para proceder con su registro, ¿podría indicarme el nombre completo del paciente y su número de DNI, por favor?",
    complianceNote: "Asegúrese de que el paciente comprende que sus datos serán tratados bajo las regulaciones de privacidad de la Fundación Peruana de Cáncer.",
    reference: "SEPA Protocol — Verificación de Identidad v4.2",
  },
  6: {
    script: "Con base en la información brindada, vamos a identificar la categoría que mejor describe su situación, para conectarle con la atención más adecuada dentro del programa.",
    complianceNote: "Las personas con seguro privado (EPS particular) no son elegibles para el Programa SEPA. Deben ser redirigidas a sus aseguradoras correspondientes.",
    reference: "SEPA Protocol — Categorización Clínica v4.2",
  },
  8: {
    script: "Muchas gracias por su tiempo. Finalmente, le informo que le enviaremos una breve encuesta de satisfacción del 1 al 5 por WhatsApp. Recuerde que puede contactarnos al 080074012 de lunes a viernes de 8:30 a.m. a 5:30 p.m.",
    reference: "SEPA Protocol — Cierre de Sesión v4.2",
  },
};

const BRANCH_CONTENT: Record<Q27Branch, AsideContent> = {
  signos_seguro: { script: "Entiendo su situación. Dado que cuenta con seguro y presenta signos o síntomas, nuestro equipo le brindará orientación para acceder a la atención médica correspondiente a través de su seguro.", reference: "SEPA Protocol — Signos y Síntomas / Seguro v4.2" },
  signos_eps: { script: "Entiendo. Con su cobertura EPS/EsSalud, puede acceder a su aseguradora directamente. ¿Podría indicarme con qué EPS cuenta actualmente?", complianceNote: "Si el paciente no ha solicitado consulta médica, proporcionar información de contacto de su EPS para orientación.", reference: "SEPA Protocol — Signos y Síntomas / EPS v4.2" },
  signos_privado: { script: "Estimado/a, el Programa SEPA está dirigido exclusivamente a población vulnerable sin seguro privado. Por este motivo, las personas con seguro privado no pueden inscribirse. Le estaremos enviando información de contacto de su aseguradora por WhatsApp.", complianceNote: "Este paciente no es elegible para el Programa SEPA. Proporcionar información de seguros privados y finalizar la inscripción.", reference: "SEPA Protocol — Derivación Seguro Privado v4.2" },
  signos_noseguro: { script: "Le comentamos que actualmente toda persona sin seguro puede afiliarse al SIS de forma gratuita. Puede llamar a la línea 113 opción 4, escribir al WhatsApp SIS 941 986 682, o descargar la app Asegúrate e Infórmate.", reference: "SEPA Protocol — Signos y Síntomas / Sin Seguro v4.2" },
  dx_seguro: { script: "Entendemos que el paciente tiene un diagnóstico de cáncer confirmado y cuenta con seguro. Nuestro equipo le brindará acompañamiento integral a lo largo de su tratamiento.", complianceNote: "Si el paciente está fuera de Lima con seguro SIS y necesita transporte u hospedaje, referirlo a la asistenta social del hospital.", reference: "SEPA Protocol — Diagnóstico de Cáncer / Seguro v4.2" },
  dx_eps: { script: "Con su cobertura EPS/EsSalud y diagnóstico confirmado, puede acceder a los grupos de acompañamiento mutuo: Grupo Cerezos en Flor para el paciente, y Grupo Fortaleza para familiares.", reference: "SEPA Protocol — Diagnóstico de Cáncer / EPS v4.2" },
  dx_privado: { script: "Estimado/a, el Programa SEPA está dirigido exclusivamente a población vulnerable sin seguro privado. Le estaremos enviando información de su aseguradora y el enlace de nuestro canal de prevención en WhatsApp.", complianceNote: "Este paciente no es elegible para el Programa SEPA. Proporcionar derivación a seguro privado y finalizar.", reference: "SEPA Protocol — Derivación Seguro Privado v4.2" },
  dx_noseguro: { script: "Entendemos la situación. Con un diagnóstico de cáncer y sin seguro activo, nuestro equipo le orientará en el proceso de afiliación al SIS y en el acceso a los servicios del programa.", reference: "SEPA Protocol — Diagnóstico de Cáncer / Sin Seguro v4.2" },
  psico: { script: "La Fundación Peruana de Cáncer ofrece cuatro sesiones individuales de psicooncología, cada una de 30 a 45 minutos. También puede participar de las sesiones grupales ilimitadas a través de la alianza Desde el Jardín de los Cerezos.", complianceNote: "Si el paciente es pediátrico, los padres deciden quién llevará las consultas psicológicas.", reference: "SEPA Protocol — Servicio Psicooncológico v4.2" },
  fpc: { script: "El Programa SEPA se limita a brindar servicios gratuitos de educación en prevención y acompañamiento al paciente oncológico. Para otros servicios de nuestro Albergue, le derivaremos para que puedan orientarle.", reference: "SEPA Protocol — Servicios FPC v4.2" },
  otros: { script: "Entendemos su consulta. Por favor, descríbame con detalle la situación para poder orientarle de la mejor manera posible dentro de los servicios del Programa SEPA.", reference: "SEPA Protocol — Consulta General v4.2" },
};

export function resolveAsideContent(step: number, branch?: Q27Branch | null): AsideContent {
  if (step === 7 && branch && BRANCH_CONTENT[branch]) return BRANCH_CONTENT[branch];
  return STEP_CONTENT[step] ?? { script: "Complete los campos de este paso para continuar con la inscripción.", reference: "SEPA Protocol v4.2" };
}
