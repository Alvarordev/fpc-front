# Auditoría de observaciones CRM - tercera reunión

**Fecha de revisión:** 2026-08-27
**Fuente:** `Observaciones CRM- tercera reunión-31-59.pdf`
**Repositorios revisados:** `fpc-front` y `/home/hazard/code/fpc-backend`
**Spec de implementación:** `specs/observaciones-crm-tercera-reunion.md`

## 1. Objetivo

Contrastar las tres observaciones principales del documento de la tercera reunión
con el modelo actual, los DTOs, los payloads, las pantallas y los indicadores
implementados en el front y en el backend.

El documento contiene tres observaciones numeradas:

- **23.** Indicadores SEPA para el perfil administrador.
- **24.** Asignación de pacientes por analista para realizar los seguimientos.
- **25.** Enrolamiento de pacientes con signos y síntomas.

La observación 23 tiene los grupos `a` a `g`, la observación 24 no tiene
subobservaciones y la observación 25 tiene los puntos `a` a `r`.

## 2. Alcance y criterio

Se revisaron de forma estática:

- Entidades TypeORM, migraciones, DTOs, servicios y controladores del backend.
- Tipos, estado del wizard, componentes de enrolamiento y construcción del
  payload del front.
- Servicio y pantalla del dashboard.
- Flujos de seguimientos, recordatorios, encuestas, citas y webhooks de n8n. La
  revisión de encuestas y automatizaciones se conserva solo como evidencia del
  estado encontrado; no forma parte del alcance de implementación.

Estados utilizados en este documento:

| Estado               | Significado                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Implementado**     | El dato o flujo requerido existe de forma utilizable en captura y/o consulta.                                  |
| **Parcial**          | Existe una base, pero falta una parte del requisito, una validación, una métrica o la consulta administrativa. |
| **Ausente**          | No existe una implementación suficiente para registrar o medir el requisito.                                   |
| **Inconsistente**    | Existe en una capa, pero otra capa lo muestra, transforma, descarta o interpreta de forma diferente.           |
| **Postergado**       | El requisito fue auditado, pero requiere definición funcional antes de planificar su implementación.           |
| **Fuera de alcance** | El requisito fue revisado, pero se decidió no modificarlo en este trabajo.                                     |

La revisión no incluyó datos reales de producción ni ejecución contra una base de
datos desplegada.

### Decisiones posteriores a la auditoría

- La observación 23.c queda completamente fuera de alcance. La aceptación y la
  calificación manual existentes permanecen sin cambios.
- La observación 24 queda postergada. No se implementarán asignaciones de
  pacientes a analistas o usuarios `FOUNDATION` hasta definir el proceso.
- La observación 25 se implementará completa, puntos `a` a `r`, con las
  decisiones descritas en el spec.

## 3. Resumen ejecutivo

| Observación | Estado general | Conclusión                                                                                                                                                                                               |
| ----------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23          | **Parcial**    | La base de datos registra buena parte de la información clínica, social y de seguimiento, pero el dashboard solo expone un subconjunto pequeño de los indicadores incluidos. 23.c está fuera de alcance. |
| 24          | **Postergado** | Se asignan seguimientos y recordatorios a agentes, pero no existe una asignación persistente de paciente a analista. El proceso objetivo aún debe definirse.                                             |
| 25          | **Parcial**    | El wizard ya cubre algunos datos solicitados, pero la rama de signos y síntomas no captura varias preguntas necesarias y contiene campos que no llegan al backend.                                       |

## 4. Observación 23: indicadores SEPA para el perfil administrador

### 23.a Indicadores demográficos

