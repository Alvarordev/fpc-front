# Spec: observaciones CRM de la tercera reunión

**Estado:** Propuesto
**Fecha:** 2026-08-27
**Fuente funcional:** `Observaciones CRM- tercera reunión-31-59.pdf`
**Auditoría técnica:** `AUDITORIA_OBSERVACIONES_REUNION_3.md`

## 1. Objetivo

Definir los cambios de producto, modelo, API y página necesarios para atender:

- Los indicadores SEPA de la observación 23, salvo automatización y
  satisfacción.
- Las correcciones del wizard de enrolamiento de pacientes con signos y
  síntomas de la observación 25.

Este spec será la fuente de verdad para implementar los cambios por fases en
`fpc-front` y `fpc-backend`.

## 2. Decisiones cerradas

1. Toda automatización queda fuera de alcance.
2. La observación 23.c queda completamente fuera de alcance, incluso para nueva
   captura o nuevos indicadores manuales de satisfacción.
3. La pregunta y calificación manual de satisfacción que ya existen permanecen
   sin cambios. Este trabajo no las elimina ni las amplía.
4. La observación 24, asignación de pacientes por analista, queda postergada
   hasta que el proceso sea definido con mayor precisión.
5. No se implementarán en este trabajo asignaciones a usuarios `FOUNDATION`,
   cambios de permisos, perfiles FPC ni migraciones de pacientes históricos.
6. Se corregirán todos los puntos 25.a a 25.r del wizard.
7. El contacto principal se resolverá después de conocer la fecha de nacimiento
   del paciente.
8. Un adulto podrá elegir si el contacto principal es el propio paciente o un
   acompañante.
9. Un menor de edad deberá tener obligatoriamente un acompañante como contacto
   principal.
10. Si quien realiza el enrolamiento es el acompañante, la página permitirá
    reutilizar los datos capturados en el paso 3 como contacto principal.
11. El contacto secundario será opcional.
12. No se creará un tercer contacto. Cada persona tendrá un teléfono principal y
    un teléfono adicional, que podrá ser un número fijo.
13. Un diagnóstico o tratamiento reportado en la rama de signos y síntomas será
    preliminar. No se crearán registros oncológicos formales hasta confirmar el
    cáncer.
14. El resultado de la búsqueda diagnóstica será independiente de la fase
    clínica y del estado activo/inactivo del paciente.
15. Los estados de búsqueda diagnóstica serán `SEARCHING`, `CONFIRMED` y
    `RULED_OUT`.
16. Los indicadores distinguirán eventos ocurridos en el período de la foto
    actual de la población.
17. Todos los indicadores incluidos se especificarán desde ahora, pero se
    implementarán por fases.

## 3. Fuera de alcance

- Envío de encuestas por WhatsApp.
- Encuestas automáticas después de tres meses.
- Encuestas automáticas de talleres, charlas o psicooncología.
- Llamadas automáticas o generación automática de tareas por falta de WhatsApp.
- Mensajería masiva.
- Nuevos eventos o flujos de n8n para encuestas.
- Cambios a la captura manual de satisfacción existente.
- Asignación actual o histórica de pacientes a analistas o usuarios FPC.
- Uso de una futura asignación como regla de acceso a pacientes.
- Eliminación física de correos, referencias de dirección o contactos de
  emergencia ya almacenados.

## 4. Principios de implementación

- No crear diagnósticos falsos ni IDs provisionales para poder guardar un
  tratamiento reportado.
- No reinterpretar datos históricos ambiguos como si hubieran sido capturados
  con las nuevas preguntas.
- Mantener separados los conceptos de paciente, llamante, cuidador y contacto.
- Usar campos estructurados para datos que alimentarán indicadores.
- Permitir texto libre solo para detalles y opciones “Otro”.
- Contar pacientes distintos, salvo cuando el indicador se denomine
  explícitamente evento, sesión o consulta.
- Mostrar cobertura y datos desconocidos junto con cada indicador.
- Usar intervalos de tiempo `[desde, hasta)` en la zona `America/Lima`.
- Los nuevos `<Select>` con códigos, enums o IDs deberán pasar `items` al
  `<Select>` raíz.
- El backend se implementará y desplegará antes que el front cuando cambie el
  contrato OpenAPI.

## 5. Correcciones del wizard

### 5.1 Punto 25.a: departamento de nacimiento

**Requisito:** añadir departamento de nacimiento.

**Decisión:** ya está implementado y se mantendrá.

- El paso 5 captura `details.birthDepartment`.
- El payload lo envía dentro de `details`.
- El backend lo almacena en `patient_details.birth_department`.

**Criterio de aceptación:** el valor seleccionado se conserva al finalizar el
enrolamiento y vuelve a mostrarse al editar o precargar al paciente.

### 5.2 Punto 25.b: ubicación web de residencia

