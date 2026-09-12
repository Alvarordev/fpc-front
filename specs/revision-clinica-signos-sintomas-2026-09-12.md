# Spec: revisión clínica de signos, síntomas y seguimiento no oncológico

**Estado:** Aprobado para implementación
**Fecha:** 2026-09-12
**Fuente funcional:** revisión de producto solicitada para `/carga-historica` y enrolamiento
**Repositorios:** `fpc-front` y `fpc-backend`

Este documento es la fuente de verdad para la revisión clínica definida en esta
fecha. Complementa las reglas administrativas de
`specs/carga-historica-administrativa.md` y reemplaza, dentro de su alcance, las
reglas contradictorias de `specs/observaciones-crm-tercera-reunion.md` y
`specs/observaciones-migracion-36-43.md`.

La carga histórica mantiene sus reglas de fechas, auditoría, permisos y
automatizaciones descritas en su spec específica. Esta spec solo modifica la
captura y proyección de la información clínica indicada aquí.

## 1. Objetivo

Actualizar la captura de signos y síntomas en el enrolamiento y en
`/carga-historica/nuevo`, conservar sus respuestas en el seguimiento del
paciente y mostrar una única representación clínica en la ficha, el resumen y
la línea de tiempo.

La revisión también debe permitir registrar y seguir un diagnóstico no
oncológico cuando la búsqueda de cáncer sea descartada, sin crear diagnósticos
oncológicos ficticios ni mezclar un proceso longitudinal con un reporte
puntual de síntomas.

## 2. Alcance

Se modificarán:

- El paso 7 del enrolamiento.
- El mismo paso 7 cuando se use el modo histórico.
- El payload, las validaciones y el store compartidos por ambos modos.
- El editor de síntomas de seguimientos históricos.
- La pestaña de síntomas de `/pacientes/:id/seguimientos/:seguimientoid`.
- El resumen clínico, la línea de tiempo y los indicadores relacionados.
- Los DTOs, la persistencia y el contrato OpenAPI necesarios.

No se modificará en esta fase:

- El bloque `CANCER_DIAGNOSIS` del paso 7.
- Las reglas de fechas históricas administrativas.
- El flujo de soporte emocional ya existente.
- La automatización de notificaciones, webhooks o tareas operativas.
- La creación de diagnósticos o tratamientos oncológicos formales a partir de
  respuestas preliminares.

## 3. Decisiones cerradas

### 3.1 Duración y frecuencia de síntomas

Las preguntas de duración y frecuencia propias de los síntomas se ocultarán en
el frontend:

- `symptomDuration`.
- `symptomFrequency`.

Estos campos dejarán de ser requeridos en los DTOs de creación y actualización.
Continuarán siendo opcionales en las respuestas y en la persistencia para
mantener compatibilidad con registros históricos ya guardados.

Cuando una captura nueva no los envíe:

- No se mostrarán inputs equivalentes en enrolamiento ni carga histórica.
- El backend no exigirá valores.
- Un PATCH que no incluya esos campos no podrá borrar valores legacy existentes.
- La UI no reinterpretará un valor histórico como una respuesta nueva.

Esta decisión no elimina `diagnosisSearchDuration` ni
`reportedTreatmentFrequency`. Esos campos describen, respectivamente, la
búsqueda de diagnóstico y un tratamiento reportado; no son la duración ni la
frecuencia de los síntomas.

### 3.2 Semántica de respuestas desconocidas

Para los campos booleanos que admitan la opción `No menciona`:

| Respuesta visible | Valor persistido |
| --- | --- |
| Sí | `true` |
| No | `false` |
| No menciona | `null` |

`No menciona` es una representación de interfaz. No se persistirá un sentinel
de texto como `NO_MENCIONA` en una columna booleana y no se creará un catálogo
artificial para este caso.

La diferencia entre `false`, `null` y ausencia de una propiedad deberá
mantenerse en los DTOs y servicios donde el dato sea clínicamente relevante.
Los formularios no podrán convertir automáticamente una respuesta desconocida
en `false`.

Para la pregunta de ficha de remisión se mostrarán explícitamente las tres
opciones `Sí`, `No` y `No menciona`, usando esta misma semántica.

### 3.3 Nuevo flujo de consulta médica

La nueva secuencia reemplaza únicamente el flujo de
`SIGNS_AND_SYMPTOMS`. El flujo `CANCER_DIAGNOSIS`, que corresponde a pacientes
ya diagnosticados, conserva sus preguntas actuales hasta una revisión
independiente.