| #   | Requisito                                                 | Situación actual                                                                                                                                                                                                                                                                | Estado           |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | Edad calculada con el año de nacimiento                   | `patients.birthDate` se captura en el wizard. El backend calcula edad únicamente para el resumen clínico de Gemini; no existe distribución o indicador de edad en el dashboard.                                                                                                 | **Parcial**      |
| 2   | Sexo                                                      | `patients.gender` se captura y el dashboard devuelve `distributions.gender`.                                                                                                                                                                                                    | **Implementado** |
| 3   | Distrito de residencia actual                             | `patient_addresses.district` se captura como parte de la dirección primaria. No existe indicador administrativo por distrito.                                                                                                                                                   | **Parcial**      |
| 4   | Provincia de residencia actual                            | `patient_addresses.province` se captura. No existe indicador administrativo por provincia.                                                                                                                                                                                      | **Parcial**      |
| 5   | Departamento de residencia actual                         | `patient_addresses.department` se captura. El dashboard tiene una tabla de regiones, pero prioriza el departamento del establecimiento de salud antes que el de residencia y puede terminar usando el departamento de nacimiento. No es un indicador puro de residencia actual. | **Parcial**      |
| 6   | Zonificación urbana/rural de la residencia actual         | `patient_details.zoneType` existe y se captura en el wizard y en seguimiento social. No se expone en el dashboard.                                                                                                                                                              | **Parcial**      |
| 7   | Grado instructivo                                         | `patient_details.educationLevel` existe y se captura. No se expone en el dashboard.                                                                                                                                                                                             | **Parcial**      |
| 8   | Lengua originaria                                         | `patient_details.nativeLanguage` y `requiresTranslation` existen y se capturan. No se expone en el dashboard.                                                                                                                                                                   | **Parcial**      |
| 9   | Tipo de seguro, incluyendo cambios durante el seguimiento | `patient_insurance` conserva historial con `isCurrent`, `startDate`, `endDate` y `changeReason`. El seguimiento permite registrar cambios. No existe indicador administrativo por tipo de seguro ni evolución.                                                                  | **Parcial**      |
| 10  | Estatus laboral en el primer contacto                     | `patient_details.isWorking` existe y se edita en seguimiento social, pero no se solicita en el primer contacto del wizard ni se incluye en el payload de enrolamiento.                                                                                                          | **Parcial**      |

**Evidencia principal:**

- Backend: `src/database/entities/patient.entity.ts:49-67` y `src/database/entities/patient-details.entity.ts:42-136`.
- Backend: `src/modules/patients/dto/upsert-patient-details.dto.ts:17-124`.
- Front: `src/pages/enrolamiento/_components/steps/step-5-datos.tsx:145-256`.
- Front: `src/pages/pacientes/[id]/seguimientos/_components/clinical-data-tabs.tsx:2955-3177`.
- Dashboard: `src/modules/dashboard/dashboard.service.ts:132-163` y `247-346`.

### 23.b Indicadores epidemiológicos

| #   | Requisito                                                                  | Situación actual                                                                                                                                                                                                                                                       | Estado      |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Mortalidad de pacientes fallecidos                                         | Se puede registrar `deceasedAt` y la baja puede tener razón `DECEASED`. El dashboard cuenta fallecidos dentro de la cohorte seleccionada, pero no ofrece un indicador de mortalidad con el desglose y la semántica solicitados.                                        | **Parcial** |
| 2   | Morbilidad por tipo de cáncer                                              | Existe `patient_diagnoses.diagnosis`, y el front ofrece opciones de tipos de cáncer con posibilidad de texto libre para “Otro”. El dashboard muestra diagnósticos actuales, pero no separa adecuadamente confirmados, signos/síntomas y otros estados epidemiológicos. | **Parcial** |
| 3   | Tipos de cáncer por región actual                                          | El dashboard devuelve diagnósticos y regiones por separado. No existe una consulta o respuesta cruzada `región x tipo de cáncer`.                                                                                                                                      | **Ausente** |
| 4   | Casos por estadio y tipo de cáncer                                         | El dashboard devuelve estadios y diagnósticos por separado. No existe una consulta o respuesta cruzada `estadio x tipo de cáncer`.                                                                                                                                     | **Ausente** |
| 5   | Pacientes en fase de remisión                                              | `TreatmentSituation.REMISSION` existe y se puede almacenar en `patient_treatments`. No hay indicador en dashboard para contar remisión.                                                                                                                                | **Parcial** |
| 6   | Paliativo temprano/simultáneo separado de paliativo sin tratamiento activo | `treatmentType` es texto libre y `treatmentSituation` no contiene una clasificación específica para estas dos situaciones. No se puede medir de forma confiable la diferencia solicitada ni evitar que el paliativo simultáneo figure como interrumpido.               | **Ausente** |
| 7   | Casos en espera de tratamiento                                             | Existe `PENDIENTE_DE_INICIO`, mostrado como “En espera” en el wizard. No existe indicador en dashboard.                                                                                                                                                                | **Parcial** |
| 8   | Casos en búsqueda de tratamiento                                           | Existe `SEARCHING`, mostrado como “En búsqueda”. No existe indicador en dashboard.                                                                                                                                                                                     | **Parcial** |
| 9   | Casos con tratamiento activo                                               | Existe `EN_CURSO`, mostrado como “En proceso”. No existe indicador en dashboard.                                                                                                                                                                                       | **Parcial** |
| 10  | Casos con tratamiento culminado                                            | Existe `FINALIZADO`, mostrado como “Culminado”. No existe indicador en dashboard.                                                                                                                                                                                      | **Parcial** |
| 11  | Casos con tratamiento suspendido                                           | Existe `INTERRUMPIDO`, mostrado como “Suspendido”. No existe indicador en dashboard ni catálogo de motivos clínicos.                                                                                                                                                   | **Parcial** |

