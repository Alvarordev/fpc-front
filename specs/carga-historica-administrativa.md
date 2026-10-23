# Spec: carga histórica administrativa

**Estado:** En implementación
**Fecha:** 2026-09-01
**Fuente funcional:** decisión de producto sobre migración manual de datos legacy
**Repositorios:** `fpc-front` y `fpc-backend`

Esta especificación reemplaza explícitamente cualquier criterio contradictorio
de `specs/observaciones-crm-tercera-reunion.md` para la carga histórica.

## 1. Objetivo

Permitir que una persona administradora reconstruya manualmente la historia
completa de un paciente que existía antes del CRM, sin alterar los formularios
operativos actuales ni presentar los datos históricos como actividad futura.

La carga debe conservar la fecha real del hecho, sus relaciones y su estado,
manteniendo `createdAt`/`updatedAt` como timestamps técnicos de auditoría.

## 2. Decisiones cerradas

1. `createdAt` no es una fecha de negocio. Representa cuándo se persistió el
   registro en el CRM.
2. `updatedAt` no es una fecha de negocio. Representa la última modificación
   dentro del CRM.
3. Cada evento usará su fecha de negocio canónica: `enrolledOn`,
   `scheduledAt`, `completedAt`, `dueAt`, `appointmentDate`, `diagnosisDate`,
   `startDate`, `endDate`, `affiliatedAt`, `validFrom`, `validTo` u otra fecha
   específica del dominio.
4. Cuando solo se conozca el día, se almacenará un campo PostgreSQL `date` y la
   interfaz mostrará `Hora no registrada`. No se inventará una hora.
5. Cuando no se conozca ninguna fecha de negocio, el registro se marcará como
   fecha desconocida/aproximada; no se presentará silenciosamente
   `createdAt` como si fuera la fecha del hecho.
6. La pantalla histórica será exclusiva de `ADMIN` y estará separada de los
   formularios operativos mediante el modo administrativo, no mediante reglas
   duplicadas.
7. El modo histórico usará las mismas ramas, dependencias, validaciones,
   etiquetas y reglas de payload del wizard de enrolamiento.
8. Los formularios operativos actuales no permitirán fechas pasadas nuevas por
   efecto de este trabajo.
9. La organización cargará los datos manualmente. No se construirá un
   importador de CSV, Excel o base de datos externa en esta fase.
10. Las sesiones psicooncológicas antiguas usarán disponibilidades sintéticas
    marcadas como históricas y reservadas.
11. Las disponibilidades históricas no aparecerán como cupos seleccionables ni
    se mezclarán con la agenda futura.
12. Existirá un voluntario de sistema anónimo para sesiones cuyo profesional
    original no esté identificado. No tendrá acceso de login ni aparecerá en
    selectores operativos.
13. Las cargas históricas no dispararán webhooks n8n, notificaciones ni tareas
    operativas automáticas. Sí invalidarán resúmenes derivados del paciente.
14. El backend se cambiará antes de regenerar y consumir el contrato OpenAPI
    desde el frontend.

## 3. Alcance funcional

La página administrativa permitirá:

- Buscar un paciente existente por nombre o DNI.
- Crear un paciente nuevo usando las mismas reglas del enrolamiento.
- Registrar el enrolamiento histórico y su fecha real.
- Capturar contactos, consentimiento, categoría clínica, síntomas,
  diagnósticos, tratamientos, seguros/SIS, citas y datos de soporte del
  enrolamiento.
- Añadir después del enrolamiento seguimientos, recordatorios, citas médicas y
  sesiones psicooncológicas históricas.
- Ver el historial existente del paciente en modo solo lectura.
- Ver el borrador histórico separado del historial ya guardado.
- Revisar las relaciones y fechas antes de cada guardado.
- Guardar el caso inicial y cada evento posterior sin salir de la página.

## 4. Modelo temporal

### 4.1 Auditoría versus negocio

Todos los registros conservarán:

```text
createdAt  = momento en que el CRM recibió el registro
updatedAt  = última modificación dentro del CRM
```

Ningún DTO operativo ni histórico aceptará `createdAt` como fecha editable.
Solo una herramienta de migración de infraestructura podría modificar
timestamps técnicos, fuera de esta pantalla.

### 4.2 Fecha de enrolamiento

`enrollments.enrolled_on DATE NOT NULL` será la fecha real en que el paciente
ingresó al programa. En el wizard normal se completará con la fecha actual si
no se proporciona. En la carga histórica será obligatoria y editable.

