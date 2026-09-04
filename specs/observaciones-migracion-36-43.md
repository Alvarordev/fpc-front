# Spec: observaciones de migración 36-43

**Estado:** En implementación
**Fecha:** 2026-09-03
**Fuente funcional:** observaciones de migración de pacientes
**Repositorios:** `fpc-front` y `fpc-backend`

Este documento define los cambios acordados para la ruta administrativa
`/carga-historica` y para las preguntas equivalentes del enrolamiento de
pacientes con diagnóstico. La observación 44 queda fuera de alcance por falta
de detalle funcional.

## 1. Alcance

Se modificarán:

- El enrolamiento histórico en `/carga-historica/nuevo`.
- El enrolamiento operativo de pacientes con diagnóstico cuando la pregunta sea
  compartida por el wizard.
- El contrato y persistencia necesarios para conservar las respuestas.
- La experiencia de borrador, navegación y reinicio de la carga histórica.

No se modificarán las reglas de fechas históricas de los formularios
operativos ni se implementará la observación 44.

## 2. Contactos y teléfono del paciente

La sección independiente `Contacto del paciente` se eliminará. Sus datos se
integrarán en `Contacto para seguimiento`:

- Al seleccionar `El paciente` como contacto principal se mostrarán teléfono
  principal, teléfono adicional y WhatsApp del paciente.
- El contacto secundario seguirá disponible aunque el paciente sea el contacto
  principal.
- Si se selecciona un familiar, cuidador o nuevo contacto como principal, se
  mostrarán y validarán los datos de esa persona.

En una carga histórica el teléfono del paciente puede ser desconocido:

- `patients.primary_phone` será nullable en base de datos.
- El `CreatePatientDto` operativo conservará el teléfono obligatorio.
- El DTO de paciente anidado del endpoint histórico permitirá omitirlo.
- Si el paciente es seleccionado como contacto principal, el frontend exigirá
  teléfono antes de guardar.
- Las superficies que muestran o envían teléfono aceptarán `null` y usarán una
  representación vacía o `Sin teléfono registrado` cuando corresponda.

## 3. Datos desconocidos

### 3.1 Departamento de nacimiento

El selector histórico tendrá la opción `No menciona`. Esta opción representa un
valor nulo, no un departamento nuevo:

- El frontend usará un sentinel visual y lo convertirá a `undefined`/`NULL` en
  el payload.
- La lista compartida de departamentos para hospitales y direcciones no se
  modificará.

### 3.2 Fecha de primeros síntomas

En diagnósticos históricos se mostrará la pregunta `¿No recuerda la fecha de
los primeros síntomas?`:

- Al activarla se ocultará la fecha y se almacenará `firstSymptomsDate = NULL`.
- Al desactivarla se volverá a mostrar el input de fecha vacío.
- El tiempo de espera para el diagnóstico podrá ingresarse manualmente aunque
  la fecha sea desconocida.
- No se enviará el texto `NO RECUERDA` en un campo de tipo fecha.

## 4. Borrador histórico

El borrador de `/carga-historica/nuevo` se conservará en el store persistido al
navegar a otra ruta, incluido `/hospitales`.

- Montar nuevamente la ruta no podrá ejecutar un reset implícito.
- La acción `Nuevo paciente histórico` iniciará explícitamente un borrador
  vacío.
- La pantalla tendrá un botón `Reiniciar formulario`.
- El reinicio solicitará confirmación y limpiará draft, categoría, estado de
  envío y resultado histórico.
- Crear un hospital desde el formulario invalidará la lista y, si es posible,
  seleccionará automáticamente el centro recién creado.

## 5. Ruta de atención después del diagnóstico

Antes de `Consultas médicas`, para la rama de diagnóstico, se capturarán:

1. `Luego de su atención en el centro donde fue diagnosticado, ¿a qué centro de
   salud fue derivado?`
2. `¿Cuenta con referencia a los centros de salud mencionados?`

La primera respuesta será un selector de centros de salud con botón para crear
un hospital. La segunda será una respuesta Sí/No.

Estos datos pertenecen al diagnóstico y requieren:

- `referredHealthCenterId` nullable, con relación a `health_centers`.
- `hasReferral` nullable.
- DTOs de creación/actualización y respuestas OpenAPI.
- Validación de que el centro derivado exista y que pertenezca al contexto
  válido.
- Inclusión en el payload del enrolamiento y en el flujo histórico.

No se reutilizará `isSepaActiveReferral`, porque representa otra pregunta.

## 6. Consultas médicas

Después de `¿Actualmente asiste a sus consultas médicas?`, cuando la respuesta
sea Sí, se mostrará:

- `¿En qué establecimiento de salud?`
- Un `Select` de establecimientos.
- Un botón `+` que reutiliza `CreateHealthCenterDialog`.

El valor se persistirá en `medicalAppointments[].healthCenterId` y será
obligatorio cuando el paciente indique que asiste.

Cuando la respuesta sea No, se mostrará:

- `Notas sobre la no asistencia a consultas médicas`.

La nota se almacenará a nivel de enrolamiento como
`notAttendingConsultationsNote`, será opcional mientras la respuesta sea Sí y
se limpiará al cambiar a Sí.

## 7. Tratamiento actual

En la rama de diagnóstico se añadirá:

`Actualmente, ¿está recibiendo algún tratamiento médico?`

- La respuesta será Sí/No.
- Con Sí se conserva la lista opcional de tratamientos detallados.
- Con No se habilita y exige `¿Cuál es el motivo?`.
- El estado se almacenará como `currentlyReceivingTreatment` a nivel de
  enrolamiento.
- El motivo se almacenará como `notReceivingTreatmentReason` a nivel de
  enrolamiento.
- Cambiar de No a Sí limpia el motivo; cambiar de Sí a No vuelve a mostrarlo.
- El motivo aparecerá en el resumen de cierre y en el payload usado para el
  resumen clínico del paciente.

No se creará un tratamiento ficticio para representar la ausencia de
tratamiento.

## 8. Backend y contrato

El backend deberá:

- Crear y ejecutar una migración para teléfono nullable y los nuevos campos.
- Mantener `CreatePatientDto.primaryPhone` obligatorio para el endpoint
  operativo.
- Añadir los campos de diagnóstico y enrolamiento a entidades, DTOs,
  validaciones y respuestas.
- Aplicar limpieza/consistencia condicional en `EnrollmentsService`.
- Validar relaciones de centros de salud.
- Incluir los nuevos datos en la información utilizada para el resumen
  clínico.
- Regenerar `openapi/openapi.json` antes de actualizar el frontend.

Las cargas históricas continuarán sin webhooks ni automatizaciones operativas.

## 9. Frontend y pruebas

El frontend deberá:

- Recibir el modo histórico en los pasos que tienen comportamiento específico.
- Construir el payload con campos nulos omitidos donde corresponda.
- Mantener etiquetas legibles mediante `items` en los `Select` raíz.
- Actualizar el resumen de cierre.
- Preservar el borrador al navegar y permitir reiniciarlo manualmente.

Se cubrirán:

- Contacto paciente, familiar y contacto secundario.
- Teléfono histórico ausente y teléfono requerido cuando el paciente es
  contacto principal.
- `No menciona` y `No recuerda`.
- Ruta de derivación y referencia.
- Centro de consultas y creación de hospital.
- Nota de no asistencia.
- Tratamiento actual y motivo.
- Persistencia y reinicio del borrador.
- Payload operativo e histórico.

## 10. Fuera de alcance

- Observación 44: contenido adicional de psicooncología antes del cierre.
- Importación automática de archivos.
- Cambios en las reglas de fechas futuras de formularios operativos.
