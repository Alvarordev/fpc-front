# Migración al backend Nest

## Estado actual

Las rutas de usuarios, hospitales, alertas, Call Center, voluntarios, enrolamiento y dashboard ya consumen contratos OpenAPI/Nest. La base local tiene aplicadas las migraciones hasta `1784870000000-AddPatientSocialFieldsAndOrderingIndex`.

## Implementado: pacientes y seguimientos

1. `GET /patients` devuelve diagnóstico actual, departamento y último seguimiento mediante una proyección Nest paginada, sin N+1.
2. `GET /patients/:id` devuelve detalles, diagnósticos, tratamientos, seguros, SIS, citas médicas, síntomas y acompañantes.
3. Se añadieron los campos sociales en `patient_details`: violencia doméstica, cocina a leña, trabajo, apoyo económico, CONADIS, FISSAL y datos de abandono; se conserva la derivación a trabajo social.
4. El listado, ficha, agenda, disponibilidad y pacientes de voluntario usan DTOs OpenAPI en sus flujos activos.
5. La ruta activa de seguimiento es `/pacientes/:id/seguimientos/:followUpId`; valida que el seguimiento pertenezca al paciente.
6. Recordatorios admiten el filtro `patientId`; psicooncología utiliza el filtro `patientId` existente.
7. Se retiraron hooks, componentes y pruebas muertos del flujo legacy de contacto.

## Bloque prioritario: pacientes y seguimientos

1. Eliminar tipos, clientes y módulos `Contact/contactId` que se mantienen para scripts y consumidores legacy no migrados.
2. Retirar el adaptador `src/lib/api/patients.ts` cuando sus últimos consumidores migren a OpenAPI.
3. Añadir pruebas e2e de la proyección de pacientes, ficha clínica, recordatorios y permisos de voluntario.

## Rutas aún pendientes

1. Migrar `/disponibilidad` a los endpoints OpenAPI de disponibilidad (GET, POST y DELETE).
2. Migrar la vista de pacientes de voluntario a `psychooncologyAppointmentsApi` y eliminar la consulta legacy de citas.
3. Migrar Agenda y el topbar al cliente generado de pacientes; evitar resoluciones N+1 donde sea posible.

## Infraestructura a retirar

1. Extraer la gestión de token, expiración y cierre de sesión desde `lib/api-client` a un módulo neutral.
2. Añadir manejo centralizado de respuestas `401` al cliente OpenAPI.
3. Retirar `src/lib/api/*`, el transporte HTTP genérico y el proxy `/api` una vez que no tengan consumidores.
4. Reescribir scripts mock contra las rutas y DTOs Nest.
5. Añadir una comprobación que prohíba nuevas rutas `/api/`, `contactsApi`, `Contact` y `contactId` en código de aplicación.

## Validación posterior

1. Completar validación por pasos del wizard de enrolamiento.
2. Agregar pruebas e2e para las proyecciones de pacientes, la ficha, filtros de recordatorios y permisos de voluntario.
3. Agregar pruebas frontend para listado, ficha, seguimientos y disponibilidad.
4. Regenerar OpenAPI, ejecutar migraciones, tests y builds.
5. Reconstruir los contenedores preservando el volumen de PostgreSQL.