**Evidencia principal:**

- Backend: `src/database/entities/patient-treatment.entity.ts:19-123`.
- Backend: `src/database/entities/treatment-situation.enum.ts`.
- Front: `src/pages/enrolamiento/_components/steps/step-7-atencion.tsx:76-92` y `1144-1171`.
- Dashboard: `src/modules/dashboard/dashboard.service.ts:132-150`.

### 23.c Indicadores de satisfacción y automatización de encuestas: fuera de alcance

| #   | Requisito                                                                               | Situación actual                                                                                                                                                                                                         | Estado      |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| 1   | Encuesta de satisfacción de la llamada de enrolamiento por WhatsApp o llamada posterior | Se registra si el paciente acepta la encuesta (`surveyAccepted`) y existe calificación manual `followUpQualityRating` de 1 a 5 desde el perfil. No existe envío por WhatsApp, reintento ni llamada posterior automática. | **Parcial** |
| 2   | Encuesta de orientación general después de tres meses                                   | No existe encuesta, programación a tres meses, fecha de vencimiento ni entidad para almacenar ese resultado.                                                                                                             | **Ausente** |
| 3   | Encuesta de talleres/charlas para asistentes                                            | `familyPreventionTalkInterests` registra interés de familiares, no asistencia ni satisfacción. No existe encuesta o registro de asistentes.                                                                              | **Ausente** |
| 4   | Encuesta de consultas psicooncológicas                                                  | Existen citas de psicooncología y datos de sesión, pero no existe calificación de satisfacción ni automatización de encuesta para esas sesiones.                                                                         | **Ausente** |

El backend actualmente reconoce estos eventos de n8n: `Alerta`,
`AlertaResuelta`, `AlertaDerivar`, `Cita` y `Registro`. No existe un evento de
encuesta. `hasWhatsapp` solo identifica una capacidad de contacto; no dispara
ninguna automatización.

**Decisión:** **Fuera de alcance**. No se implementarán WhatsApp, n8n, llamadas,
programaciones, reintentos, nuevas encuestas ni nuevos datos manuales de
satisfacción. La aceptación y la calificación manual existentes se mantienen
sin cambios.

**Evidencia principal:**

- Backend: `src/database/entities/enrollment.entity.ts:75-88`.
- Backend: `src/modules/enrollments/enrollments.controller.ts:56-76`.
- Backend: `src/modules/enrollments/enrollments.service.ts:321-348`.
- Backend: `src/integrations/n8n/n8n-webhook.events.ts:1-9`.
- Front: `src/pages/enrolamiento/_components/steps/step-8-cierre.tsx:147-173`.
- Front: `src/pages/pacientes/[id]/_components/enrollment-rating-card.tsx`.
- Front: `src/api/enrollments.ts:33-43`.

### 23.d Indicadores de gestión/proceso