La nueva secuencia reemplaza las preguntas antiguas de estado de consulta,
diagnóstico informado, próxima consulta y próxima especialidad. Los conceptos
clínicos que sigan siendo necesarios se capturarán mediante las preguntas
condicionales nuevas, no mediante el flujo legacy.

### 3.4 Seguimiento no oncológico

El seguimiento no oncológico tendrá una entidad clínica propia. No se modelará
como:

- Un registro de `PatientDiagnosis` oncológico.
- Un registro de `PatientTreatment` oncológico ficticio.
- Campos longitudinales agregados a `PatientSymptomReport`.

La entidad se vinculará al paciente y al enrolamiento o seguimiento que originó
el dato. Podrá tener varios controles y conservará su historial hasta que se
registre el alta.

El estado `RULED_OUT` continuará representando el resultado de la búsqueda
diagnóstica de cáncer. No se interpretará automáticamente como alta del
seguimiento no oncológico.

### 3.5 Selects

Todo `<Select>` nuevo cuyo `value` sea un ID, código o enum con una etiqueta
distinta deberá recibir `items` en el `<Select>` raíz, además de renderizar sus
`SelectItem`. Se aplicará especialmente a establecimientos, especialidades,
estados y periodicidades.

## 4. Nuevo flujo de signos y síntomas

### 4.1 Malestar o dolor

La pregunta `¿Presenta algún malestar o dolor?` tendrá tres respuestas:

- `Sí`: `hasDiscomfort = true`.
- `No`: `hasDiscomfort = false`.
- `No menciona`: `hasDiscomfort = null`.

Cuando la respuesta sea `Sí`, se conservarán las preguntas clínicas existentes
que describen el malestar o el dolor, excepto duración y frecuencia. Cuando sea
`No` o `No menciona`, no se solicitarán detalles adicionales nuevos.

Al cambiar una respuesta durante una captura nueva, el formulario limpiará los
valores dependientes que ya no aplican. Al editar un registro histórico, la
actualización deberá ser explícita y no podrá eliminar silenciosamente campos
que no estén representados en el formulario.

### 4.2 Consulta posterior a síntomas

Después de signos y síntomas se preguntará:

`¿Realizó una consulta médica?`

Cuando la respuesta sea `Sí`, se mostrarán, en este orden:

1. Establecimiento de salud.
2. Especialidad.
3. Fecha de la primera consulta.
4. Si se encuentra a la espera de un diagnóstico.
5. Si tiene ficha de remisión, con `Sí`, `No` o `No menciona`.
6. Si tiene ficha de remisión, a qué establecimiento fue derivado.
7. Si no tiene ficha de remisión, el motivo.
8. Si le informaron un diagnóstico.
9. El diagnóstico informado, cuando la respuesta anterior sea `Sí`.
10. La fecha de la próxima consulta.

Cuando la respuesta sea `No`, se mostrará únicamente el motivo de no haber
realizado una consulta médica.

Reglas condicionales:

- El establecimiento, la especialidad y la fecha de primera consulta serán
  requeridos solo cuando la respuesta sea `Sí`.
- `referredHealthCenterId` será requerido solo cuando `hasReferral = true`.
- `referralNotProvidedReason` será requerido solo cuando `hasReferral = false`.
- Cuando `hasReferral = null`, no se exigirán ni centro derivado ni motivo.
- El diagnóstico informado solo se solicitará cuando la respuesta indique que
  existe un diagnóstico.
- La próxima consulta conservará la fecha, pero no tendrá una pregunta de
  próxima especialidad en este flujo.
- Al cambiar una respuesta, el payload omitirá los campos que dejaron de
  aplicar y no enviará valores inventados.

Los nombres finales de DTO deberán expresar estas reglas sin reutilizar
`consultationStatus` como estado obligatorio. Las columnas legacy podrán
permanecer para lectura y compatibilidad mientras no contradigan la nueva
respuesta canónica.

## 5. Estado de búsqueda diagnóstica

Se conservarán los estados diagnósticos existentes:

- `SEARCHING`: `EN BÚSQUEDA`.
- `CONFIRMED`: `EN BÚSQUEDA - ENCONTRADO`.
- `RULED_OUT`: `EN BÚSQUEDA - DESCARTADO`.

La ficha de seguimiento y el resumen mostrarán el estado vigente y la fecha del
evento que lo produjo. El estado debe aparecer al final del apartado de
síntomas, junto con el indicador clínico correspondiente.

### 5.1 Indicadores 6 y 7

Los indicadores conservarán la numeración funcional de la auditoría de la
tercera reunión:

- **Indicador 6:** personas con enfermedad oncológica descartada por soporte del
  programa. Se contará el último evento `RULED_OUT` del paciente cuando
  `supportedBySepa = true`.
- **Indicador 7:** personas diagnosticadas con cáncer por soporte del programa.
  Se contará el último evento `CONFIRMED` del paciente cuando
  `supportedBySepa = true` y exista el diagnóstico formal requerido.

Los estados `RULED_OUT` o `CONFIRMED` sin `supportedBySepa = true` seguirán
siendo estados clínicos válidos, pero no se contabilizarán en los indicadores 6
y 7. La ficha mostrará el estado clínico y la indicación de soporte cuando el
dato exista, sin duplicar eventos.

No se debe confundir `PatientDiagnosticStatus.SEARCHING` con
`TreatmentSituation.SEARCHING`. Son dominios diferentes y no se convertirán
automáticamente entre sí.

Para cargas históricas, el evento de estado diagnóstico deberá conservar la
fecha de negocio disponible y la relación con el seguimiento histórico que lo
originó. No se usará `createdAt` como sustituto silencioso de esa fecha.

## 6. Entidad de seguimiento no oncológico

Se creará una entidad equivalente a
`PatientNonOncologicalFollowUp`, con una relación al paciente y referencias
opcionales al enrolamiento, seguimiento y evento de descarte de origen.

El modelo mínimo deberá soportar:

- Diagnóstico no oncológico.
- Fecha del hecho o fecha efectiva histórica.
- Si recibe tratamiento: `true`, `false` o `null` cuando no menciona.
- Nombre del tratamiento, opcional.
- Medicación, opcional.
- Frecuencia del tratamiento, nullable y estructurada cuando sea posible.
- Si mantiene controles: `true`, `false` o `null` cuando no menciona.
- Especialidad de control, requerida cuando mantiene controles.
- Periodicidad de control, requerida cuando mantiene controles.
- Estado longitudinal: `ACTIVE` o `DISCHARGED`.
- Fecha y motivo del alta.
- Timestamps técnicos de auditoría.

Reglas de captura:

- `treatmentName` y `medication` no se exigirán cuando no recibe tratamiento.
- La frecuencia no se exigirá cuando no recibe tratamiento o no la menciona.
- La especialidad y periodicidad no se exigirán cuando no mantiene controles.
- Un registro activo seguirá visible en el resumen y en la ficha.
- Un registro dado de alta dejará de aparecer como pendiente, pero permanecerá
  visible en la historia clínica.
- La transición a `RULED_OUT` no creará por sí sola datos clínicos inventados;
  la entidad se creará o actualizará con las respuestas efectivamente
  capturadas.

La migración deberá incluir índices por paciente, estado y fecha efectiva para
que la ficha pueda obtener el registro activo sin duplicar resultados.

## 7. Ficha, resumen y línea de tiempo

### 7.1 Seguimiento del paciente

En `/pacientes/:id/seguimientos/:seguimientoid`, la pestaña de síntomas
mostrará una sección diferenciada de `Respuestas del enrolamiento` y otra del
seguimiento actual o histórico.

La sección de enrolamiento será de lectura y usará el registro persistido. No
se copiarán sus valores a un nuevo reporte sintomático ni se crearán registros
duplicados al guardar el seguimiento.

La sección mostrará, cuando existan:

- Respuesta de malestar o dolor.
- Síntomas y dolor capturados.
- Consulta médica y sus datos condicionales.
- Estado de búsqueda diagnóstica.
- Seguimiento no oncológico activo o histórico.

### 7.2 Antecedentes y comorbilidades

Los antecedentes y comorbilidades deberán aparecer una sola vez en la ficha y
en el resumen clínico. Guardar cualquier pestaña clínica deberá actualizar la
misma fuente de datos, no insertar una copia paralela.

### 7.3 Resumen y cache

Después de guardar o actualizar datos clínicos se invalidarán o refrescarán las
consultas de:

- Paciente.
- Resumen estructurado.
- Resumen generado.
- Seguimientos.
- Línea de tiempo.
- Indicadores que dependan del estado clínico.

El resumen generado no podrá continuar mostrando únicamente la versión
anterior durante el período normal de cache después de un guardado clínico.

El payload del resumen deberá incluir los campos clínicos nuevos y el estado
diagnóstico vigente sin repetir el mismo hecho en varias secciones.

### 7.4 Línea de tiempo

La línea de tiempo deberá proyectar:

- Cambios relevantes de estado diagnóstico.
- Creación, actualización y alta del seguimiento no oncológico.
- El reporte sintomático sin perder sus datos históricos disponibles.

Los eventos de síntomas, diagnóstico y seguimiento deberán conservar fechas de
negocio y referencias al seguimiento de origen.

## 8. Backend, contrato y migraciones

El backend se implementará y validará antes de actualizar el cliente generado
del frontend.

El trabajo contractual incluirá:

- DTOs de creación, actualización y respuesta para el seguimiento no
  oncológico.
- Validaciones condicionales de tratamiento, controles, remisión y diagnóstico.
- Endpoints para obtener, crear, actualizar y dar de alta el seguimiento.
- Inclusión del dato en el endpoint agregado del paciente.
- Inclusión del dato en históricos de enrolamiento y seguimientos.
- Campos opcionales de duración/frecuencia de síntomas en creación y
  actualización.
- Actualización de `openapi/openapi.json` y regeneración de
  `src/api/schema.d.ts`.

La entidad propia requiere una migración de base de datos. Los campos legacy de
síntomas no requieren migración si ya aceptan `NULL` y dejan de ser obligatorios
en DTOs y servicios.

No se editará manualmente `src/api/schema.d.ts`; se regenerará desde el contrato
OpenAPI siguiendo las reglas del repositorio.

## 9. Frontend

Se actualizarán como mínimo:

- `step-7-atencion.tsx` para la nueva captura y las condiciones de visibilidad.
- `step-8-payload.ts` para serializar `false`, `null` y los nuevos datos.
- `enrollment-store.ts` para normalizar el draft sin reintroducir campos
  ocultos.
- `step-8-payload.test.ts` para cubrir los nuevos caminos.
- `build-historical-clinical-payload.ts` para alta, edición y preservación
  histórica.
- `historical-follow-up-dialog.tsx` para editar el seguimiento no oncológico.
- `clinical-data-tabs.tsx` y `clinical-drafts.ts` para mostrar las respuestas
  del enrolamiento sin duplicarlas.
- `follow-up-content.tsx` para persistir y refrescar todas las superficies.
- `overview-section.tsx` y los componentes de timeline para proyectar los datos.

Los valores omitidos por una condición no se enviarán como texto vacío ni como
`false` por defecto. Las actualizaciones deberán distinguir entre campo no
modificado y campo explícitamente limpiado.

## 10. Pruebas y criterios de aceptación

### 10.1 Síntomas y consulta

- `No menciona` se serializa como `null`.
- `No` se serializa como `false`.
- Duración y frecuencia de síntomas no aparecen en el frontend.
- Los DTOs no requieren duración ni frecuencia.
- Los valores legacy no desaparecen al editar un registro con el formulario
  reducido.
- El flujo `SIGNS_AND_SYMPTOMS` valida correctamente las ramas Sí y No.
- La ficha de remisión valida las tres respuestas y sus campos dependientes.
- El flujo `CANCER_DIAGNOSIS` permanece sin regresiones.

### 10.2 Seguimiento no oncológico

- `RULED_OUT` puede relacionarse con un seguimiento no oncológico real.
- Tratamiento y controles validan sus campos dependientes.
- Un registro activo aparece en la ficha y el resumen.
- Un registro dado de alta conserva su historial y deja de aparecer como
  pendiente.
- La carga histórica conserva la fecha de negocio y la relación de origen.

### 10.3 Sincronización clínica

- Las respuestas del enrolamiento aparecen en la pestaña de síntomas del
  seguimiento.
- Guardar síntomas, antecedentes o tratamientos actualiza el resumen sin
  insertar duplicados.
- La línea de tiempo refleja estados diagnósticos y seguimiento no oncológico.
- Las queries de ficha, resumen, timeline y seguimientos se invalidan después
  de un guardado exitoso.

### 10.4 Verificación técnica

- Tests unitarios de frontend y backend.
- Build del frontend y backend.
- Comprobación y regeneración de OpenAPI.
- Ejecución de la migración en una base de prueba.
- Pruebas de regresión para la carga histórica existente.

## 11. Fuera de alcance explícito

- Reescribir el flujo `CANCER_DIAGNOSIS`.
- Convertir automáticamente todos los descartes históricos en diagnósticos no
  oncológicos.
- Crear tratamientos oncológicos a partir de tratamientos reportados.
- Introducir una nueva semántica para duración de búsqueda diagnóstica o
  frecuencia del tratamiento reportado.
- Cambiar las reglas generales de fechas, permisos o automatizaciones de la
  carga histórica.
