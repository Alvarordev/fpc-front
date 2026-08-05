# Migración al backend Nest

## Estado actual

La migración a Nest está completa a nivel de código de aplicación: todas las rutas (usuarios, hospitales, alertas, Call Center, voluntarios, disponibilidad, agenda, enrolamiento, pacientes, seguimientos y dashboard) consumen contratos OpenAPI/Nest. No queda transporte HTTP legacy, tipos `Contact`/`contactId`, ni proxy `/api` en el código de aplicación. La base local tiene aplicadas las migraciones hasta `1784870000000-AddPatientSocialFieldsAndOrderingIndex`.

## Implementado: pacientes y seguimientos

1. `GET /patients` devuelve diagnóstico actual, departamento y último seguimiento mediante una proyección Nest paginada, sin N+1.
2. `GET /patients/:id` devuelve detalles, diagnósticos, tratamientos, seguros, SIS, citas médicas, síntomas y acompañantes.
3. Se añadieron los campos sociales en `patient_details`: violencia doméstica, cocina a leña, trabajo, apoyo económico, CONADIS, FISSAL y datos de abandono; se conserva la derivación a trabajo social.
4. El listado, ficha, agenda, disponibilidad y pacientes de voluntario usan DTOs OpenAPI en sus flujos activos.
5. La ruta activa de seguimiento es `/pacientes/:id/seguimientos/:followUpId`; valida que el seguimiento pertenezca al paciente.
6. Recordatorios admiten el filtro `patientId`; psicooncología utiliza el filtro `patientId` existente.
7. Se retiraron hooks, componentes y pruebas muertos del flujo legacy de contacto.
8. `/disponibilidad` usa `volunteersApi` (OpenAPI) para listar, crear y eliminar cupos.
9. La vista de pacientes de voluntario usa `psychooncologyAppointmentsApi` y `patientsApi` (OpenAPI); ya no depende de la consulta legacy de citas.
10. Agenda y el topbar usan el cliente generado de pacientes (`@/api/patients`).

## Infraestructura retirada

1. Se eliminó `src/lib/api/*` (12 módulos: `agents`, `alerts`, `appointments`, `auth`, `availability`, `contacts`, `health-centers`, `index`, `patients`, `recordatorios`, `users`, `volunteers`) — no tenían consumidores.
2. Se eliminó `src/lib/api-client.ts` (transporte HTTP genérico `apiFetch`/`apiGet`/`apiPost`/etc. y `ApiError`), muerto tras retirar `src/lib/api/*`.
3. La gestión de token, expiración y cierre de sesión vive ahora en el módulo neutral [`src/lib/auth-session.ts`](src/lib/auth-session.ts) (`getAccessToken`, `setAccessToken`, `clearAccessToken`, `isAccessTokenExpired`, `registerAuthExpiredHandler`, `expireAuthSession`).
4. El cliente OpenAPI (`src/api/client.ts`) maneja `401` de forma centralizada vía middleware `onResponse`, expirando la sesión salvo en `/auth/*` (que gestiona sus propios estados de error).
5. Se eliminaron los tipos `Contact`, `ContactSummary`, `ContactType`, `ContactStatus`, `ContactPurpose`, `ContactServiceReferralRequest`, `CreateContactRequest`, `UpdateContactRequest` y el resto del clúster de DTOs manuales del backend legacy en `src/types/index.ts` (Patient*, Alert, Reminder, PsychooncologyAppointment, HealthCenter y sus variantes Create/Update), confirmados sin consumidores vivos (sustituidos por los tipos generados en `src/api/*`). El archivo quedó con solo los ~20 tipos que el código de aplicación realmente importa.
6. Se retiró el proxy `/api` de `vite.config.ts` (quedan `/auth`, `/users`, `/agents`, que son rutas Nest reales usadas como fallback cuando `VITE_API_URL` está vacío).
7. Se reescribieron `scripts/seed-hospitales.mjs`, `scripts/update-mock-patients.mjs` y `scripts/seed-mock-patients.mjs` contra las rutas y DTOs Nest actuales (`/enrollments`, `/follow-ups`, `/patients/:id/diagnoses` con `followUpId`, `/psychooncology-appointments`, etc.), en vez del backend Java legacy (`/api/*`).
8. Se añadió `scripts/check-legacy-refs.mjs`, que prohíbe nuevas rutas `/api/`, `contactsApi`, `Contact` y `contactId` en `src/`, y se integró en `npm run lint`.

## Validación posterior

1. Completar validación por pasos del wizard de enrolamiento.
2. Agregar pruebas e2e para las proyecciones de pacientes, la ficha, filtros de recordatorios y permisos de voluntario.
3. Agregar pruebas frontend para listado, ficha, seguimientos y disponibilidad.
4. Regenerar OpenAPI, ejecutar migraciones, tests y builds.
5. Reconstruir los contenedores preservando el volumen de PostgreSQL.

## Notas

- Los scripts de `scripts/seed-mock-patients.mjs` y `scripts/update-mock-patients.mjs` no se han vuelto a ejecutar contra un backend Nest real tras la reescritura; antes de usarlos en un entorno compartido, correrlos primero contra un Nest local para confirmar los DTOs (especialmente `EnrollmentTreatmentDto`/`EnrollmentDiagnosisDto`, que pueden evolucionar junto con el backend).