| #   | Requisito                                                                             | Situación actual                                                                                                                                                                                                                               | Estado            |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | Personas afiliadas al SIS por soporte del programa                                    | `patient_sis_affiliation.affiliatedViaSepa` existe y se puede actualizar durante el seguimiento. No hay indicador administrativo.                                                                                                              | **Parcial**       |
| 2   | Personas con seguro privado que recibieron orientación para activar EsSalud           | Existe `InsuranceType.ESSALUD`, pero no existe la pregunta específica “Afiliación al ESSALUD desde SEPA”. `affiliatedViaSepa` pertenece al flujo de SIS y no existe un campo equivalente para EsSalud.                                         | **Ausente**       |
| 3   | Personas que realizaron consulta de atención primaria por soporte del programa        | El modelo registra si buscó consulta y permite registrar citas, pero la rama de signos y síntomas no registra de forma separada consulta solicitada, consulta programada/asistida y asistencia por soporte de SEPA.                            | **Parcial**       |
| 4   | Personas referidas a un establecimiento de mayor complejidad por soporte del programa | La entidad de citas tiene `hasReferralSheet` y `referredTo`, pero estos campos solo se muestran en la sección de consultas de la rama de diagnóstico confirmado. Falta la pregunta de resultado y el atributo que identifique soporte de SEPA. | **Parcial**       |
| 5   | Personas atendidas por especialidad médica para diagnóstico oncológico                | Existen `diagnosisSpecialty` y `symptomReport.specialty`, pero no existe consulta ni visualización agregada por especialidad.                                                                                                                  | **Parcial**       |
| 6   | Personas con enfermedad oncológica descartada por soporte del programa                | No existe un estado estructurado `EN BÚSQUEDA-DESCARTADO`. `SEARCHING` solo representa una situación de tratamiento.                                                                                                                           | **Ausente**       |
| 7   | Personas diagnosticadas con cáncer por soporte del programa                           | No existe un estado estructurado `EN BÚSQUEDA-ENCONTRADO` ni una transición que registre que el diagnóstico fue confirmado por soporte de SEPA.                                                                                                | **Ausente**       |
| 8   | Personas que accedieron al tratamiento por el programa                                | `PatientDiagnosis.isSepaActiveReferral` es un campo relacionado, pero el tratamiento no tiene un campo `fromSepa` o equivalente y el payload del wizard omite `isSepaActiveReferral`.                                                          | **Inconsistente** |
| 9   | Personas que accedieron a beneficio de traslado gestionado por el programa            | El enrolamiento acepta `requiresTransportation` y `hasMobilityIssues`, pero el wizard no los envía en `step-8-payload.ts`. No existen proveedor, resultado de gestión ni opciones como Cruz del Sur o LATAM.                                   | **Inconsistente** |
| 10  | Personas que accedieron a servicio de albergue por orientación                        | No existen campos, entidad, catálogo ni pantalla para registrar albergue o proveedor.                                                                                                                                                          | **Ausente**       |

**Evidencia principal:**

- Backend: `src/database/entities/patient-sis-affiliation.entity.ts:26-35`.
- Backend: `src/database/entities/patient-medical-appointment.entity.ts:32-53`.
- Backend: `src/database/entities/patient-diagnosis.entity.ts:66-85`.
- Backend: `src/modules/enrollments/dto/create-enrollment.dto.ts:136-145`.
- Front: `src/pages/enrolamiento/_components/steps/step-7-atencion.tsx:472-633` y `885-985`.
- Front: `src/pages/enrolamiento/_components/steps/step-8-payload.ts:277-305` y `357-406`.

### 23.e Indicadores de productividad

| #   | Requisito                                                         | Situación actual                                                                                                                                                                                                             | Estado      |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Tiempo promedio desde enrolamiento hasta afiliación al SIS        | Existen `enrollments.createdAt` y `patient_sis_affiliation.affiliatedAt`, pero no existe consulta ni indicador de promedio.                                                                                                  | **Parcial** |
| 2   | Tiempo promedio desde primera consulta primaria hasta diagnóstico | Existen `appointmentDate`, `isFirstConsultation` y `diagnosisDate`, pero la rama de signos y síntomas no captura correctamente la primera consulta y no hay cálculo agregado.                                                | **Parcial** |
| 3   | Tiempo promedio desde diagnóstico hasta primer tratamiento        | Existen `diagnosisDate`, `patientTreatment.startDate` y la relación con el diagnóstico. Falta distinguir explícitamente primer tratamiento histórico y calcular el promedio.                                                 | **Parcial** |
| 4   | Personas que continúan en el programa                             | Existen `ACTIVE`, `INACTIVE` y `REACTIVE`, y el dashboard calcula pacientes activos/inactivos. Sin embargo, `dropoutPatients` agrupa todos los inactivos no fallecidos y no equivale necesariamente a abandono del programa. | **Parcial** |
| 5   | Personas que utilizaron cada beneficio                            | Se pueden inferir seguimientos y citas de psicooncología, pero no existe asistencia a charlas/talleres ni indicadores consolidados por beneficio.                                                                            | **Parcial** |
| 6   | Personas que utilizaron todos los beneficios                      | No existe modelo de beneficios utilizados ni cálculo de cumplimiento del conjunto.                                                                                                                                           | **Ausente** |

