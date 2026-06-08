import type { AsideContent } from "../_components/enrollment-aside";
import type { EnrollmentDraft } from "../_store/enrollment-store";

function step5Conditionals(draft: EnrollmentDraft): string {
  const parts: string[] = [];

  if (draft.details.dniMatchesAddress === false) {
    parts.push(
      "Información adicional si no coincide con su domicilio: Le recomendamos acercarse a RENIEC para actualizar la dirección registrada en su DNI, ya que en caso requiera ser referido a un establecimiento de salud de mayor complejidad, podría ser derivado a uno que no se encuentre cercano a su domicilio actual. Para ello deberá presentar su DNI vigente y un recibo de servicios (agua o luz) con una antigüedad no mayor a seis meses. En RENIEC le indicarán los procedimientos correspondientes. Asimismo, puede comunicarse a la línea 113, opción 4, para obtener mayor información.",
    );
  }

  if (draft.insurance.insuranceType !== "NONE") {
    parts.push(
      'Estimada(o), dentro de los próximos minutos le compartiremos un enlace para que pueda verificar qué tipo de seguro tiene: https://app1.susalud.gob.pe/registro/ Para ello deberá seguir los siguientes pasos:\n1. Hacer clic en "Nuevo usuario".\n2. Registrarse utilizando su DNI o CE.\n3. Hacer clic en "Grabar".\n4. Validar sus datos y revisar su correo electrónico.\n5. Volver a la página e iniciar sesión.',
    );
  }

  return parts.join("\n\n");
}

function step7Script(draft: EnrollmentDraft, categoriaClinica: "signos" | "diagnostico" | null): string {
  const hasInsurance = draft.insurance.insuranceType !== "NONE";

  if (hasInsurance) {
    if (categoriaClinica === "signos") {
      return "Entiendo su situación. Dado que cuenta con seguro y presenta signos o síntomas, nuestro equipo le brindará orientación para acceder a la atención médica correspondiente a través de su seguro.";
    }
    return "Entiendo su situación. Dado que cuenta con seguro y ya cuenta con un diagnóstico, nuestro equipo le brindará orientación para acceder a la atención médica correspondiente a través de su seguro.";
  }

  return "Entiendo su situación. Dado que no cuenta con un seguro de salud, el personal del programa lo ayudará con el proceso de afiliación al SIS para que pueda acceder a sus atenciones médicas.";
}

export function resolveAsideContent(
  step: number,
  draft?: EnrollmentDraft,
  categoriaClinica?: "signos" | "diagnostico" | null,
): AsideContent {
  const d = draft;

  switch (step) {
    case 1:
      return {
        script:
          "Buenos días / Buenas Tardes. Bienvenido/a al Programa SEPA de la Fundación Peruana de Cáncer. Le saluda [Nombre], ejecutiva del programa SEPA. ¿Me brinda su nombre por favor?\n\nEstimado(a) _____ Le comentamos que el programa SEPA es un programa que brinda Servicios gratuitos de Educación en Prevención del Cáncer y Acompañamiento al Paciente con cáncer. ¿Cuál es el motivo de su llamada?",
        reference: "SEPA Protocol — Apertura de Sesión v4.2",
      };

    case 2:
      return {
        script:
          "Sra./Sr. .......... Para poder continuar, es preciso mencionarle que esta llamada se encuentra conforme a sus derechos como usuario de los servicios de Salud Ley 26842 y Ley 29733 sobre la protección de Datos Personales. Le comentamos que esta llamada podría ser grabada por temas de calidad. ¿Realizaremos un registro para continuar con la inscripción dentro del programa Sepa. ¿Esta usted de acuerdo?",
        complianceNote:
          "Sin el acuerdo explícito, la inscripción debe detenerse inmediatamente.",
        reference: "SEPA Protocol — Autorización de Datos v4.2",
      };

    case 3:
      return {
        script:
          "¿Me podría indicar si usted es el paciente oncológico, o si está realizando esta afiliación en nombre de un familiar o amigo?",
        reference: "SEPA Protocol — Identificación del Llamante v4.2",
      };

    case 4:
      return {
        script:
          'Por otro lado, Le solicitamos que autorice oficialmente su inscripción al Programa SEPA y el uso de sus datos personales al brindarnos su consentimiento verbal. Para ello, le leeremos el consentimiento informado y al final de este, usted nos debe comentar si acepta o no acepta.\n\n"Por este medio, usted deja constancia:\n- Ha sido informado sobre el funcionamiento del Programa SEPA de la Fundación Peruana de Cáncer.\n- Acepta y tiene conocimiento que este programa lo/a acompañará a lo largo de la duración de este.\n- Acepta que la Fundación Peruana de Cáncer recolecte, almacene, transfiera, administre y utilice sus datos personales y de salud recogidos.\n- Entiende que puede solicitar que sus datos sean actualizados, rectificados o solicitar que no sean utilizados en el futuro y/o eliminarlos de la base de datos del Programa SEPA.\n- Tiene conocimiento de que el Programa SEPA es un programa de acceso libre, gratuito y voluntario patrocinado por la Fundación Peruana de Cáncer y que esta se reserva el derecho de suspenderlo y/o terminarlo y/o modificarlo.\n- Acepta ser contactado y recibir los materiales correspondientes al Programa SEPA a través de su teléfono o el de un familiar y su correo, si lo tuviese.\n- Tiene conocimiento de que puede solicitar a la Fundación Peruana de Cáncer en cualquier momento activar o desactivar cualquiera de dichos canales de comunicación con usted."\n\nPor favor me confirma si acepta y confirma tener conocimiento todo lo detallado en el texto leído:',
        complianceNote:
          "El consentimiento verbal es jurídicamente válido. No continúe si el paciente no acepta.",
        reference: "SEPA Protocol — Consentimiento Informado v4.2",
      };

    case 5: {
      const base = "Para proceder con su registro, ¿podría indicarme el nombre completo del paciente y su número de DNI, por favor?";
      const extra = d ? step5Conditionals(d) : "";
      return {
        script: extra ? `${base}\n\n${extra}` : base,
        complianceNote:
          "Asegúrese de que el paciente comprende que sus datos serán tratados bajo las regulaciones de privacidad.",
        reference: "SEPA Protocol — Verificación de Identidad v4.2",
      };
    }

    case 6:
      return {
        script:
          "Con base en la información brindada, vamos a identificar la categoría que mejor describe su situación, para conectarle con la atención más adecuada dentro del programa.",
        reference: "SEPA Protocol — Categorización Clínica v4.2",
      };

    case 7:
      return {
        script: d
          ? step7Script(d, categoriaClinica ?? null)
          : "Complete los datos clínicos según la categoría seleccionada y la situación de seguro del paciente.",
        reference: "SEPA Protocol — Atención Especializada v4.2",
      };

    case 8:
      return {
        script:
          "Muchas gracias por su tiempo. Finalmente, le informo que le enviaremos una breve encuesta de satisfacción del 1 al 5 por WhatsApp. Recuerde que puede contactarnos al 080074012 de lunes a viernes de 8:30 a.m. a 5:30 p.m.",
        reference: "SEPA Protocol — Cierre de Sesión v4.2",
      };

    default:
      return {
        script: "Complete los campos de este paso para continuar.",
        reference: "SEPA Protocol v4.2",
      };
  }
}