`followUp.completedAt` continuará representando el fin de la llamada de
enrolamiento. Puede coincidir con `enrolledOn`, pero no reemplaza ese concepto.

### 4.3 Fechas existentes

- `follow_ups`: `scheduledAt` para la programación y `completedAt` para el
  resultado del contacto.
- `reminders`: `dueAt` para el vencimiento y `completedAt` para el cierre.
- `patient_medical_appointments`: `appointmentDate` y `appointmentTime` para
  la consulta, más sus fechas de control.
- `psychooncology_appointments`: `scheduledAt` y `completedAt`.
- Diagnósticos, tratamientos, medicamentos, seguros y direcciones: conservar
  sus fechas de diagnóstico, inicio, fin y vigencia.
- Eventos sin fecha de negocio propia: usar una fecha efectiva explícita o la
  fecha del `followUp` al que pertenecen, dejando claro cuándo es aproximada.

### 4.4 Consultas y reportes

Las siguientes superficies usarán fechas de negocio y no `createdAt` como
referencia de hechos:

- `DashboardService`.
- `DashboardIndicatorsService`.
- `PatientTimelineService`.
- Ordenamientos y filtros de pacientes, seguimientos, citas, recordatorios y
  eventos clínicos.
- Duraciones entre enrolamiento, SIS, primera consulta, diagnóstico y
  tratamiento.

`createdAt` podrá usarse como segundo criterio de orden estable y como dato de
auditoría. Para rangos se conservará `[desde, hasta)` en `America/Lima`.

## 5. Experiencia de usuario

### 5.1 Ruta y acceso

- Ruta: `/carga-historica`.
- Guard de frontend: solo `ADMIN`.
- Controller backend: solo `UserRole.ADMIN`.
- Entrada de navegación: grupo `Administración`, separada de `Enrolamiento`.

### 5.2 Un solo shell

La pantalla será una sola experiencia de trabajo. No se abrirán páginas nuevas
para cada tipo de dato.

El shell tendrá cuatro fases internas:

1. **Paciente:** existente o nuevo.
2. **Enrolamiento:** los ocho pasos del wizard actual.
3. **Historia posterior:** eventos añadidos cronológicamente.
4. **Revisión:** resumen final y relaciones antes de guardar.

La navegación entre fases será interna al shell; el paciente y el borrador
permanecerán visibles.

### 5.3 Reutilización de reglas

El modo histórico reutilizará:

- `EnrollmentDraft` y su normalización.
- `buildEnrollmentPayload` y sus validaciones.
- Visibilidad condicional de `step-5-datos.tsx` y `step-7-atencion.tsx`.
- Reglas de edad, acompañante, contacto principal/secundario y consentimiento.
- Reglas de seguro/SIS.
- Dependencias diagnóstico → tratamiento → medicamento.
- Dependencias de categoría clínica y estado de consulta.
- Etiquetas de enums y `items` en los `Select` raíz.

La diferencia del modo histórico será:

- Mostrar `Fecha del enrolamiento` en el paso inicial.
- Permitir fechas de negocio anteriores.
- Mostrar textos de contexto histórico y no de agenda futura.
- Enviar al endpoint administrativo, sin automatizaciones operativas.

### 5.4 Historia posterior

Después de guardar el enrolamiento se podrá seleccionar:

- Seguimiento.
- Recordatorio.
- Cita médica.
- Sesión psicooncológica.

Cada formulario mostrará primero `Fecha del hecho` y luego los campos que
dependan de sus elecciones. Las tarjetas del borrador mostrarán tipo, fecha,
estado, relaciones y acciones de editar/eliminar antes de guardar.

La pantalla mostrará tres estados visuales distintos:

- **Historial registrado:** datos existentes, solo lectura.
- **Borrador histórico:** datos preparados pero aún no guardados.
- **Auditoría:** `createdAt`, `updatedAt` y usuario que cargó el dato.

### 5.5 Fechas sin hora

Los inputs `type="date"` no se convertirán mediante `new Date()` ni
`toISOString()`. Se enviarán como `YYYY-MM-DD`. Para timestamps opcionales se
mostrarán controles independientes de fecha y hora, permitiendo dejar la hora
vacía.

## 6. API administrativa

Se creará un módulo administrativo histórico con endpoints protegidos para
`ADMIN`. Los endpoints normales conservarán sus permisos y reglas actuales.