**Evidencia principal:**

- Backend: `src/modules/dashboard/dashboard.service.ts:188-244`.
- Backend: `src/database/entities/patient.entity.ts:75-102`.
- Backend: `src/database/entities/patient-medical-appointment.entity.ts:38-50`.
- Backend: `src/database/entities/psychooncology-appointment.entity.ts:72-93`.

### 23.f Indicadores de adherencia al tratamiento

| #   | Requisito                                                   | Situación actual                                                                                                                                                                                            | Estado      |
| --- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Cumplimiento de sesiones de quimioterapia/radioterapia      | El modelo registra frecuencia y fechas del tratamiento, pero no sesiones programadas y realizadas. Las sesiones existentes son exclusivamente de psicooncología y no representan adherencia oncológica.     | **Ausente** |
| 2   | Cumplimiento de tratamiento hormonal                        | Existen medicamentos con dosis, vía, frecuencia y fechas, pero no eventos de dosis ingeridas ni un resultado de adherencia.                                                                                 | **Ausente** |
| 3   | Personas que no iniciaron tratamiento y motivo              | Existe `notReceivingReason` como texto libre y `PENDIENTE_DE_INICIO`, pero no existe catálogo de motivos ni indicador de barreras y orientación.                                                            | **Parcial** |
| 4   | Personas que abandonaron tratamiento/citas/control y motivo | Existe `treatmentAbandonmentReason` para tratamiento y `difficulties` para citas, pero no hay catálogo común, separación consistente entre tratamiento/cita/control ni indicadores de abandono por barrera. | **Parcial** |
| 5   | Interrupción por criterio clínico o seguridad               | Existe `INTERRUMPIDO`, pero no existen motivos estructurados para reacción, toxicidad, evaluación de alternativa u otros. Tampoco existe una categoría diferenciada para paliativos sin tratamiento activo. | **Parcial** |

El backend solo exige un motivo cuando la situación es `ABANDONED`; no exige ni
clasifica motivos para `INTERRUMPIDO`. El front solo despliega un campo de
motivo cuando se selecciona abandono.

**Evidencia principal:**

- Backend: `src/database/entities/patient-treatment.entity.ts:79-121`.
- Backend: `src/modules/patients/clinical/treatments/dto/create-patient-treatment.dto.ts:67-82`.
- Front: `src/pages/enrolamiento/_components/steps/step-7-atencion.tsx:1380-1397` y `1400-1592`.
- Backend: `src/modules/dashboard/dashboard.service.ts:202-203` y `227-239`.

### 23.g Indicadores de abandono del programa

| #   | Requisito                                                                  | Situación actual                                                                                                                                                                                                                                                                                                                         | Estado      |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Abandono voluntario, personas no ubicables, fallecimientos y otros motivos | El paciente tiene razones de baja `DECEASED`, `WITHDREW_CONSENT`, `LOST_CONTACT`, `TRANSFERRED_OUT` y `OTHER`. También existen `programDropoutReason` y `programDropoutDate` como texto/fecha. El dashboard cuenta inactivos y fallecidos, pero no expone el desglose solicitado y mezcla baja administrativa con abandono del programa. | **Parcial** |

Debe mantenerse la diferencia entre abandono del programa y abandono del
tratamiento. Actualmente existen campos separados, pero el indicador de
dashboard `dropoutPatients` no garantiza esa separación.

**Evidencia principal:**

- Backend: `src/database/entities/patient.entity.ts:75-102`.
- Backend: `src/database/entities/patient-details.entity.ts:138-142`.
- Backend: `src/modules/patients/patients.service.ts:487-509`.
- Front: `src/pages/pacientes/[id]/seguimientos/_components/clinical-data-tabs.tsx:2955-3177`.
- Dashboard: `src/modules/dashboard/dashboard.service.ts:195-204`.