**Requisito:** reemplazar “Referencia” por ubicación web de la residencia
actual.

**Cambios:**

- Añadir `locationUrl` nullable a `patient_addresses`.
- Aceptar únicamente URL `http` o `https` válida.
- Reemplazar visualmente “Referencia” por “Ubicación web de la residencia”.
- Mostrar una acción “Abrir ubicación” cuando exista una URL válida.
- Aplicar el mismo campo a la vivienda permanente y a la provisional.
- Mantener `reference` en la base de datos para registros históricos, pero dejar
  de capturarlo en el wizard.

**Criterio de aceptación:** una URL pegada en el wizard llega al backend, se
recupera en la ficha y puede abrirse en una pestaña nueva.

### 5.3 Puntos 25.c a 25.f: contactos principal y secundario

**Requisitos:**

- Nombre y parentesco del contacto principal.
- Nombre y parentesco del contacto secundario.
- El contacto secundario no es obligatorio.

#### Conceptos

| Concepto            | Definición                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Paciente            | Persona que recibe el acompañamiento de SEPA. Sus teléfonos se guardan siempre.                           |
| Llamante            | Persona que realiza la llamada de enrolamiento. Puede ser el paciente o un acompañante.                   |
| Contacto principal  | Persona a quien se contactará primero para el seguimiento. Puede ser el paciente adulto o un acompañante. |
| Contacto secundario | Acompañante opcional para contacto alternativo.                                                           |
| Cuidador            | Rol asistencial de un acompañante. Puede coincidir o no con el contacto principal.                        |

#### Flujo del paso 3

- Mantener el paso 3 como captura de la persona que realiza la llamada.
- Cuando el enrolamiento es para un tercero, guardar al llamante como
  acompañante con nombre, parentesco, DNI opcional, fecha de nacimiento
  opcional, género, teléfono principal, teléfono adicional y WhatsApp.
- Quitar el correo electrónico del paso 3.
- No marcar al llamante automáticamente como contacto principal hasta resolver
  esa decisión en el paso 5.

#### Flujo del paso 5

Después de capturar la fecha de nacimiento del paciente, mostrar la sección
“Contacto para seguimiento”.

Para un adulto:

- Preguntar “¿Quién será el contacto principal?”.
- Permitir “El paciente” o “Un acompañante”.
- Si el llamante ya fue capturado como acompañante, ofrecer “Usar los datos del
  llamante”.
- Permitir registrar otra persona si el acompañante principal no es el llamante.

Para un menor:

- Seleccionar obligatoriamente “Un acompañante”.
- Si ya existe un llamante acompañante, preseleccionar la reutilización de sus
  datos.
- Impedir finalizar el enrolamiento sin nombre, parentesco y teléfono del
  contacto principal.

Para el contacto secundario:

- Preguntar “¿Desea registrar un contacto secundario?”.
- Si responde sí, exigir nombre, parentesco y teléfono principal.
- Permitir teléfono adicional y WhatsApp.

#### Modelo de contactos

Reutilizar `patients` con rol `COMPANION` y la relación `companion_patient`.

Añadir a la relación un rol de contacto nullable:

```text
contact_role: PRIMARY | SECONDARY | null
```

Reglas:

- Solo puede existir un acompañante `PRIMARY` por paciente.
- Solo puede existir un acompañante `SECONDARY` por paciente.
- Si el paciente adulto es su propio contacto principal, no se crea una relación
  consigo mismo y no existe acompañante `PRIMARY`.
- `null` se reserva para acompañantes que son cuidadores o informantes, pero no
  contactos de seguimiento.
- Los registros existentes con `isPrimaryContact=true` se migrarán a
  `contactRole=PRIMARY`.
- La respuesta API podrá conservar temporalmente `isPrimaryContact` derivado de
  `contactRole` mientras se actualizan todos los consumidores.

#### Contrato de enrolamiento

El llamante y los contactos deben ser conceptos distintos en el payload.

```ts
type EnrollmentContactSource = "PATIENT" | "CALLER" | "NEW"
type EnrollmentContactRole = "PRIMARY" | "SECONDARY"

interface EnrollmentContactInput {
  role: EnrollmentContactRole
  source: EnrollmentContactSource
  person?: CreateCompanionInput
}
```

Reglas del contrato:

- `source=PATIENT` solo se permite para `PRIMARY` y pacientes adultos.
- `source=CALLER` exige que el payload incluya un acompañante llamante.
- `source=NEW` exige `person` con nombre, parentesco y teléfono.
- El payload debe tener exactamente un contacto `PRIMARY`.
- Puede tener cero o un contacto `SECONDARY`.
- La creación del paciente, llamante, contactos y relaciones ocurre dentro de la
  transacción de enrolamiento.

### 5.4 Punto 25.g: quitar correo