### 6.1 Enrolamiento

```text
POST /historical-records/enrollments
```

Body: el payload completo del enrolamiento actual más:

```text
enrolledOn: YYYY-MM-DD
```

El endpoint deberá crear paciente, relaciones, seguimiento de enrolamiento y
registros clínicos en una transacción. No enviará `buildRegistroEnvelope` a
n8n.

### 6.2 Eventos posteriores

```text
POST /historical-records/follow-ups
POST /historical-records/reminders
POST /historical-records/medical-appointments
POST /historical-records/psychooncology-appointments
```

Todos aceptarán estados y fechas históricas explícitos. Los endpoints deberán
validar relaciones con el paciente y ejecutar invalidación de resumen sin
aplicar restricciones de futuro propias de la operación normal.

### 6.3 Psicooncología

La carga histórica deberá:

1. Resolver el voluntario real o el voluntario anónimo de sistema.
2. Crear una disponibilidad sintética con `isHistorical = true` y estado
   `RESERVED`.
3. Crear la sesión con `scheduledAt`, `completedAt`, estado, número, modalidad
   y resultados proporcionados.
4. No ejecutar `slotDate`, `reserveAndCreate` ni validaciones de cupos futuros.

`availabilityId` seguirá siendo obligatorio en la entidad; la disponibilidad
sintética mantiene la integridad referencial sin contaminar cupos futuros.

### 6.4 Voluntario anónimo

`volunteers.is_anonymous BOOLEAN NOT NULL DEFAULT false` identificará el perfil
de sistema. La semilla/migración deberá crear exactamente uno, con usuario
inactivo y sin credenciales utilizables.

Las listas operativas excluirán perfiles anónimos. Las consultas históricas y
las respuestas de sesiones conservarán el nombre visible `Voluntario no
identificado`.

## 7. Validaciones y seguridad

- El backend no confiará en que el frontend oculte campos; validará cada DTO.
- Solo `ADMIN` podrá crear registros históricos.
- No se permitirá elegir el voluntario anónimo en endpoints normales.
- No se permitirá usar disponibilidades históricas para una sesión futura.
- Las fechas finales no podrán ser anteriores a sus fechas iniciales cuando
  ambas estén informadas.
- Las relaciones paciente, acompañante, agente, diagnóstico, tratamiento y
  seguimiento deberán pertenecer al contexto correcto.
- Los guardados compuestos serán transaccionales.
- Los webhooks y automatizaciones quedarán fuera del flujo histórico.

## 8. Cambios de contrato y frontend

Después del backend:

1. Ejecutar `npm run openapi:generate` en `fpc-backend`.
2. Ejecutar `npm run api:generate` en `fpc-front`.
3. Añadir API clients/hooks para endpoints históricos.
4. Añadir la ruta, navegación y pantalla administrativa.
5. Mantener los formularios operativos sin cambios funcionales.

## 9. Pruebas de aceptación

- Un `AGENT`, `FOUNDATION` o `VOLUNTEER` no puede acceder a la carga histórica.
- Un administrador puede crear un paciente nuevo usando las mismas ramas del
  enrolamiento normal.
- Al cambiar categoría, seguro, edad o estado de consulta aparecen exactamente
  los campos correspondientes.
- Una fecha histórica aparece como fecha del hecho, no como fecha de carga.
- `createdAt` de un registro histórico corresponde al momento de carga.
- El dashboard no cuenta una carga de septiembre como enrolamiento de
  septiembre si `enrolledOn` pertenece a enero.
- El timeline ordena por fecha efectiva y conserva `createdAt` como auditoría.
- Una sesión psicooncológica antigua se visualiza con disponibilidad histórica
  y no aparece como cupo futuro.
- El voluntario anónimo no aparece en agendas ni selectores operativos.
- Un caso histórico no dispara webhooks n8n.
- Un error en cualquier evento compuesto revierte toda la transacción.
- Las fechas sin hora no cambian de día por zona horaria.
- `npm run build`, `npm run openapi:check`, pruebas backend y pruebas frontend
  pasan.

## 10. Fuera de alcance

- Importación automática desde archivos o base legacy.
- Modificación de reglas de fechas de formularios operativos.
- Edición directa de `createdAt` desde la interfaz.
- Reconstrucción automática de datos históricos ambiguos.
- Nuevos eventos de n8n para cargas históricas.