## 5. Observación 24: asignación de pacientes por analista (postergada)

### Situación actual

Existe asignación operativa por tarea:

- `follow_ups.agent_id` asigna cada seguimiento a un agente.
- `reminders.assigned_agent_id` asigna cada recordatorio a un agente.
- El cierre del enrolamiento permite seleccionar el agente responsable y envía
  el valor dentro de `followUp.agentId`.
- El call center agrupa seguimientos y recordatorios por agente.
- El backend impide que un agente reasigne tareas a otro agente; los perfiles
  administrativos pueden asignarlas.

No existe una relación persistente `patient -> analyst`, una entidad de
asignación, historial de cambios de analista ni consulta de pacientes por
analista. Por tanto, cuando el paciente no tiene tareas pendientes, no existe
un responsable de seguimiento identificable a nivel de paciente.

**Estado de auditoría:** **Parcial**.
**Decisión de alcance:** **Postergado**.

No se diseñará ni implementará una solución hasta definir responsables,
vigencia, reasignación, visibilidad, permisos e historial. La asignación actual
de tareas permanece sin cambios y no se migrarán pacientes a usuarios
`FOUNDATION`.

**Evidencia principal:**

- Backend: `src/database/entities/follow-up.entity.ts:29-48`.
- Backend: `src/database/entities/reminder.entity.ts:17-43`.
- Backend: `src/modules/follow-ups/follow-ups.service.ts:84-118` y `288-309`.
- Backend: `src/modules/follow-ups/follow-ups.controller.ts:50-60`.
- Front: `src/pages/enrolamiento/_components/steps/step-8-cierre.tsx:43-68` y `176-207`.
- Front: `src/pages/callcenter/page.tsx:91-122`.

## 6. Observación 25: enrolamiento de pacientes con signos y síntomas

| Punto | Requisito                                                                 | Situación actual                                                                                                                                                                                                                      | Estado            |
| ----- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| a     | Añadir departamento de nacimiento                                         | `details.birthDepartment` existe en el modelo, DTO, payload y Step 5 del wizard.                                                                                                                                                      | **Implementado**  |
| b     | Reemplazar referencia por ubicación web de residencia actual              | La dirección conserva `reference` como texto libre. No existe URL de ubicación, coordenadas ni enlace a mapa.                                                                                                                         | **Ausente**       |
| c     | Nombre del contacto principal                                             | El modelo puede mostrar un acompañante marcado como `isPrimaryContact`, pero el wizard captura al llamante/acompañante y no un contacto principal independiente para todos los casos.                                                 | **Parcial**       |
| d     | Parentesco del contacto principal                                         | `companion_patient.relationship` existe y se captura para el acompañante, pero no está modelado como atributo de un contacto principal independiente.                                                                                 | **Parcial**       |
| e     | Nombre del contacto secundario                                            | No existe un campo específico de nombre para segundo contacto en el enrolamiento. `secondaryPhone` solo es un segundo teléfono de la misma persona.                                                                                   | **Ausente**       |
| f     | Parentesco del contacto secundario                                        | No existe un campo o flujo específico para el parentesco de un segundo contacto.                                                                                                                                                      | **Ausente**       |
| g     | Quitar correo del enrolamiento                                            | El Step 5 aún muestra y captura el correo del paciente; el Step 3 también permite correo del acompañante. El backend sigue aceptando y almacenando `email`.                                                                           | **Inconsistente** |
| h     | Quitar contacto de emergencia o convertirlo en tercer contacto            | El backend conserva `emergencyContactName`, `emergencyContactPhone` y `emergencyContactGender`, pero no existe un modelo explícito de tercer contacto. El wizard no ofrece un flujo claro para ninguna de las dos alternativas.       | **Inconsistente** |
| i     | Quitar fecha de inicio del seguro                                         | El Step 5 muestra `startDate` y lo conserva en el estado, pero `step-8-payload.ts` solo envía tipo y proveedor de seguro. La fecha visible se pierde en el enrolamiento.                                                              | **Inconsistente** |
| j     | Si no presenta malestar/dolor, preguntar qué motivó el examen             | El wizard registra `hasDiscomfort`, pero no muestra una pregunta condicional de motivación. `symptomLeadingToCheckup` pertenece a la rama de diagnóstico confirmado y no cubre esta pregunta.                                         | **Ausente**       |
| k     | Preguntar establecimiento antes de especialidad consultada                | El backend y el contrato tienen `symptomReport.healthCenterId`, pero la rama de signos y síntomas no muestra selector de establecimiento ni envía ese campo.                                                                          | **Inconsistente** |
| l     | Registrar fecha de la primera consulta                                    | `patient_medical_appointments.appointmentDate` existe, pero la sección de citas del Step 7 se muestra solo para `CANCER_DIAGNOSIS`, no para signos y síntomas.                                                                        | **Parcial**       |
| m     | Registrar cuánto tiempo lleva esperando o buscando diagnóstico            | `waitTimeForDiagnosis` se captura solo en la rama de diagnóstico confirmado. `symptomDuration` mide duración de síntomas, no tiempo de espera o búsqueda de diagnóstico.                                                              | **Ausente**       |
| n     | Preguntar si recibió hoja de referencia y, si sí, a dónde; si no, por qué | `hasReferralSheet`, `referredTo` y `difficulties` existen en la entidad de citas, pero no se muestran en la rama de signos y síntomas.                                                                                                | **Parcial**       |
| o     | Preguntar si recibió diagnóstico, cuál, y cuándo es la siguiente consulta | Existen diagnóstico y próxima cita como entidades separadas, pero la rama de signos y síntomas no ofrece estos campos ni la relación de resultado requerida.                                                                          | **Parcial**       |
| p     | Preguntar si recibe tratamiento, tipo/frecuencia o motivo de no recibirlo | El wizard sí pregunta `currentlyReceivingTreatment` en signos y síntomas. Los datos de tipo, frecuencia y `notReceivingReason` solo se muestran en la rama de diagnóstico y el payload solo crea tratamientos cuando hay diagnóstico. | **Parcial**       |
| q     | Preguntar si recibió consulta médica y registrar el motivo                | Existe `hasSoughtMedicalConsultation`, pero no existe un campo específico para el motivo cuando no recibió consulta. `difficulties` pertenece a una cita y no reemplaza esta respuesta.                                               | **Parcial**       |
| r     | Mover duración y frecuencia inmediatamente después de malestar/dolor      | Actualmente el orden es malestar, signos, consulta médica, especialidad, indicaciones, duración y frecuencia. No cumple el orden solicitado.                                                                                          | **Inconsistente** |