**Cambios:**

- Quitar correo del paciente en el paso 5.
- Quitar correo del acompañante en el paso 3.
- No enviar correo al crear nuevas personas desde el wizard.
- Mantener `patients.email` para datos históricos y otros flujos que aún lo
  utilicen.
- No borrar correos existentes.

**Criterio de aceptación:** el wizard no muestra ni exige correo en ninguna rama.

### 5.5 Punto 25.h: teléfono adicional

**Decisión:** no se creará un tercer contacto.

**Cambios:**

- Renombrar visualmente `secondaryPhone` a “Teléfono adicional o fijo”.
- Mantener teléfono principal obligatorio para el paciente y para cada contacto.
- Mantener los campos legacy `emergencyContact*` en base de datos, pero no
  mostrarlos ni enviarlos desde el wizard.
- No convertir automáticamente contactos de emergencia históricos en
  acompañantes.

### 5.6 Punto 25.i: quitar fecha de inicio del seguro

**Cambios:**

- Quitar “Fecha de inicio del seguro” del paso 5.
- Mantener `startDate` en `patient_insurance` y en el formulario de seguimiento.
- Si un prospecto ya tiene un seguro vigente con fecha conocida, evitar cerrar y
  recrear innecesariamente ese seguro durante el enrolamiento.

**Criterio de aceptación:** un enrolamiento nuevo no solicita la fecha y un
prospecto no pierde una fecha previamente almacenada.

### 5.7 Puntos 25.j y 25.r: malestar, motivación, duración y frecuencia

Orden obligatorio del bloque:

1. “¿Presenta algún malestar o dolor?”.
2. “¿Desde hace cuánto tiempo presenta síntomas?”.
3. “¿Cada cuánto presenta los síntomas?”.
4. Descripción de signos y síntomas.
5. Si no presenta malestar o dolor: “¿Qué lo motivó a realizarse su examen
   médico?”.

Añadir a `patient_symptom_reports`:

```text
checkup_motivation text nullable
```

Regla:

- `hasDiscomfort=false` exige `checkupMotivation`.
- Al cambiar de “No” a “Sí”, el payload no debe enviar una motivación oculta.

### 5.8 Puntos 25.k, 25.l y 25.q: consulta médica

El flujo actual mezcla solicitar, programar y asistir a una consulta. Se
reemplazará por preguntas separadas.

#### Preguntas

1. “¿Actualmente ha solicitado una consulta médica?”.
2. Si respondió sí: “¿Cuál es el estado de la consulta?”.
3. Estados: “No obtuvo consulta”, “Consulta programada” y “Consulta atendida”.
4. Si no obtuvo consulta: registrar motivo.
5. Si está programada o atendida: preguntar primero establecimiento y luego
   especialidad.
6. Si fue atendida: registrar fecha de primera consulta.
7. Si está programada: registrar fecha programada.
8. Registrar indicaciones recibidas cuando corresponda.

#### Modelo

Añadir a `patient_symptom_reports`:

```text
has_requested_medical_consultation boolean nullable
consultation_status NOT_OBTAINED | SCHEDULED | ATTENDED | null
consultation_not_obtained_reason text nullable
```

Reutilizar:

- `patient_symptom_reports.health_center_id` para el establecimiento consultado.
- `patient_symptom_reports.specialty` para la especialidad.
- `patient_symptom_reports.indications_received` para indicaciones.
- `patient_medical_appointments.appointment_date` para la consulta programada o
  la primera consulta atendida.
- `patient_medical_appointments.is_first_consultation=true` cuando fue la
  primera consulta atendida.

El campo legacy `hasSoughtMedicalConsultation` no se usará como fuente de verdad
para las nuevas respuestas porque sus valores históricos no distinguen solicitud
de asistencia.

#### Validaciones

- Si no solicitó consulta, no se crea una cita.
- `NOT_OBTAINED` exige un motivo y no permite fecha de cita.
- `SCHEDULED` exige establecimiento, especialidad y fecha programada.
- `ATTENDED` exige establecimiento, especialidad y fecha de primera consulta.

### 5.9 Punto 25.m: tiempo buscando diagnóstico

Añadir a `patient_symptom_reports` una duración estructurada:

```text
diagnosis_search_duration_value_min numeric nullable
diagnosis_search_duration_value_max numeric nullable
diagnosis_search_duration_unit varchar nullable
diagnosis_search_duration_label varchar nullable
```

En código se representará con el `DurationDto` existente.

No reutilizar:

- `symptomDuration`, porque mide duración de síntomas.
- `waitTimeForDiagnosis`, porque pertenece a un diagnóstico ya registrado.

### 5.10 Punto 25.n: hoja de referencia

Preguntar cuando la consulta fue atendida:

- “¿Le han brindado una hoja de referencia?”.
- Si responde sí: “¿A dónde lo han referido?”.
- Si responde no: “¿Cuál es el motivo por el que no le brindaron la hoja de
  referencia?”.

Reutilizar:

- `patient_medical_appointments.has_referral_sheet`.
- `patient_medical_appointments.referred_to`.

Añadir:

```text
patient_medical_appointments.referral_not_provided_reason text nullable
```

Validaciones:

- `hasReferralSheet=true` exige `referredTo` y limpia el motivo negativo.
- `hasReferralSheet=false` exige `referralNotProvidedReason` y limpia el destino.
- Los valores históricos `false` no se reinterpretarán como respuestas
  confirmadas a la nueva pregunta.

### 5.11 Punto 25.o: diagnóstico informado y siguiente consulta

Añadir a `patient_symptom_reports`:

```text
has_received_diagnosis boolean nullable
reported_diagnosis text nullable
```

Reutilizar `patient_medical_appointments.next_appointment_date` para la próxima
consulta.

Reglas:

- `hasReceivedDiagnosis=true` exige `reportedDiagnosis`.
- El diagnóstico informado se muestra como preliminar.
- No se crea `PatientDiagnosis` desde este campo.
- Si durante un seguimiento se confirma cáncer, se utiliza la transición
  diagnóstica descrita en la sección 7.

### 5.12 Punto 25.p: tratamiento informado

Añadir a `patient_symptom_reports`:

```text
is_receiving_reported_treatment boolean nullable
reported_treatment text nullable
reported_treatment_frequency_* Duration nullable
not_receiving_treatment_reason text nullable
```

Reglas:

- Si recibe tratamiento, exigir descripción y frecuencia.
- Si no recibe tratamiento, exigir motivo.
- No crear `PatientTreatment` porque todavía no existe un diagnóstico oncológico
  formal al cual asociarlo.
- Al cambiar la respuesta, limpiar del payload los campos de la rama oculta.

### 5.13 Flujo final del paso 7 para signos y síntomas

El orden final será:

1. Malestar o dolor.
2. Duración de síntomas.
3. Frecuencia de síntomas.
4. Descripción de signos y síntomas.
5. Motivación del examen cuando no hay malestar.
6. Solicitud de consulta médica.
7. Estado y motivo de la consulta.
8. Establecimiento.
9. Especialidad.
10. Fecha de primera consulta o consulta programada.
11. Indicaciones recibidas.
12. Hoja de referencia, destino o motivo.
13. Tiempo esperando o buscando diagnóstico.
14. Diagnóstico informado.
15. Próxima consulta.
16. Tratamiento informado, frecuencia o motivo de no recibirlo.

## 6. Estado de búsqueda diagnóstica

### 6.1 Objetivo

Medir por separado pacientes con signos y síntomas que siguen buscando
diagnóstico, confirmaron cáncer o descartaron enfermedad oncológica.

### 6.2 Modelo

Crear una entidad de eventos diagnósticos:

```text
patient_diagnostic_status_events
- id uuid PK
- patient_id uuid FK patients
- follow_up_id uuid nullable FK follow_ups
- status SEARCHING | CONFIRMED | RULED_OUT
- occurred_at timestamptz
- reported_diagnosis text nullable
- diagnosis_id uuid nullable FK patient_diagnoses
- supported_by_sepa boolean nullable
- notes text nullable
- created_at timestamptz
```

Reglas:

- El estado actual se obtiene del evento más reciente.
- Un enrolamiento en signos y síntomas crea un evento `SEARCHING`.
- `CONFIRMED` exige un diagnóstico oncológico formal y puede referenciarlo.
- `RULED_OUT` no crea un diagnóstico oncológico formal.
- `supportedBySepa` responde expresamente si el resultado se obtuvo a partir del
  soporte del programa.
- La fase clínica y la actividad del paciente no se utilizarán para representar
  este estado.

### 6.3 Transición a cáncer confirmado

La confirmación se realizará con una operación transaccional backend que:

1. Cree el diagnóstico formal.
2. Registre fecha, establecimiento, especialidad y estadio cuando estén
   disponibles.
3. Cambie la fase clínica a `CANCER_DIAGNOSIS`.
4. Inserte el evento `CONFIRMED`.
5. Vincule el evento con el diagnóstico creado.

## 7. Indicadores incluidos

### 7.1 Semántica temporal

Los indicadores se dividirán en dos grupos visibles.

#### Foto actual

Describe cómo se encuentra actualmente la población:

- Demografía.
- Residencia.
- Seguro actual.
- Diagnóstico actual.
- Estadio actual.
- Situación actual del tratamiento.
- Estado actual de búsqueda diagnóstica.

La página deberá etiquetar estas visualizaciones como “Estado actual”. No se
presentarán como una reconstrucción histórica mientras no exista historial
suficiente de todos sus atributos.