### Flujo actual de signos y síntomas

El Step 7 actualmente captura:

- Si presenta malestar o dolor.
- Descripción de signos y síntomas.
- Si ha sacado o asistido a una cita.
- Especialidad consultada.
- Indicaciones recibidas.
- Duración y frecuencia de síntomas.
- Si recibe tratamiento médico.

La entidad `PatientSymptomReport` tiene algunos campos adicionales, como
`healthCenterId`, `isPainPresent`, `painIntensity`, `painLocation` y
`painDescription`, pero la rama del wizard no los captura. Además, el tipo local
del front incluye `firstConsultationDetails`, mientras que el DTO actual del
backend no tiene ese campo; esto evidencia una divergencia entre el tipo local y
el contrato real.

**Evidencia principal:**

- Front: `src/pages/enrolamiento/_components/steps/step-7-atencion.tsx:472-633`.
- Front: `src/pages/enrolamiento/_components/steps/step-8-payload.ts:373-401`.
- Front: `src/types/index.ts:310-320`.
- Front: `src/api/schema.d.ts:1656-1672`.
- Backend: `src/database/entities/patient-symptom-report.entity.ts:38-84`.
- Backend: `src/modules/patients/symptom-reports/dto/create-patient-symptom-report.dto.ts:15-38`.
- Backend: `src/database/entities/patient-medical-appointment.entity.ts:32-53`.

## 7. Brechas transversales prioritarias

### Prioridad alta: pérdida o divergencia de datos

- `insurance.startDate` se muestra en `step-5-datos.tsx`, se conserva en el
  estado y existe en backend, pero se omite al construir el payload en
  `step-8-payload.ts:256-264`. El spec resuelve la divergencia quitando el campo
  del enrolamiento y conservándolo en seguimiento.
- `diagnosis.isSepaActiveReferral` existe en el tipo del front, el esquema
  OpenAPI, el DTO y la entidad backend, pero el payload no lo incluye. El test
  actual incluso verifica explícitamente que se omita en
  `step-8-payload.test.ts:239-306`.