#### Eventos del período

Cuenta hechos por su fecha efectiva:

- Fallecimientos.
- Confirmaciones y descartes diagnósticos.
- Afiliaciones.
- Consultas y referencias logradas.
- Tratamientos iniciados o culminados.
- Acceso a beneficios.
- Abandono e interrupción.

Ejemplo obligatorio: si un paciente se enroló en enero y falleció en agosto, el
fallecimiento pertenece a agosto.

### 7.2 Reglas comunes

- El filtro utilizará mes, año o rango de fechas.
- Todos los cálculos usarán `America/Lima`.
- Cada respuesta incluirá `known`, `unknown` y `coveragePct` cuando el indicador
  dependa de datos opcionales.
- Las duraciones incluirán promedio, mediana, cantidad de casos válidos y
  cobertura.
- Las distribuciones incluirán “Sin información”.
- Los cruces de región usarán exclusivamente la dirección primaria activa.
- No sustituir residencia por ubicación del hospital ni departamento de
  nacimiento.
- No mezclar abandono del programa con abandono de tratamiento.

## 8. Indicadores demográficos, observación 23.a

| Indicador           | Fuente                           | Cambio necesario                                                                        |
| ------------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| Edad                | `patients.birthDate`             | Calcular edad actual o a la fecha final seleccionada y agrupar por rangos documentados. |
| Sexo                | `patients.gender`                | Mantener distribución actual y normalizar etiquetas.                                    |
| Distrito actual     | Dirección primaria activa        | Nueva distribución y cobertura.                                                         |
| Provincia actual    | Dirección primaria activa        | Nueva distribución y cobertura.                                                         |
| Departamento actual | Dirección primaria activa        | Corregir la consulta actual para no priorizar hospitales.                               |
| Zonificación        | `patient_details.zoneType`       | Nueva distribución urbana/rural.                                                        |
| Grado instructivo   | `patient_details.educationLevel` | Nueva distribución.                                                                     |
| Lengua originaria   | `patient_details.nativeLanguage` | Nueva distribución y porcentaje que requiere traducción.                                |
| Seguro              | Seguro vigente                   | Distribución por tipo y proveedor EPS cuando corresponda.                               |
| Estatus laboral     | `patient_details.isWorking`      | Añadir la pregunta al primer contacto y exponer la distribución.                        |

El estatus laboral se añadirá al perfil socioeducativo del paso 5 para que se
capture durante el enrolamiento.

## 9. Indicadores epidemiológicos, observación 23.b

### 9.1 Datos existentes aprovechables

- Fallecimiento y fecha de fallecimiento.
- Diagnóstico actual.
- Estadio actual.
- Situación del tratamiento.
- Fase clínica.

### 9.2 Normalización del tipo de tratamiento

El texto libre actual no permite indicadores confiables. Añadir una categoría
estructurada manteniendo descripción libre para detalles.

```text
CHEMOTHERAPY
RADIOTHERAPY
BRACHYTHERAPY
HORMONAL
SURGERY
PAIN_MANAGEMENT
BIOLOGICAL
TARGETED
RADIOIODINE
PHOTOTHERAPY
EARLY_CONCURRENT_PALLIATIVE
PALLIATIVE_WITHOUT_ACTIVE_TREATMENT
MEDICATION
ALTERNATIVE
OTHER
```

La opción `OTHER` exigirá una descripción.

`EARLY_CONCURRENT_PALLIATIVE` no marcará al paciente como tratamiento
interrumpido. `PALLIATIVE_WITHOUT_ACTIVE_TREATMENT` representará fin de terapia
activa con atención orientada al confort.

### 9.3 Indicadores

- Fallecimientos ocurridos en el período.
- Casos por tipo de cáncer.
- Matriz tipo de cáncer por departamento de residencia actual.
- Matriz tipo de cáncer por estadio.
- Casos en remisión.
- Casos en paliativo temprano/simultáneo.
- Casos en paliativo sin tratamiento activo.
- Casos en espera: `PENDIENTE_DE_INICIO`.
- Casos en búsqueda: `SEARCHING`.
- Casos activos: `EN_CURSO`.
- Casos culminados: `FINALIZADO`.
- Casos suspendidos: `INTERRUMPIDO`.

## 10. Indicadores de gestión, observación 23.d

### 10.1 Afiliación SIS y EsSalud

- Mantener `patient_sis_affiliation.affiliatedViaSepa` para SIS.
- Añadir `affiliatedViaSepa` al historial general de seguro para registrar
  activación de EsSalud con soporte de SEPA.
- En seguimiento, mostrar la pregunta correspondiente al seguro actual.
- No mostrar una pregunta de afiliación SIS cuando el seguro seleccionado sea
  EsSalud.

Indicadores:

- Personas afiliadas al SIS por soporte de SEPA durante el período.
- Personas que activaron EsSalud por soporte de SEPA durante el período.

### 10.2 Consulta primaria

Añadir a la cita o evento de consulta:

```text
attended_via_sepa_support boolean nullable
```

Indicadores:

- Personas que asistieron a su primera consulta de atención primaria a partir
  del soporte de SEPA.
- Personas atendidas por especialidad para diagnóstico oncológico.

### 10.3 Referencia de mayor complejidad

Añadir:

```text
referred_via_sepa_support boolean nullable
```

Indicador:

- Personas referidas a un establecimiento de mayor complejidad por soporte de
  SEPA.

### 10.4 Resultado diagnóstico

Usar `patient_diagnostic_status_events`.

Indicadores:

- Personas con cáncer descartado y `supportedBySepa=true`.
- Personas con cáncer confirmado y `supportedBySepa=true`.

### 10.5 Acceso a tratamiento

Añadir a `patient_treatments`:

```text
accessed_via_sepa_support boolean nullable
```

Indicador:

- Personas que accedieron al tratamiento contra el cáncer por soporte de SEPA.

### 10.6 Beneficio de traslado y albergue

Crear registros estructurados de beneficios:

```text
patient_benefit_accesses
- id uuid PK
- patient_id uuid FK patients
- follow_up_id uuid nullable FK follow_ups
- benefit_type TRANSPORT | LODGING | EDUCATIONAL_TALK
- provider_code varchar nullable
- other_provider text nullable
- accessed boolean
- occurred_at timestamptz
- supported_by_sepa boolean nullable
- notes text nullable
- created_at timestamptz
```

Proveedores de traslado:

- `CRUZ_DEL_SUR`
- `LATAM_SOLIDARIO`
- `OTHER`

Proveedores de albergue:

- `FRIEDA_HELLER_FPC`
- `CASA_MAGIA`
- `RONALD_MCDONALD`
- `INSPIRA`
- `ALINEN`
- `OTHER`

Indicadores:

- Personas que accedieron a traslado gestionado por SEPA.
- Personas que accedieron a albergue por orientación de SEPA.
- Distribución por proveedor.

## 11. Indicadores de productividad, observación 23.e

### 11.1 Duraciones

| Indicador                        | Fecha inicial                                        | Fecha final                                    |
| -------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| Enrolamiento a afiliación SIS    | `enrollments.createdAt`                              | `patient_sis_affiliation.affiliatedAt`         |
| Primera consulta a diagnóstico   | Primera cita atendida con `isFirstConsultation=true` | `patient_diagnoses.diagnosisDate`              |
| Diagnóstico a primer tratamiento | `patient_diagnoses.diagnosisDate`                    | Primer `patient_treatments.startDate` asociado |

Cada resultado incluirá:

- Promedio en días.
- Mediana en días.
- Cantidad de pacientes con ambas fechas.
- Porcentaje de cobertura.

### 11.2 Continuidad en el programa

El indicador utilizará únicamente:

- `ACTIVE`
- `INACTIVE`
- `REACTIVE`

No utilizará `affiliationType`, rol de acompañante ni estado de tratamiento para
definir continuidad.

### 11.3 Uso de beneficios

Indicadores:

- Personas con al menos un seguimiento u orientación completada.
- Personas con al menos una sesión de psicooncología completada.
- Personas con asistencia registrada a charla o taller.
- Personas que utilizaron los tres grupos de beneficios.

La asistencia a charlas se registrará como `patient_benefit_accesses` con tipo
`EDUCATIONAL_TALK`; el interés registrado durante el enrolamiento no contará
como asistencia.

## 12. Indicadores de adherencia, observación 23.f

### 12.1 Sesiones de quimioterapia y radioterapia

Crear una entidad de sesiones de tratamiento:

```text
patient_treatment_sessions
- id uuid PK
- patient_id uuid FK patients
- treatment_id uuid FK patient_treatments
- scheduled_date date
- status SCHEDULED | COMPLETED | MISSED | CANCELLED
- completed_date date nullable
- missed_reason_code varchar nullable
- missed_reason_detail text nullable
- follow_up_id uuid nullable FK follow_ups
- created_at timestamptz
```

Fórmula mensual:

```text
sesiones completadas / sesiones programadas * 100
```

Aplica a categorías `CHEMOTHERAPY` y `RADIOTHERAPY`.

### 12.2 Tratamiento hormonal

Crear una evaluación periódica:

```text
patient_hormonal_adherence_assessments
- id uuid PK
- patient_id uuid FK patients
- treatment_id uuid FK patient_treatments
- period_start date
- period_end date
- complied boolean
- reason text nullable
- follow_up_id uuid FK follow_ups
- created_at timestamptz
```

Fórmula:

```text
pacientes que cumplieron / pacientes evaluados con tratamiento hormonal * 100
```

### 12.3 Barreras para iniciar o continuar tratamiento

Crear eventos de barrera:

```text
patient_treatment_barriers
- id uuid PK
- patient_id uuid FK patients
- treatment_id uuid nullable FK patient_treatments
- stage INITIATION | CONTINUATION | APPOINTMENT_OR_CONTROL
- reason_code varchar
- other_reason text nullable
- orientation_provided boolean
- occurred_at timestamptz
- follow_up_id uuid FK follow_ups
- created_at timestamptz
```

Catálogo inicial:

- `TRANSPORT`
- `LODGING`
- `ALTERNATIVE_MEDICINE`
- `EXCESSIVE_COST`
- `PATIENT_DECISION`
- `SUPPLY_SHORTAGE`
- `INFUSION_ROOM_UNAVAILABLE`
- `PATIENT_OVERLOAD`
- `OTHER`

Indicadores:

- Pacientes con barreras identificadas sobre pacientes enrolados.
- Pacientes orientados ante barreras sobre pacientes con barreras.
- Abandono de tratamiento, citas o controles por barreras.

### 12.4 Interrupción clínica

Cuando `treatmentSituation=INTERRUMPIDO`, exigir un motivo estructurado:

- `ADVERSE_REACTION_OR_TOXICITY`
- `THERAPEUTIC_OPTION_EVALUATION`
- `OTHER`

`OTHER` exigirá detalle.

El paliativo sin tratamiento activo se obtendrá de la categoría de tratamiento,
no del motivo de interrupción.

## 13. Abandono del programa, observación 23.g

El abandono del programa no es abandono del tratamiento.

Crear historial de actividad del programa para no perder eventos cuando un
paciente sea reactivado:

```text
patient_program_status_events
- id uuid PK
- patient_id uuid FK patients
- status ACTIVE | INACTIVE | REACTIVE
- reason_code DECEASED | WITHDREW_CONSENT | LOST_CONTACT | TRANSFERRED_OUT | OTHER | null
- reason_detail text nullable
- occurred_at timestamptz
- changed_by_user_id uuid FK users
- created_at timestamptz
```

Reglas:

- Desactivar o reactivar un paciente inserta un evento.
- `patients.activityStatus` permanece como lectura rápida del estado actual.
- El dashboard obtiene abandonos y reactivaciones desde los eventos.
- Fallecimiento se cuenta por la fecha efectiva del evento o `deceasedAt`.
- `OTHER` exige detalle.

Indicadores:

- Bajas voluntarias.
- Personas no ubicables.
- Fallecimientos.
- Transferencias fuera del programa.
- Otros motivos.
- Reactivaciones.

## 14. API de indicadores

Mantener `GET /dashboard` durante la migración y añadir endpoints por sección:

```text
GET /dashboard/indicators/demographics
GET /dashboard/indicators/epidemiology
GET /dashboard/indicators/management
GET /dashboard/indicators/productivity
GET /dashboard/indicators/adherence
GET /dashboard/indicators/program-status
```

Parámetros comunes para eventos:

```text
from=YYYY-MM-DD
to=YYYY-MM-DD
timezone=America/Lima
```

Estructura común de respuesta:

```ts
interface IndicatorMeta {
  from: string
  to: string
  timezone: "America/Lima"
  definition: string
  population: string
}

interface DataQuality {
  known: number
  unknown: number
  coveragePct: number
}
```

Cada endpoint podrá devolver tarjetas, distribuciones, series o matrices, pero
deberá incluir definición, población y calidad de datos.

## 15. Página de indicadores

La página administrativa tendrá secciones cargadas de forma independiente:

- Resumen.
- Demografía actual.
- Epidemiología.
- Gestión y productividad.
- Adherencia.
- Abandono del programa.

No tendrá una sección nueva de satisfacción.

Componentes previstos:

- Tarjetas para totales, tasas y promedios.
- Barras para distribuciones demográficas y especialidades.
- Matriz para cáncer por región.
- Matriz para cáncer por estadio.
- Series temporales para eventos.
- Tablas para beneficios, barreras y motivos.
- Cobertura visible debajo de cada indicador.

El filtro de período afectará eventos y duraciones. Las distribuciones que sean
una foto actual deberán mostrar explícitamente “Estado actual” y no aparentar
una reconstrucción histórica.

## 16. Fases de implementación

### Fase 1: correcciones del wizard

- Ubicación web.
- Contactos principal y secundario.
- Reutilización del llamante.
- Regla obligatoria para menores.
- Quitar correos y fecha de seguro.
- Teléfono adicional o fijo.
- Nuevo flujo de signos y síntomas.
- Datos preliminares de diagnóstico y tratamiento.
- Estado inicial `SEARCHING`.
- Pruebas unitarias y e2e del enrolamiento.