- Los campos sociales `isWorking`, `receivesFinancialSupport`,
  `hasConadisCard`, `knowsAboutFissal`, `usesWoodStove` y
  `evidenceOfDomesticViolence` existen para seguimiento, pero no forman parte
  del payload de creación del enrolamiento.
- El tipo local `SymptomReportRequest` incluye `firstConsultationDetails`, pero
  `CreatePatientSymptomReportDto` no lo acepta.

### Prioridad alta: completar el flujo de signos y síntomas

El spec define la captura explícita de establecimiento, fecha de primera
consulta, hoja de referencia, diagnóstico recibido, próxima consulta,
tratamiento reportado, motivos de barrera y resultado del soporte de SEPA. Estos
datos preliminares no crearán diagnósticos ni tratamientos oncológicos formales.

### Prioridad media: completar el modelo de gestión

Se requieren modelos o campos estructurados para:

- Contactos principal y secundario, sin crear un tercer contacto.
- Resultado de diagnóstico descartado/encontrado.
- Tratamiento gestionado desde SEPA.
- Beneficios de traslado y albergue.
- Asistencia a talleres y uso de beneficios.
- Sesiones programadas/realizadas de quimioterapia y radioterapia.
- Adherencia a tratamiento hormonal.
- Motivos normalizados de barreras, abandono e interrupción clínica.

### Prioridad media: ampliar indicadores administrativos

El dashboard debe recibir nuevas consultas y DTOs para los indicadores
demográficos, epidemiológicos, de proceso, productividad, adherencia y abandono
del programa. La pantalla actual solo consume las categorías que entrega
`DashboardResponseDto`:

- Género.
- Diagnósticos actuales.
- Tratamientos actuales.
- Estadios actuales.
- Enrolamientos y sesiones de psicooncología.
- Hospitales, regiones y referencias.

Satisfacción y automatizaciones no forman parte de esta ampliación.

## 8. Archivos principales revisados

- `src/pages/enrolamiento/_components/steps/step-5-datos.tsx`
- `src/pages/enrolamiento/_components/steps/step-7-atencion.tsx`
- `src/pages/enrolamiento/_components/steps/step-8-cierre.tsx`
- `src/pages/enrolamiento/_components/steps/step-8-payload.ts`
- `src/pages/enrolamiento/_components/steps/step-8-payload.test.ts`
- `src/pages/enrolamiento/_store/enrollment-store.ts`
- `src/types/index.ts`
- `src/api/schema.d.ts`
- `src/pages/dashboard/page.tsx`
- `src/database/entities/patient.entity.ts`
- `src/database/entities/patient-details.entity.ts`
- `src/database/entities/patient-address.entity.ts`
- `src/database/entities/patient-insurance.entity.ts`
- `src/database/entities/patient-sis-affiliation.entity.ts`
- `src/database/entities/patient-diagnosis.entity.ts`
- `src/database/entities/patient-treatment.entity.ts`
- `src/database/entities/patient-medical-appointment.entity.ts`
- `src/database/entities/patient-symptom-report.entity.ts`
- `src/database/entities/follow-up.entity.ts`
- `src/database/entities/reminder.entity.ts`
- `src/database/entities/companion-patient.entity.ts`
- `src/modules/enrollments/dto/create-enrollment.dto.ts`
- `src/modules/enrollments/enrollments.service.ts`
- `src/modules/dashboard/dashboard.service.ts`
- `src/modules/dashboard/dto/dashboard-response.dto.ts`
- `src/integrations/n8n/n8n-webhook.events.ts`

## 9. Conclusión

El sistema actual tiene una base sólida para pacientes, enrolamientos,
seguimientos, historial clínico, seguros y citas. Sin embargo, la mayor parte
de la observación 23 está implementada solo como captura o almacenamiento, no
como indicador administrativo. 23.c queda fuera de alcance. La observación 24
está resuelta a nivel de tareas, no de pacientes, y su ampliación queda
postergada. La observación 25 requiere completar el formulario de signos y
síntomas y alinear el estado del front con el contrato backend antes de
considerarla atendida. El alcance y las decisiones de implementación se
encuentran en `specs/observaciones-crm-tercera-reunion.md`.