### Fase 2: indicadores con datos disponibles

- Demografía.
- Residencia actual corregida.
- Diagnósticos y estadios.
- Situaciones actuales de tratamiento.
- Mortalidad por fecha efectiva.
- Estado de búsqueda diagnóstica.
- Calidad y cobertura de datos.

### Fase 3: gestión y productividad

- Afiliación SIS y EsSalud desde SEPA.
- Primera consulta desde SEPA.
- Referencia desde SEPA.
- Confirmación y descarte desde SEPA.
- Tratamiento desde SEPA.
- Traslado y albergue.
- Duraciones promedio y mediana.
- Asistencia a charlas y uso de beneficios.

### Fase 4: adherencia y barreras

- Sesiones de quimioterapia y radioterapia.
- Evaluación hormonal.
- Barreras de inicio y continuidad.
- Orientación ante barreras.
- Motivos de abandono e interrupción clínica.

### Fase 5: abandono del programa

- Historial de estados del programa.
- Migración del estado actual.
- Indicadores por motivo y fecha efectiva.
- Reactivaciones sin pérdida del historial previo.

## 17. Migración y compatibilidad

- Las migraciones serán aditivas antes de retirar campos de respuestas API.
- `reference`, `email` y `emergencyContact*` no se borrarán.
- No se inferirá `locationUrl` desde referencias históricas.
- No se convertirán contactos de emergencia en acompañantes.
- Los contactos primarios existentes se migrarán a `contactRole=PRIMARY`.
- Otros acompañantes históricos quedarán con `contactRole=null` hasta revisión
  manual.
- Los valores históricos de `hasReferralSheet=false` no se usarán como evidencia
  de que la nueva pregunta fue respondida.
- Los valores históricos de `hasSoughtMedicalConsultation` no se usarán para
  distinguir consulta solicitada, programada o atendida.
- Los borradores persistidos de Zustand se normalizarán para evitar pérdida de
  enrolamientos en curso.
- Al cambiar respuestas condicionales, el estado y el payload limpiarán campos
  que hayan quedado ocultos.

## 18. Secuencia técnica de entrega

1. Crear migraciones y entidades backend.
2. Extender DTOs, validaciones, servicios y respuestas.
3. Añadir pruebas backend.
4. Regenerar `src/api/schema.d.ts` desde OpenAPI.
5. Migrar el store persistido del wizard.
6. Actualizar pasos 3, 5, 7 y construcción del payload.
7. Actualizar ficha del paciente y formularios de seguimiento.
8. Añadir pruebas del payload y componentes.
9. Implementar endpoints de indicadores por fase.
10. Implementar las secciones administrativas correspondientes.

## 19. Verificación mínima

### Backend

- Migraciones `up` y `down` verificadas.
- Validaciones condicionales de contactos, consulta, referencia, diagnóstico y
  tratamiento preliminar.
- Transacción de enrolamiento con reutilización del llamante.
- Transición transaccional `SEARCHING -> CONFIRMED`.
- Transición `SEARCHING -> RULED_OUT`.
- Pruebas de conteos con pacientes distintos.
- Pruebas de límites temporales en `America/Lima`.

### Front

- Adulto con paciente como contacto principal.
- Adulto con acompañante nuevo como contacto principal.
- Adulto que reutiliza al llamante.
- Menor con acompañante principal obligatorio.
- Contacto secundario omitido y registrado.
- Teléfono fijo opcional.
- URL válida e inválida de ubicación.
- Todas las ramas condicionales de signos y síntomas.
- Limpieza de campos ocultos.
- Precarga de prospecto sin pérdida de fecha histórica del seguro.
- Renderizado inicial correcto de todos los selects con IDs o enums.

### Comandos esperados

```bash
# Backend
pnpm lint
pnpm test
pnpm test:e2e

# Front
pnpm lint
pnpm test:run
pnpm build
```

## 20. Criterios globales de aceptación

- El wizard captura todos los datos solicitados en 25.a a 25.r.
- Un menor no puede enrolarse sin acompañante principal.
- Los datos del llamante pueden reutilizarse sin volver a escribirlos.
- El paciente conserva sus propios teléfonos aunque el contacto principal sea un
  acompañante.
- El contacto secundario es opcional.
- No se solicita correo ni fecha de inicio del seguro.
- El diagnóstico y tratamiento preliminares no crean historial oncológico
  formal.
- Los resultados `CONFIRMED` y `RULED_OUT` pueden medirse por fecha efectiva.
- Un fallecimiento se atribuye al período en que ocurrió.
- Cada indicador muestra su definición, población y cobertura.
- No se implementa ni modifica ninguna automatización o encuesta.
- No se implementa asignación de pacientes a analistas o perfiles FPC.
